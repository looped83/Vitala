-- ============================================================================
-- Vitala · Migration 0007 · Activity & ritual RPC functions (Phase 3)
-- ----------------------------------------------------------------------------
-- The ONLY write path for activities, ritual check-ins and favourites (ADR-0020).
-- Every function is SECURITY DEFINER with a fixed empty search_path, derives the
-- household from the authenticated user (never trusts a client household id),
-- validates types/areas/participants, and writes atomically. NO XP / resource /
-- city logic is triggered here — Phase 3 captures data only (spec §20, §14).
--
-- Stable error codes (mapped to friendly messages in src/data/supabase/errors.ts):
--   not_authenticated · not_in_household · invalid_type · invalid_duration ·
--   invalid_date · invalid_participant · empty_selection · not_found ·
--   not_allowed · duplicate_ritual
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helpers (private schema): resolve the caller's active household + today.
-- ---------------------------------------------------------------------------
create or replace function app.current_household(p_user_id uuid default auth.uid())
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select hm.household_id
  from public.household_members hm
  where hm.user_id = p_user_id and hm.status = 'active'
  limit 1;
$$;

-- Today's date in the household timezone (day boundaries are local — §30).
create or replace function app.household_today(p_household_id uuid)
returns date
language sql
security definer
stable
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select hs.timezone from public.household_settings hs where hs.household_id = p_household_id),
    'Europe/Berlin'))::date;
$$;

