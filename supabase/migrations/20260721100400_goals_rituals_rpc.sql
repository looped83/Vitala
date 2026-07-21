-- ============================================================================
-- Vitala · Migration 0013 · Goals, rituals & check-in RPCs (Phase 4)
-- ----------------------------------------------------------------------------
-- The ONLY write path for goals, goal periods, rituals, ritual completions and
-- check-ins (ADR-0020). Every function is SECURITY DEFINER with a fixed empty
-- search_path, derives the household from auth.uid() (never a client id),
-- validates ownership/measurement/period rules, and writes atomically.
-- NO XP / resource / city / streak logic is triggered anywhere (spec §Abgrenzung).
--
-- Stable error codes (mapped in src/data/supabase/errors.ts):
--   not_authenticated · not_in_household · invalid_owner · invalid_area ·
--   invalid_target · invalid_measurement · invalid_period · invalid_date ·
--   invalid_status · invalid_filter · not_found · not_allowed · duplicate_checkin
-- ============================================================================

-- ---------------------------------------------------------------------------
-- sync_goal_periods — materialise current/elapsed periods for the caller's
-- household and freeze elapsed ones (ADR-0026). Idempotent; safe to call before
-- any goals read. Backfill is capped per run to stay cheap (performance §51).
-- ---------------------------------------------------------------------------
create or replace function public.sync_goal_periods()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_ws smallint;
  v_today date;
  g public.goals;
  gp public.goal_periods;
  v_series_start date;
  v_cur integer;
  v_max integer;
  v_k integer;
  v_ps date;
  v_pe date;
  v_val numeric;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  select coalesce(week_start, 1) into v_ws
  from public.household_settings where household_id = v_hh;
  v_ws := coalesce(v_ws, 1);
  v_today := app.household_today(v_hh);

  for g in
    select * from public.goals
    where household_id = v_hh and deleted_at is null and status in ('active', 'paused')
  loop
    if g.period_type = 'custom' then
      v_series_start := g.start_date;
    else
      v_series_start := app.period_start(g.period_type, g.start_date, v_ws);
    end if;

    if g.recurrence = 'none' or g.status = 'paused' then
      v_cur := coalesce((select max(period_index) from public.goal_periods where goal_id = g.id), 0);
    else
      v_cur := app.current_period_index(g.period_type, v_series_start, v_today);
      if g.end_date is not null then
        while v_cur > 0 and app.period_start_for_index(g.period_type, v_series_start, v_cur) > g.end_date loop
          v_cur := v_cur - 1;
        end loop;
      end if;
    end if;

    v_max := coalesce((select max(period_index) from public.goal_periods where goal_id = g.id), -1);
    v_k := v_max + 1;
    while v_k <= v_cur and v_k <= v_max + 366 loop
      if g.recurrence = 'none' and g.period_type = 'custom' then
        v_ps := g.start_date;
        v_pe := coalesce(g.end_date, g.start_date);
      elsif g.recurrence = 'none' then
        v_ps := v_series_start;
        v_pe := app.period_end_from_start(g.period_type, v_series_start);
      else
        v_ps := app.period_start_for_index(g.period_type, v_series_start, v_k);
        v_pe := app.period_end_from_start(g.period_type, v_ps);
      end if;
      insert into public.goal_periods
        (goal_id, household_id, period_index, period_start, period_end, target_value, status)
      values (g.id, v_hh, v_k, v_ps, v_pe, g.target_value, 'active')
      on conflict (goal_id, period_index) do nothing;
      v_k := v_k + 1;
    end loop;

    -- Freeze elapsed active periods (history is never rewritten afterwards).
    for gp in
      select * from public.goal_periods
      where goal_id = g.id and status = 'active' and period_end < v_today
    loop
      v_val := app.goal_progress(g.id, gp.period_start, gp.period_end);
      update public.goal_periods set
        final_value = v_val,
        status = case when v_val >= gp.target_value then 'completed'::public.goal_period_status
                      else 'expired'::public.goal_period_status end,
        completed_at = case when v_val >= gp.target_value then now() else null end
      where id = gp.id;
    end loop;

    -- One-off goal inherits its single period's terminal state.
    if g.recurrence = 'none' and g.status = 'active' then
      select * into gp from public.goal_periods where goal_id = g.id and period_index = 0;
      if gp.id is not null and gp.status <> 'active' then
        update public.goals set
          status = case when gp.status = 'completed' then 'completed'::public.goal_status
                        else 'expired'::public.goal_status end,
          completed_at = case when gp.status = 'completed' then coalesce(g.completed_at, now()) else g.completed_at end
        where id = g.id;
      end if;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- save_goal — insert (p_id null) or update a goal. Validates owner shape,