revoke all on function app.current_household(uuid) from public;
revoke all on function app.household_today(uuid) from public;
grant execute on function app.current_household(uuid) to authenticated, service_role;
grant execute on function app.household_today(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- save_activity — insert (p_id null) or update a movement entry. Atomic:
-- base row + participant rows for shared entries. Returns the activity id.
-- ---------------------------------------------------------------------------
create or replace function public.save_activity(
  p_id uuid,
  p_activity_type_id uuid,
  p_occurred_on date,
  p_duration_min integer,
  p_intensity public.activity_intensity default null,
  p_started_at_time time default null,
  p_location text default null,
  p_note text default null,
  p_custom_label text default null,
  p_is_shared boolean default false,
  p_partner_user_id uuid default null,
  p_source public.entry_source default 'manual',
  p_idempotency_key uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_today date;
  v_group uuid;
  v_id uuid;
  v_existing public.activities;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  v_household := app.current_household(v_uid);
  if v_household is null then
    raise exception 'not_in_household' using hint = 'Du gehörst zu keinem aktiven Household.';
  end if;

  -- Type must exist, be active and belong to the movement area.
  if not exists (
    select 1 from public.activity_types t
    where t.id = p_activity_type_id and t.is_active and t.area = 'movement'
  ) then
    raise exception 'invalid_type' using hint = 'Unbekannter Bewegungstyp.';
  end if;

  if p_duration_min is null or p_duration_min < 5 or p_duration_min > 300 then
    raise exception 'invalid_duration' using hint = 'Dauer muss zwischen 5 und 300 Minuten liegen.';
  end if;

  v_today := app.household_today(v_household);
  if p_occurred_on is null or p_occurred_on > v_today or p_occurred_on < date '2020-01-01' then
    raise exception 'invalid_date' using hint = 'Datum darf nicht in der Zukunft liegen.';
  end if;

  -- Shared-entry participant validation.
  if p_is_shared then
    if p_partner_user_id is null or p_partner_user_id = v_uid then
      raise exception 'invalid_participant' using hint = 'Bitte eine zweite Person auswählen.';
    end if;
    if not app.is_active_member(v_household, p_partner_user_id) then
      raise exception 'invalid_participant' using hint = 'Die Person gehört nicht zu eurem Household.';
    end if;
  else
    p_partner_user_id := null;
  end if;

  -- Idempotent insert: replay of the same key returns the original row.
  if p_id is null and p_idempotency_key is not null then
    select a.id into v_id from public.activities a
    where a.household_id = v_household and a.idempotency_key = p_idempotency_key;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  if p_id is null then
    v_group := case when p_is_shared then gen_random_uuid() else null end;
    insert into public.activities (
      household_id, user_id, created_by, activity_type_id, occurred_on,
      started_at_time, duration_min, intensity, location, note, custom_label,
      is_shared, group_id, source, idempotency_key
    ) values (
      v_household, v_uid, v_uid, p_activity_type_id, p_occurred_on,
      p_started_at_time, p_duration_min, p_intensity, p_location, p_note, p_custom_label,
      p_is_shared, v_group, coalesce(p_source, 'manual'), p_idempotency_key
    )
    returning id into v_id;
  else
    select * into v_existing from public.activities
    where id = p_id and deleted_at is null;
    if v_existing.id is null then
      raise exception 'not_found';
    end if;
    if v_existing.household_id <> v_household then
      raise exception 'not_allowed';
    end if;
    -- Creator edits their own entry (household-scoped, identity fields locked).
    if v_existing.created_by <> v_uid then
      raise exception 'not_allowed' using hint = 'Nur die erfassende Person kann bearbeiten.';
    end if;
    v_group := coalesce(v_existing.group_id, case when p_is_shared then gen_random_uuid() else null end);
    update public.activities set
      activity_type_id = p_activity_type_id,
      occurred_on = p_occurred_on,
      started_at_time = p_started_at_time,
      duration_min = p_duration_min,
      intensity = p_intensity,
      location = p_location,
      note = p_note,
      custom_label = p_custom_label,
      is_shared = p_is_shared,
      group_id = case when p_is_shared then v_group else null end
    where id = p_id;
    v_id := p_id;
  end if;

  -- Reconcile participants: only for shared entries.
  delete from public.entry_participants
    where entry_kind = 'activity' and group_id = coalesce(v_group, '00000000-0000-0000-0000-000000000000');
  if p_is_shared then
    insert into public.entry_participants (household_id, entry_kind, group_id, user_id)
    values (v_household, 'activity', v_group, v_uid),
           (v_household, 'activity', v_group, p_partner_user_id)
    on conflict (entry_kind, group_id, user_id) do nothing;
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_household, v_uid,
    case when p_id is null then 'activity_created' else 'activity_updated' end,
    'activity', v_id, jsonb_build_object('is_shared', p_is_shared));

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- save_ritual_checkin — insert (p_group_id null) or replace a ritual check-in
-- for one area. A check-in is a set of ritual_entries sharing entry_group_id.
-- Stored ONCE for shared entries (attributed via participants). Returns group id.
-- ---------------------------------------------------------------------------
create or replace function public.save_ritual_checkin(
  p_group_id uuid,
  p_area public.life_area,
  p_definition_ids uuid[],
  p_occurred_on date,
  p_note text default null,
  p_meal_label text default null,
  p_custom_label text default null,
  p_is_shared boolean default false,
  p_partner_user_id uuid default null,
  p_source public.entry_source default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_today date;
  v_group uuid;
  v_def_ids uuid[];
  v_valid_count integer;
  v_def uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_area = 'movement' then
    raise exception 'invalid_type' using hint = 'Bewegung wird als Aktivität erfasst.';
  end if;

  v_household := app.current_household(v_uid);
  if v_household is null then
    raise exception 'not_in_household';
  end if;

  -- Distinct, non-null selection.
  select array_agg(distinct d) into v_def_ids
  from unnest(coalesce(p_definition_ids, '{}'::uuid[])) as d
  where d is not null;
  if v_def_ids is null or array_length(v_def_ids, 1) < 1 then
    raise exception 'empty_selection' using hint = 'Bitte mindestens einen Baustein auswählen.';
  end if;

  -- Every chosen definition must be active and belong to the given area.
  select count(*) into v_valid_count
  from public.ritual_definitions rd
  where rd.id = any(v_def_ids) and rd.is_active and rd.area = p_area;
  if v_valid_count <> array_length(v_def_ids, 1) then
    raise exception 'invalid_type' using hint = 'Ungültige Auswahl für diesen Bereich.';
  end if;

  v_today := app.household_today(v_household);
  if p_occurred_on is null or p_occurred_on > v_today or p_occurred_on < date '2020-01-01' then
    raise exception 'invalid_date';
  end if;

  if p_is_shared then
    if p_partner_user_id is null or p_partner_user_id = v_uid then
      raise exception 'invalid_participant';
    end if;
    if not app.is_active_member(v_household, p_partner_user_id) then
      raise exception 'invalid_participant';
    end if;
  else
    p_partner_user_id := null;
  end if;

  if p_group_id is null then
    v_group := gen_random_uuid();
  else
    -- Editing: the group must exist for this household and belong to the caller.
    if not exists (
      select 1 from public.ritual_entries re
      where re.entry_group_id = p_group_id and re.household_id = v_household
        and re.deleted_at is null
    ) then
      raise exception 'not_found';
    end if;
    if exists (
      select 1 from public.ritual_entries re
      where re.entry_group_id = p_group_id and re.created_by <> v_uid limit 1
    ) then
      raise exception 'not_allowed';
    end if;
    v_group := p_group_id;
    -- Replace the previous selection wholesale (atomic edit).
    delete from public.ritual_entries where entry_group_id = v_group;
  end if;

  -- Insert one entry per chosen definition. The partial unique index guards
  -- against counting the same fact twice for the same user + day.
  begin
    foreach v_def in array v_def_ids loop
      insert into public.ritual_entries (
        household_id, user_id, created_by, ritual_definition_id, area,
        occurred_on, note, meal_label, custom_label, is_shared, entry_group_id, source
      ) values (
        v_household, v_uid, v_uid, v_def, p_area,
        p_occurred_on, p_note, p_meal_label, p_custom_label,
        p_is_shared, v_group, coalesce(p_source, 'manual')
      );
    end loop;
  exception when unique_violation then
    raise exception 'duplicate_ritual'
      using hint = 'Diesen Baustein hast du an diesem Tag bereits erfasst.';
  end;

  -- Reconcile participants.
  delete from public.entry_participants where entry_kind = 'ritual' and group_id = v_group;
  if p_is_shared then
    insert into public.entry_participants (household_id, entry_kind, group_id, user_id)
    values (v_household, 'ritual', v_group, v_uid),
           (v_household, 'ritual', v_group, p_partner_user_id)
    on conflict (entry_kind, group_id, user_id) do nothing;
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_household, v_uid,
    case when p_group_id is null then 'ritual_created' else 'ritual_updated' end,
    'ritual_entry', v_group,
    jsonb_build_object('area', p_area, 'is_shared', p_is_shared, 'count', array_length(v_def_ids, 1)));

  return v_group;
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_entry — soft-delete an activity (by id) or a whole ritual check-in
-- (by entry_group_id). Any active member of the household may delete; the
-- actor is recorded (§25, §13.4). Soft delete keeps rows for later correction.
-- ---------------------------------------------------------------------------
create or replace function public.delete_entry(p_kind public.entry_kind, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_affected integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  v_household := app.current_household(v_uid);
  if v_household is null then
    raise exception 'not_in_household';
  end if;

  if p_kind = 'activity' then
    update public.activities
      set deleted_at = now()
      where id = p_id and household_id = v_household and deleted_at is null;
    get diagnostics v_affected = row_count;
  else
    update public.ritual_entries
      set deleted_at = now()
      where entry_group_id = p_id and household_id = v_household and deleted_at is null;
    get diagnostics v_affected = row_count;
  end if;

  if v_affected = 0 then
    raise exception 'not_found';
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_household, v_uid, 'entry_deleted', p_kind::text, p_id,
    jsonb_build_object('kind', p_kind));
end;
$$;

-- ---------------------------------------------------------------------------
-- save_favorite / delete_favorite — quick-action templates (§18).
-- ---------------------------------------------------------------------------
create or replace function public.save_favorite(
  p_id uuid,
  p_area public.life_area,
  p_label text,
  p_activity_type_id uuid default null,
  p_duration_min integer default null,
  p_intensity public.activity_intensity default null,
  p_ritual_definition_ids uuid[] default '{}',
  p_is_shared boolean default false,
  p_personal boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_id uuid;
  v_owner uuid;
  v_defs uuid[] := coalesce(p_ritual_definition_ids, '{}'::uuid[]);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  v_household := app.current_household(v_uid);
  if v_household is null then
    raise exception 'not_in_household';
  end if;

  if char_length(btrim(coalesce(p_label, ''))) < 1 then
    raise exception 'empty_selection' using hint = 'Bitte einen Namen für den Favoriten angeben.';
  end if;

  if p_area = 'movement' then
    if p_activity_type_id is null or not exists (
      select 1 from public.activity_types t
      where t.id = p_activity_type_id and t.is_active and t.area = 'movement'
    ) then
      raise exception 'invalid_type';
    end if;
    v_defs := '{}';
  else
    if array_length(v_defs, 1) is null then
      raise exception 'empty_selection';
    end if;
    if (select count(*) from public.ritual_definitions rd
        where rd.id = any(v_defs) and rd.is_active and rd.area = p_area) <> array_length(v_defs, 1) then
      raise exception 'invalid_type';
    end if;
    p_activity_type_id := null;
  end if;

  v_owner := case when p_personal then v_uid else null end;

  if p_id is null then
    insert into public.entry_favorites (
      household_id, created_by, owner_user_id, area, label,
      activity_type_id, duration_min, intensity, ritual_definition_ids, is_shared
    ) values (
      v_household, v_uid, v_owner, p_area, btrim(p_label),
      p_activity_type_id, p_duration_min, p_intensity, v_defs, p_is_shared
    ) returning id into v_id;
  else
    if not exists (
      select 1 from public.entry_favorites f
      where f.id = p_id and f.household_id = v_household
        and (f.owner_user_id is null or f.owner_user_id = v_uid)
    ) then
      raise exception 'not_found';
    end if;
    update public.entry_favorites set
      area = p_area, label = btrim(p_label), owner_user_id = v_owner,
      activity_type_id = p_activity_type_id, duration_min = p_duration_min,
      intensity = p_intensity, ritual_definition_ids = v_defs, is_shared = p_is_shared
    where id = p_id;
    v_id := p_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.delete_favorite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_affected integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  v_household := app.current_household(v_uid);
  delete from public.entry_favorites
    where id = p_id and household_id = v_household
      and (owner_user_id is null or owner_user_id = v_uid);
  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    raise exception 'not_found';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: authenticated only (never anon). Revoke the PUBLIC default.
-- ---------------------------------------------------------------------------
revoke all on function public.save_activity(uuid, uuid, date, integer, public.activity_intensity, time, text, text, text, boolean, uuid, public.entry_source, uuid) from public;
revoke all on function public.save_ritual_checkin(uuid, public.life_area, uuid[], date, text, text, text, boolean, uuid, public.entry_source) from public;
revoke all on function public.delete_entry(public.entry_kind, uuid) from public;
revoke all on function public.save_favorite(uuid, public.life_area, text, uuid, integer, public.activity_intensity, uuid[], boolean, boolean) from public;
revoke all on function public.delete_favorite(uuid) from public;

grant execute on function public.save_activity(uuid, uuid, date, integer, public.activity_intensity, time, text, text, text, boolean, uuid, public.entry_source, uuid) to authenticated;
grant execute on function public.save_ritual_checkin(uuid, public.life_area, uuid[], date, text, text, text, boolean, uuid, public.entry_source) to authenticated;
grant execute on function public.delete_entry(public.entry_kind, uuid) to authenticated;
grant execute on function public.save_favorite(uuid, public.life_area, text, uuid, integer, public.activity_intensity, uuid[], boolean, boolean) to authenticated;
grant execute on function public.delete_favorite(uuid) to authenticated;