-- measurement/unit, period/recurrence and area filters, then (re)materialises
-- periods. Returns the goal id. Never sets systemic fields from the client.
-- ---------------------------------------------------------------------------
create or replace function public.save_goal(
  p_id uuid,
  p_owner_type public.owner_type,
  p_owner_user_id uuid,
  p_title text,
  p_description text,
  p_life_area public.life_area,
  p_measurement public.goal_measurement,
  p_target_value numeric,
  p_unit public.goal_unit,
  p_period_type public.goal_period_type,
  p_recurrence public.goal_recurrence,
  p_activity_type_keys text[] default '{}',
  p_ritual_definition_keys text[] default '{}',
  p_start_date date default null,
  p_end_date date default null,
  p_template_key text default null,
  p_manual_value numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_today date;
  v_id uuid;
  v_owner uuid;
  v_existing public.goals;
  v_start date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_today := app.household_today(v_hh);

  if char_length(btrim(coalesce(p_title, ''))) < 1 then
    raise exception 'invalid_target' using hint = 'Bitte einen Titel angeben.';
  end if;
  if p_target_value is null or p_target_value <= 0 then
    raise exception 'invalid_target' using hint = 'Der Zielwert muss größer als 0 sein.';
  end if;

  -- Owner shape + membership.
  if p_owner_type = 'personal' then
    v_owner := coalesce(p_owner_user_id, v_uid);
    if not app.is_active_member(v_hh, v_owner) then
      raise exception 'invalid_owner' using hint = 'Die Person gehört nicht zu eurem Household.';
    end if;
  else
    v_owner := null;
  end if;

  -- Measurement / unit compatibility (mirrors the check constraint, friendlier).
  if (p_measurement = 'duration_minutes') <> (p_unit = 'minutes')
     or (p_measurement = 'active_days') <> (p_unit = 'days') then
    raise exception 'invalid_measurement' using hint = 'Einheit passt nicht zur Messmethode.';
  end if;
  if p_measurement = 'boolean' and p_target_value <> 1 then
    raise exception 'invalid_target' using hint = 'Ja/Nein-Ziele haben immer den Zielwert 1.';
  end if;
  if p_measurement = 'duration_minutes' and p_life_area <> 'movement' then
    raise exception 'invalid_measurement' using hint = 'Minutenziele gelten nur für Bewegung.';
  end if;

  -- Period / recurrence compatibility.
  if not (
    p_recurrence = 'none'
    or (p_recurrence = 'daily' and p_period_type = 'day')
    or (p_recurrence = 'weekly' and p_period_type = 'week')
    or (p_recurrence = 'monthly' and p_period_type = 'month')
    or (p_recurrence = 'quarterly' and p_period_type = 'quarter')
  ) then
    raise exception 'invalid_period' using hint = 'Wiederholung passt nicht zum Zeitraum.';
  end if;

  v_start := coalesce(p_start_date, v_today);
  if p_period_type = 'custom' and p_recurrence = 'none' then
    if p_end_date is null or p_end_date < v_start then
      raise exception 'invalid_period' using hint = 'Bitte ein gültiges Enddatum wählen.';
    end if;
  end if;
  if p_end_date is not null and p_end_date < v_start then
    raise exception 'invalid_date' using hint = 'Das Enddatum darf nicht vor dem Start liegen.';
  end if;

  -- Area / filter shape: filters must match the area and reference real rows.
  if p_life_area = 'movement' then
    if coalesce(array_length(p_ritual_definition_keys, 1), 0) > 0 then
      raise exception 'invalid_filter' using hint = 'Bewegungsziele nutzen keine Ritual-Bausteine.';
    end if;
    if coalesce(array_length(p_activity_type_keys, 1), 0) > 0
       and (select count(*) from public.activity_types t
            where t.key = any(p_activity_type_keys) and t.is_active)
           <> array_length(p_activity_type_keys, 1) then
      raise exception 'invalid_filter' using hint = 'Unbekannter Bewegungstyp im Filter.';
    end if;
  else
    if coalesce(array_length(p_activity_type_keys, 1), 0) > 0 then
      raise exception 'invalid_filter' using hint = 'Dieser Bereich nutzt keine Bewegungstypen.';
    end if;
    if coalesce(array_length(p_ritual_definition_keys, 1), 0) > 0
       and (select count(*) from public.ritual_definitions rd
            where rd.key = any(p_ritual_definition_keys) and rd.is_active and rd.area = p_life_area)
           <> array_length(p_ritual_definition_keys, 1) then
      raise exception 'invalid_filter' using hint = 'Unbekannter Baustein für diesen Bereich.';
    end if;
  end if;

  if p_id is null then
    insert into public.goals (
      household_id, created_by, owner_type, owner_user_id, title, description,
      life_area, measurement, target_value, unit, period_type, recurrence,
      activity_type_keys, ritual_definition_keys, start_date, end_date,
      status, manual_value, template_key
    ) values (
      v_hh, v_uid, p_owner_type, v_owner, btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''),
      p_life_area, p_measurement, p_target_value, p_unit, p_period_type, p_recurrence,
      coalesce(p_activity_type_keys, '{}'), coalesce(p_ritual_definition_keys, '{}'),
      v_start, p_end_date, 'active',
      case when p_measurement in ('manual', 'boolean') then coalesce(p_manual_value, 0) else null end,
      p_template_key
    ) returning id into v_id;
  else
    select * into v_existing from public.goals where id = p_id and deleted_at is null;
    if v_existing.id is null then raise exception 'not_found'; end if;
    if v_existing.household_id <> v_hh then raise exception 'not_allowed'; end if;
    -- Both active members may edit shared goals; personal goals: owner or creator.
    if v_existing.owner_type = 'personal'
       and v_existing.owner_user_id <> v_uid and v_existing.created_by <> v_uid then
      raise exception 'not_allowed' using hint = 'Nur die zuständige Person kann dieses Ziel bearbeiten.';
    end if;
    update public.goals set
      owner_type = p_owner_type,
      owner_user_id = v_owner,
      title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      life_area = p_life_area,
      measurement = p_measurement,
      target_value = p_target_value,
      unit = p_unit,
      period_type = p_period_type,
      recurrence = p_recurrence,
      activity_type_keys = coalesce(p_activity_type_keys, '{}'),
      ritual_definition_keys = coalesce(p_ritual_definition_keys, '{}'),
      start_date = v_start,
      end_date = p_end_date,
      manual_value = case when p_measurement in ('manual', 'boolean')
                         then coalesce(p_manual_value, v_existing.manual_value, 0) else null end
    where id = p_id;
    v_id := p_id;
    -- Keep past frozen periods; refresh the current period target.
    update public.goal_periods
      set target_value = p_target_value
      where goal_id = v_id and status = 'active';
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_hh, v_uid, case when p_id is null then 'goal_created' else 'goal_updated' end,
    'goal', v_id, jsonb_build_object('owner_type', p_owner_type, 'area', p_life_area));

  perform public.sync_goal_periods();
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_goal_status — validated lifecycle transition (spec §13/§14/§16).
-- ---------------------------------------------------------------------------
create or replace function public.set_goal_status(
  p_id uuid,
  p_status public.goal_status,
  p_pause_reason text default null,
  p_resume_on date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  g public.goals;
  v_ok boolean;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  select * into g from public.goals where id = p_id and deleted_at is null;
  if g.id is null then raise exception 'not_found'; end if;
  if g.household_id <> v_hh then raise exception 'not_allowed'; end if;
  if g.owner_type = 'personal' and g.owner_user_id <> v_uid and g.created_by <> v_uid then
    raise exception 'not_allowed';
  end if;

  -- Allowed transitions (spec §13). Invalid ones are rejected.
  v_ok := case
    when g.status = p_status then true
    when g.status = 'draft' and p_status in ('active', 'archived') then true
    when g.status = 'active' and p_status in ('paused', 'completed', 'archived') then true
    when g.status = 'paused' and p_status in ('active', 'archived', 'completed') then true
    when g.status = 'completed' and p_status in ('archived', 'active') then true
    when g.status = 'expired' and p_status in ('active', 'archived') then true
    else false
  end;
  if not v_ok then
    raise exception 'invalid_status' using hint = 'Dieser Statuswechsel ist nicht möglich.';
  end if;

  update public.goals set
    status = p_status,
    pause_reason = case when p_status = 'paused'
                        then nullif(btrim(coalesce(p_pause_reason, '')), '') else null end,
    resume_on = case when p_status = 'paused' then p_resume_on else null end,
    paused_at = case when p_status = 'paused' then now()
                     when p_status = 'active' then null else g.paused_at end,
    completed_at = case when p_status = 'completed' then coalesce(g.completed_at, now())
                        when p_status = 'active' then null else g.completed_at end,
    archived_at = case when p_status = 'archived' then now() else null end
  where id = p_id;

  -- Re-activating an expired/completed goal reopens its current period.
  if p_status = 'active' then
    perform public.sync_goal_periods();
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_hh, v_uid, 'goal_status', 'goal', p_id, jsonb_build_object('status', p_status));
end;
$$;

-- ---------------------------------------------------------------------------
-- set_goal_manual_progress — manual/boolean measurement only (spec §4.7).
-- Automatic measurements are never client-settable (security §50).
-- ---------------------------------------------------------------------------
create or replace function public.set_goal_manual_progress(p_id uuid, p_value numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  g public.goals;
  v_val numeric;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  select * into g from public.goals where id = p_id and deleted_at is null;
  if g.id is null then raise exception 'not_found'; end if;
  if g.household_id <> v_hh then raise exception 'not_allowed'; end if;
  if g.measurement not in ('manual', 'boolean') then
    raise exception 'invalid_measurement' using hint = 'Nur manuelle Ziele haben einen manuellen Fortschritt.';
  end if;
  if p_value is null or p_value < 0 then
    raise exception 'invalid_target';
  end if;

  v_val := case when g.measurement = 'boolean' then least(1, greatest(0, floor(p_value))) else p_value end;
  update public.goals set manual_value = v_val where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- delete_goal — soft delete (spec §16). Archiving is preferred; deletion keeps
-- rows for consistency and never touches Phase-3 activity entries.
-- ---------------------------------------------------------------------------
create or replace function public.delete_goal(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_affected integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  update public.goals set deleted_at = now(), status = 'archived'
    where id = p_id and household_id = v_hh and deleted_at is null;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then raise exception 'not_found'; end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_hh, v_uid, 'goal_deleted', 'goal', p_id, '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- save_ritual — insert / update a ritual definition (spec §19).
-- ---------------------------------------------------------------------------
create or replace function public.save_ritual(
  p_id uuid,
  p_owner_type public.owner_type,
  p_owner_user_id uuid,
  p_title text,
  p_description text,
  p_life_area public.life_area,
  p_ritual_type public.ritual_type,
  p_recurrence public.ritual_recurrence,
  p_preferred_time public.ritual_time,
  p_weekdays smallint[],
  p_start_date date default null,
  p_end_date date default null,
  p_sort_order integer default 100
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_today date;
  v_owner uuid;
  v_id uuid;
  v_existing public.rituals;
  v_days smallint[] := coalesce(p_weekdays, '{}');
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_today := app.household_today(v_hh);

  if char_length(btrim(coalesce(p_title, ''))) < 1 then
    raise exception 'invalid_target' using hint = 'Bitte einen Titel angeben.';
  end if;
  if not (v_days <@ array[0,1,2,3,4,5,6]::smallint[]) then
    raise exception 'invalid_filter' using hint = 'Ungültige Wochentage.';
  end if;

  if p_owner_type = 'personal' then
    v_owner := coalesce(p_owner_user_id, v_uid);
    if not app.is_active_member(v_hh, v_owner) then
      raise exception 'invalid_owner';
    end if;
  else
    v_owner := null;
  end if;

  if p_end_date is not null and p_end_date < coalesce(p_start_date, v_today) then
    raise exception 'invalid_date';
  end if;

  if p_id is null then
    insert into public.rituals (
      household_id, created_by, owner_type, owner_user_id, title, description,
      life_area, ritual_type, recurrence, preferred_time, weekdays,
      start_date, end_date, sort_order
    ) values (
      v_hh, v_uid, p_owner_type, v_owner, btrim(p_title),
      nullif(btrim(coalesce(p_description, '')), ''), p_life_area, p_ritual_type,
      p_recurrence, p_preferred_time, v_days, coalesce(p_start_date, v_today),
      p_end_date, coalesce(p_sort_order, 100)
    ) returning id into v_id;
  else
    select * into v_existing from public.rituals where id = p_id and deleted_at is null;
    if v_existing.id is null then raise exception 'not_found'; end if;
    if v_existing.household_id <> v_hh then raise exception 'not_allowed'; end if;
    if v_existing.owner_type = 'personal'
       and v_existing.owner_user_id <> v_uid and v_existing.created_by <> v_uid then
      raise exception 'not_allowed';
    end if;
    update public.rituals set
      owner_type = p_owner_type,
      owner_user_id = v_owner,
      title = btrim(p_title),
      description = nullif(btrim(coalesce(p_description, '')), ''),
      life_area = p_life_area,
      ritual_type = p_ritual_type,
      recurrence = p_recurrence,
      preferred_time = p_preferred_time,
      weekdays = v_days,
      start_date = coalesce(p_start_date, v_existing.start_date),
      end_date = p_end_date,
      sort_order = coalesce(p_sort_order, v_existing.sort_order)
    where id = p_id;
    v_id := p_id;
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_ritual_status — active / paused / archived (spec §27).
-- ---------------------------------------------------------------------------
create or replace function public.set_ritual_status(p_id uuid, p_status public.ritual_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  r public.rituals;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  select * into r from public.rituals where id = p_id and deleted_at is null;
  if r.id is null then raise exception 'not_found'; end if;
  if r.household_id <> v_hh then raise exception 'not_allowed'; end if;
  if r.owner_type = 'personal' and r.owner_user_id <> v_uid and r.created_by <> v_uid then
    raise exception 'not_allowed';
  end if;

  update public.rituals set
    status = p_status,
    paused_at = case when p_status = 'paused' then now() when p_status = 'active' then null else r.paused_at end,
    archived_at = case when p_status = 'archived' then now() else null end
  where id = p_id;
end;
$$;

create or replace function public.delete_ritual(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_affected integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  update public.rituals set deleted_at = now(), status = 'archived'
    where id = p_id and household_id = v_hh and deleted_at is null;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then raise exception 'not_found'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_ritual — upsert one outcome for a ritual instance (spec §26/§28).
-- Personal rituals: only the owner acts. Shared rituals: either member; the
-- actor is recorded. The unique(ritual_id, occurred_on) prevents duplicates.
-- ---------------------------------------------------------------------------
create or replace function public.complete_ritual(
  p_ritual_id uuid,
  p_occurred_on date,
  p_status public.ritual_completion_status default 'done',
  p_value smallint default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_today date;
  r public.rituals;
  v_id uuid;
  v_date date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_today := app.household_today(v_hh);

  select * into r from public.rituals where id = p_ritual_id and deleted_at is null;
  if r.id is null then raise exception 'not_found'; end if;
  if r.household_id <> v_hh then raise exception 'not_allowed'; end if;
  if r.status = 'archived' then raise exception 'not_allowed' using hint = 'Dieses Ritual ist archiviert.'; end if;
  if r.owner_type = 'personal' and r.owner_user_id <> v_uid then
    raise exception 'not_allowed' using hint = 'Nur die zuständige Person kann dieses Ritual abschließen.';
  end if;

  v_date := coalesce(p_occurred_on, v_today);
  if v_date > v_today then raise exception 'invalid_date'; end if;

  insert into public.ritual_completions
    (ritual_id, household_id, user_id, occurred_on, status, value_num, note)
  values (p_ritual_id, v_hh, v_uid, v_date, coalesce(p_status, 'done'),
          p_value, nullif(btrim(coalesce(p_note, '')), ''))
  on conflict (ritual_id, occurred_on) do update set
    user_id = excluded.user_id,
    status = excluded.status,
    value_num = excluded.value_num,
    note = excluded.note,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- clear_ritual_completion — reset an instance back to "open" (spec §26).
-- ---------------------------------------------------------------------------
create or replace function public.clear_ritual_completion(p_ritual_id uuid, p_occurred_on date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  r public.rituals;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  select * into r from public.rituals where id = p_ritual_id;
  if r.id is null then raise exception 'not_found'; end if;
  if r.household_id <> v_hh then raise exception 'not_allowed'; end if;
  if r.owner_type = 'personal' and r.owner_user_id <> v_uid then
    raise exception 'not_allowed';
  end if;
  delete from public.ritual_completions
    where ritual_id = p_ritual_id and occurred_on = p_occurred_on and household_id = v_hh;
end;
$$;

-- ---------------------------------------------------------------------------
-- save_check_in — upsert the caller's own morning/evening check-in for a local
-- day (spec §22/§24). Max one per user/type/day (unique). Free text is private.
-- ---------------------------------------------------------------------------
create or replace function public.save_check_in(
  p_type public.check_in_type,
  p_business_date date default null,
  p_energy_level smallint default null,
  p_available_time public.time_budget default null,
  p_intensity public.day_intensity default null,
  p_focus public.day_focus default null,
  p_wish_text text default null,
  p_day_feeling smallint default null,
  p_positive_moment text default null,
  p_reflection_good text default null,
  p_reflection_easier text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_tz text;
  v_today date;
  v_date date;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  select coalesce(timezone, 'Europe/Berlin') into v_tz
  from public.household_settings where household_id = v_hh;
  v_tz := coalesce(v_tz, 'Europe/Berlin');
  v_today := app.household_today(v_hh);
  v_date := coalesce(p_business_date, v_today);
  if v_date > v_today then raise exception 'invalid_date'; end if;

  insert into public.daily_check_ins (
    household_id, user_id, check_in_type, business_date, timezone,
    energy_level, available_time, intensity, focus, wish_text,
    day_feeling, positive_moment, reflection_good, reflection_easier
  ) values (
    v_hh, v_uid, p_type, v_date, v_tz,
    case when p_type = 'morning' then p_energy_level end,
    case when p_type = 'morning' then p_available_time end,
    case when p_type = 'morning' then p_intensity end,
    case when p_type = 'morning' then p_focus end,
    case when p_type = 'morning' then nullif(btrim(coalesce(p_wish_text, '')), '') end,
    case when p_type = 'evening' then p_day_feeling end,
    case when p_type = 'evening' then nullif(btrim(coalesce(p_positive_moment, '')), '') end,
    case when p_type = 'evening' then nullif(btrim(coalesce(p_reflection_good, '')), '') end,
    case when p_type = 'evening' then nullif(btrim(coalesce(p_reflection_easier, '')), '') end
  )
  on conflict (user_id, check_in_type, business_date) do update set
    timezone = excluded.timezone,
    energy_level = excluded.energy_level,
    available_time = excluded.available_time,
    intensity = excluded.intensity,
    focus = excluded.focus,
    wish_text = excluded.wish_text,
    day_feeling = excluded.day_feeling,
    positive_moment = excluded.positive_moment,
    reflection_good = excluded.reflection_good,
    reflection_easier = excluded.reflection_easier,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.delete_check_in(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_affected integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  delete from public.daily_check_ins where id = p_id and user_id = v_uid;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then raise exception 'not_found'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: authenticated only (never anon). Revoke the PUBLIC default.
-- ---------------------------------------------------------------------------
revoke all on function public.sync_goal_periods() from public;
revoke all on function public.save_goal(uuid, public.owner_type, uuid, text, text, public.life_area, public.goal_measurement, numeric, public.goal_unit, public.goal_period_type, public.goal_recurrence, text[], text[], date, date, text, numeric) from public;
revoke all on function public.set_goal_status(uuid, public.goal_status, text, date) from public;
revoke all on function public.set_goal_manual_progress(uuid, numeric) from public;
revoke all on function public.delete_goal(uuid) from public;
revoke all on function public.save_ritual(uuid, public.owner_type, uuid, text, text, public.life_area, public.ritual_type, public.ritual_recurrence, public.ritual_time, smallint[], date, date, integer) from public;
revoke all on function public.set_ritual_status(uuid, public.ritual_status) from public;
revoke all on function public.delete_ritual(uuid) from public;
revoke all on function public.complete_ritual(uuid, date, public.ritual_completion_status, smallint, text) from public;
revoke all on function public.clear_ritual_completion(uuid, date) from public;
revoke all on function public.save_check_in(public.check_in_type, date, smallint, public.time_budget, public.day_intensity, public.day_focus, text, smallint, text, text, text) from public;
revoke all on function public.delete_check_in(uuid) from public;

grant execute on function public.sync_goal_periods() to authenticated;
grant execute on function public.save_goal(uuid, public.owner_type, uuid, text, text, public.life_area, public.goal_measurement, numeric, public.goal_unit, public.goal_period_type, public.goal_recurrence, text[], text[], date, date, text, numeric) to authenticated;
grant execute on function public.set_goal_status(uuid, public.goal_status, text, date) to authenticated;
grant execute on function public.set_goal_manual_progress(uuid, numeric) to authenticated;
grant execute on function public.delete_goal(uuid) to authenticated;
grant execute on function public.save_ritual(uuid, public.owner_type, uuid, text, text, public.life_area, public.ritual_type, public.ritual_recurrence, public.ritual_time, smallint[], date, date, integer) to authenticated;
grant execute on function public.set_ritual_status(uuid, public.ritual_status) to authenticated;
grant execute on function public.delete_ritual(uuid) to authenticated;
grant execute on function public.complete_ritual(uuid, date, public.ritual_completion_status, smallint, text) to authenticated;
grant execute on function public.clear_ritual_completion(uuid, date) to authenticated;
grant execute on function public.save_check_in(public.check_in_type, date, smallint, public.time_budget, public.day_intensity, public.day_focus, text, smallint, text, text, text) to authenticated;
grant execute on function public.delete_check_in(uuid) to authenticated;
