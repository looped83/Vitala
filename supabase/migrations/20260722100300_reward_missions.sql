-- ============================================================================
-- Vitala · Migration 0017 · Missions, goal & check-in rewards (Phase 5)
-- ----------------------------------------------------------------------------
-- Deterministic, rule-based mission assignment/exchange/skip/completion (§22–
-- §34), plus reward hooks for goal-period completions (§39) and check-ins (§40).
-- No ML, no external service, no free-text analysis (§28, ADR-0036). Mission
-- progress is derived server-side from live entries; completion grants the
-- reward exactly once via dedup keys.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Mission progress — derived from live entries over the assignment's period,
-- scoped to the participant (personal) or the household (shared). Mirrors the
-- measurement semantics of src/domain/missions.
-- ---------------------------------------------------------------------------
create or replace function app.mission_progress(p_assignment_id uuid)
returns numeric language plpgsql stable security definer set search_path = '' as $$
declare
  ma public.mission_assignments;
  md public.mission_definitions;
  v_uid uuid;
  v_shared boolean;
  v_has_type boolean;
  v_has_def boolean;
  v_result numeric := 0;
begin
  select * into ma from public.mission_assignments where id = p_assignment_id;
  if ma.id is null then return 0; end if;
  -- Defence in depth: never compute progress for a foreign household.
  if not app.is_active_member(ma.household_id) then return 0; end if;
  select * into md from public.mission_definitions where id = ma.mission_definition_id;
  v_uid := ma.user_id;
  v_shared := (ma.scope = 'shared');
  v_has_type := coalesce(array_length(md.activity_type_keys, 1), 0) > 0;
  v_has_def := coalesce(array_length(md.ritual_definition_keys, 1), 0) > 0;

  if md.measurement = 'distinct_areas' then
    select
      (exists (select 1 from public.activities a where a.household_id = ma.household_id and a.deleted_at is null
               and a.occurred_on between ma.period_start and ma.period_end))::int
      + (select count(distinct area) from public.ritual_entries re
         where re.household_id = ma.household_id and re.deleted_at is null
           and re.occurred_on between ma.period_start and ma.period_end)
    into v_result;
    return coalesce(v_result, 0);
  end if;

  if md.measurement = 'shared_count' then
    select
      (select count(*) from public.activities a
       where a.household_id = ma.household_id and a.deleted_at is null and a.is_shared
         and a.occurred_on between ma.period_start and ma.period_end
         and (md.area is null or md.area = 'movement'))
      + (select count(distinct re.entry_group_id) from public.ritual_entries re
         where re.household_id = ma.household_id and re.deleted_at is null and re.is_shared
           and re.occurred_on between ma.period_start and ma.period_end
           and (md.area is null or re.area = md.area))
    into v_result;
    return coalesce(v_result, 0);
  end if;

  if md.area = 'movement' or md.measurement in ('duration_minutes', 'active_days') and md.area = 'movement' then
    with matched as (
      select a.id, a.occurred_on, a.duration_min
      from public.activities a
      where a.household_id = ma.household_id and a.deleted_at is null
        and a.occurred_on between ma.period_start and ma.period_end
        and (not v_has_type or exists (select 1 from public.activity_types t
              where t.id = a.activity_type_id and t.key = any(md.activity_type_keys)))
        and (v_shared or a.user_id = v_uid or exists (select 1 from public.entry_participants ep
              where ep.entry_kind = 'activity' and ep.group_id = a.group_id and ep.user_id = v_uid))
    )
    select case md.measurement
      when 'duration_minutes' then coalesce(sum(duration_min), 0)
      when 'active_days' then count(distinct occurred_on)
      else count(*)
    end into v_result from matched;
  else
    with matched as (
      select re.entry_group_id, re.occurred_on
      from public.ritual_entries re
      where re.household_id = ma.household_id and re.deleted_at is null
        and (md.area is null or re.area = md.area)
        and re.occurred_on between ma.period_start and ma.period_end
        and (not v_has_def or exists (select 1 from public.ritual_definitions rd
              where rd.id = re.ritual_definition_id and rd.key = any(md.ritual_definition_keys)))
        and (v_shared or re.user_id = v_uid or exists (select 1 from public.entry_participants ep
              where ep.entry_kind = 'ritual' and ep.group_id = re.entry_group_id and ep.user_id = v_uid))
      group by re.entry_group_id, re.occurred_on
    )
    select case md.measurement
      when 'active_days' then count(distinct occurred_on)
      else count(*)
    end into v_result from matched;
  end if;
  return coalesce(v_result, 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Deterministic mission picker (§28–§29). Applies the hard filters then orders
-- by focus wish → least-covered area → stable per-day hash rotation → key.
-- ---------------------------------------------------------------------------
create or replace function app.pick_mission(
  p_hh uuid, p_uid uuid, p_scope public.owner_type, p_period public.mission_period,
  p_day date, p_exclude text[]
) returns uuid language plpgsql stable set search_path = '' as $$
declare
  v_ws date := app.week_start(p_hh, p_day);
  v_we date := v_ws + 6;
  v_exhausted boolean;
  v_avail integer;
  v_focus text;
  v_regen boolean;
  v_recent text[];
begin
  select coalesce(sum(amount), 0) >= 30 into v_exhausted
  from public.experience_transactions
  where household_id = p_hh and user_id = p_uid and scope = 'personal'
    and area = 'movement' and business_date = p_day - 1;

  select
    case available_time when 'minimal' then 10 when 'quarter' then 15
      when 'half' then 30 when 'hour' then 60 else 2147483647 end,
    focus::text,
    (intensity = 'recovery' or focus = 'recovery')
  into v_avail, v_focus, v_regen
  from public.daily_check_ins
  where household_id = p_hh and user_id = p_uid and check_in_type = 'morning' and business_date = p_day;
  v_avail := coalesce(v_avail, 2147483647);
  v_regen := coalesce(v_regen, false);

  select coalesce(array_agg(md.key), '{}') into v_recent
  from public.mission_assignments ma
  join public.mission_definitions md on md.id = ma.mission_definition_id
  where ma.household_id = p_hh and ma.scope = p_scope and ma.period = p_period
    and (p_scope = 'shared' or ma.user_id = p_uid)
    and ma.period_start >= p_day - case when p_period = 'day' then 3 else 14 end;

  return (
    select md.id
    from public.mission_definitions md
    cross join lateral (
      select case md.area
        when 'movement' then (select count(*) from public.activities a
          where a.household_id = p_hh and a.deleted_at is null and a.occurred_on between v_ws and v_we)
        when 'nutrition' then (select count(distinct entry_group_id) from public.ritual_entries re
          where re.household_id = p_hh and re.deleted_at is null and re.area = 'nutrition' and re.occurred_on between v_ws and v_we)
        when 'sustainability' then (select count(distinct entry_group_id) from public.ritual_entries re
          where re.household_id = p_hh and re.deleted_at is null and re.area = 'sustainability' and re.occurred_on between v_ws and v_we)
        when 'animal_welfare' then (select count(distinct entry_group_id) from public.ritual_entries re
          where re.household_id = p_hh and re.deleted_at is null and re.area = 'animal_welfare' and re.occurred_on between v_ws and v_we)
        else 0 end as area_count
    ) ac
    where md.is_active and md.scope = p_scope and md.period = p_period
      and not (md.key = any(coalesce(p_exclude, '{}')))
      and not (md.key = any(v_recent))
      and not (v_exhausted and md.demanding and md.area = 'movement')
      and not (v_regen and md.demanding)
      and (md.min_minutes is null or md.min_minutes <= v_avail)
    order by
      (case when md.area is not null and md.area::text = v_focus then 0 else 1 end),
      ac.area_count asc,
      abs(hashtext(md.key || '-' || extract(doy from p_day)::text)) asc,
      md.key
    limit 1
  );
end;
$$;

create or replace function app.ensure_mission(
  p_hh uuid, p_uid uuid, p_scope public.owner_type, p_period public.mission_period, p_today date
) returns void language plpgsql set search_path = '' as $$
declare
  v_ps date := case when p_period = 'day' then p_today else app.week_start(p_hh, p_today) end;
  v_pe date := case when p_period = 'day' then p_today else app.week_start(p_hh, p_today) + 6 end;
  v_def uuid;
begin
  if exists (
    select 1 from public.mission_assignments
    where household_id = p_hh and scope = p_scope and period = p_period and period_start = v_ps
      and status in ('offered', 'active') and (p_scope = 'shared' or user_id = p_uid)
  ) then return; end if;

  v_def := app.pick_mission(p_hh, p_uid, p_scope, p_period, p_today, '{}');
  if v_def is null then return; end if;

  begin
    insert into public.mission_assignments
      (household_id, user_id, mission_definition_id, scope, period, period_start, period_end, status)
    values (p_hh, p_uid, v_def, p_scope, p_period, v_ps, v_pe, 'active');
  exception when unique_violation then
    return; -- a concurrent call already created it
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs.
-- ---------------------------------------------------------------------------
create or replace function public.sync_missions()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_today date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_today := app.household_today(v_hh);

  update public.mission_assignments set status = 'expired', updated_at = now()
    where household_id = v_hh and status in ('offered', 'active') and period_end < v_today;

  perform app.ensure_mission(v_hh, v_uid, 'personal', 'day', v_today);
  perform app.ensure_mission(v_hh, v_uid, 'personal', 'week', v_today);
  perform app.ensure_mission(v_hh, null, 'shared', 'day', v_today);
  perform app.ensure_mission(v_hh, null, 'shared', 'week', v_today);
end;
$$;

create or replace function public.swap_mission(p_assignment_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_today date;
  ma public.mission_assignments;
  v_old_key text;
  v_def uuid;
  v_new uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_today := app.household_today(v_hh);

  select * into ma from public.mission_assignments where id = p_assignment_id for update;
  if ma.id is null or ma.household_id <> v_hh then raise exception 'not_found'; end if;
  if ma.scope = 'personal' and ma.user_id <> v_uid then raise exception 'not_allowed'; end if;
  if ma.status not in ('offered', 'active') then raise exception 'not_allowed' using hint = 'Diese Mission ist bereits abgeschlossen.'; end if;
  if ma.swaps_used >= 1 then raise exception 'swap_limit' using hint = 'Diese Mission wurde heute bereits getauscht.'; end if;

  select key into v_old_key from public.mission_definitions where id = ma.mission_definition_id;
  update public.mission_assignments set status = 'expired', updated_at = now() where id = ma.id;

  v_def := app.pick_mission(v_hh, ma.user_id, ma.scope, ma.period, v_today, array[v_old_key]);
  if v_def is null then
    -- Nothing else fits: keep the original active (no penalty, no forced change).
    update public.mission_assignments set status = 'active', updated_at = now() where id = ma.id;
    return ma.id;
  end if;

  insert into public.mission_assignments
    (household_id, user_id, mission_definition_id, scope, period, period_start, period_end, status, swaps_used)
  values (v_hh, ma.user_id, v_def, ma.scope, ma.period, ma.period_start, ma.period_end, 'active', ma.swaps_used + 1)
  returning id into v_new;

  insert into public.mission_exchanges
    (household_id, user_id, scope, period, period_start, from_definition_id, to_definition_id)
  values (v_hh, ma.user_id, ma.scope, ma.period, ma.period_start, ma.mission_definition_id, v_def);
  return v_new;
end;
$$;

create or replace function public.skip_mission(p_assignment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  ma public.mission_assignments;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  select * into ma from public.mission_assignments where id = p_assignment_id for update;
  if ma.id is null or ma.household_id <> v_hh then raise exception 'not_found'; end if;
  if ma.scope = 'personal' and ma.user_id <> v_uid then raise exception 'not_allowed'; end if;
  if ma.status not in ('offered', 'active') then return; end if;
  -- Skipping is neutral: no penalty, no lost XP, no lost resources (§31).
  update public.mission_assignments set status = 'skipped', updated_at = now() where id = ma.id;
end;
$$;

create or replace function public.complete_mission(p_assignment_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  v_today date;
  ma public.mission_assignments;
  md public.mission_definitions;
  v_progress numeric;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_today := app.household_today(v_hh);

  select * into ma from public.mission_assignments where id = p_assignment_id for update;
  if ma.id is null or ma.household_id <> v_hh then raise exception 'not_found'; end if;
  if ma.scope = 'personal' and ma.user_id <> v_uid then raise exception 'not_allowed'; end if;
  if ma.status = 'completed' then return; end if;
  if ma.status not in ('offered', 'active') then raise exception 'not_allowed'; end if;

  select * into md from public.mission_definitions where id = ma.mission_definition_id;
  v_progress := app.mission_progress(ma.id);
  if v_progress < md.target_value then
    raise exception 'mission_incomplete' using hint = 'Diese Mission ist noch nicht erfüllt.';
  end if;

  update public.mission_assignments set status = 'completed', completed_at = now() where id = ma.id;
  insert into public.mission_completions (mission_assignment_id, household_id, progress_value)
    values (ma.id, v_hh, v_progress) on conflict (mission_assignment_id) do nothing;

  perform app.grant_mission_rewards(ma, md, v_today);
end;
$$;

create or replace function app.grant_mission_rewards(
  ma public.mission_assignments, md public.mission_definitions, p_day date
) returns void language plpgsql set search_path = '' as $$
declare
  v_base text := 'mission:' || ma.id;
  m record;
  v_room integer;
  v_grant integer;
begin
  if ma.scope = 'personal' then
    v_room := 12 - app.mission_personal_xp_today(ma.household_id, ma.user_id, p_day);
    v_grant := greatest(0, least(md.personal_xp, v_room));
    perform app.grant_once_xp(ma.household_id, ma.user_id, 'personal', v_grant, 'mission', 'mission', ma.id, p_day, v_base || ':p');
  else
    for m in select user_id from public.household_members where household_id = ma.household_id and status = 'active' loop
      v_room := 12 - app.mission_personal_xp_today(ma.household_id, m.user_id, p_day);
      v_grant := greatest(0, least(md.personal_xp, v_room));
      perform app.grant_once_xp(ma.household_id, m.user_id, 'personal', v_grant, 'mission', 'mission', ma.id, p_day, v_base || ':p:' || m.user_id);
    end loop;
  end if;

  perform app.grant_once_xp(ma.household_id, null, 'city', md.city_xp, 'mission', 'mission', ma.id, p_day, v_base || ':c');
  if md.reward_resource is not null and md.reward_resource_amount > 0 then
    perform app.grant_once_resource(ma.household_id, md.reward_resource, md.reward_resource_amount, 'mission', 'mission', ma.id, null, p_day, v_base || ':r');
  end if;
  if md.reward_community > 0 then
    perform app.grant_once_resource(ma.household_id, 'community', md.reward_community, 'mission', 'mission', ma.id, null, p_day, v_base || ':comm');
  end if;
  perform app.touch_weekly_balance(ma.household_id, p_day);
end;
$$;

create or replace function app.mission_personal_xp_today(p_hh uuid, p_uid uuid, p_day date)
returns integer language sql stable set search_path = '' as $$
  select coalesce(sum(amount), 0)::integer from public.experience_transactions
  where household_id = p_hh and user_id = p_uid and scope = 'personal'
    and reason = 'mission' and business_date = p_day;
$$;

-- ---------------------------------------------------------------------------
-- Goal-period rewards (§39). Rewarded once per completed period (dedup by
-- period id). A one-off goal manually set to 'completed' rewards its open
-- period too. Deletion of a source entry never revokes an already-finalised
-- goal reward (ADR-0034); only the underlying entry's own grant is corrected.
-- ---------------------------------------------------------------------------
create or replace function app.reward_goal_period(p_period_id uuid)
returns void language plpgsql set search_path = '' as $$
declare
  gp public.goal_periods;
  g public.goals;
  v_scope public.owner_type;
  v_pxp integer; v_cxp integer; v_res integer; v_comm integer;
  v_key public.resource_key;
  v_base text;
  v_day date;
  m record;
begin
  select * into gp from public.goal_periods where id = p_period_id;
  if gp.id is null then return; end if;
  select * into g from public.goals where id = gp.goal_id;
  if g.id is null then return; end if;
  v_scope := g.owner_type;
  v_key := app.area_resource(g.life_area);
  v_day := gp.period_end;
  v_base := 'goal_period:' || gp.id;

  if v_scope = 'shared' then
    v_pxp := 10; v_cxp := 20; v_res := 2; v_comm := 2;
    for m in select user_id from public.household_members where household_id = g.household_id and status = 'active' loop
      perform app.grant_once_xp(g.household_id, m.user_id, 'personal', v_pxp, 'goal', 'goal_period', gp.id, v_day, v_base || ':p:' || m.user_id);
    end loop;
    perform app.grant_once_resource(g.household_id, 'community', v_comm, 'goal', 'goal_period', gp.id, null, v_day, v_base || ':comm');
  else
    v_pxp := 15; v_cxp := 8; v_res := 2;
    perform app.grant_once_xp(g.household_id, g.owner_user_id, 'personal', v_pxp, 'goal', 'goal_period', gp.id, v_day, v_base || ':p');
  end if;
  perform app.grant_once_xp(g.household_id, null, 'city', v_cxp, 'goal', 'goal_period', gp.id, v_day, v_base || ':c');
  perform app.grant_once_resource(g.household_id, v_key, v_res, 'goal', 'goal_period', gp.id, null, v_day, v_base || ':r');
  perform app.touch_weekly_balance(g.household_id, v_day);
end;
$$;

create or replace function app.reward_pending_goals(p_hh uuid)
returns void language plpgsql set search_path = '' as $$
declare gp record;
begin
  for gp in
    select gpp.id
    from public.goal_periods gpp
    join public.goals g on g.id = gpp.goal_id
    where g.household_id = p_hh
      and (gpp.status = 'completed' or (g.status = 'completed' and gpp.status = 'active'))
      and not exists (
        select 1 from public.experience_transactions et
        where et.source_kind = 'goal_period' and et.source_id = gpp.id)
  loop
    perform app.reward_goal_period(gp.id);
  end loop;
end;
$$;

-- Client entry point: materialise periods, then grant any pending goal rewards.
create or replace function public.sync_rewards()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  perform public.sync_goal_periods();
  perform app.reward_pending_goals(v_hh);
  perform public.sync_missions();
end;
$$;

-- ---------------------------------------------------------------------------
-- Re-create save_check_in to grant its small check-in reward (§40).
-- ---------------------------------------------------------------------------
create or replace function public.save_check_in(
  p_type public.check_in_type, p_business_date date default null, p_energy_level smallint default null,
  p_available_time public.time_budget default null, p_intensity public.day_intensity default null,
  p_focus public.day_focus default null, p_wish_text text default null, p_day_feeling smallint default null,
  p_positive_moment text default null, p_reflection_good text default null, p_reflection_easier text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
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
  select coalesce(timezone, 'Europe/Berlin') into v_tz from public.household_settings where household_id = v_hh;
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
    timezone = excluded.timezone, energy_level = excluded.energy_level,
    available_time = excluded.available_time, intensity = excluded.intensity,
    focus = excluded.focus, wish_text = excluded.wish_text, day_feeling = excluded.day_feeling,
    positive_moment = excluded.positive_moment, reflection_good = excluded.reflection_good,
    reflection_easier = excluded.reflection_easier, updated_at = now()
  returning id into v_id;

  -- The check-in itself is a gentle nudge; free-text is NEVER rewarded (§40).
  perform app.reward_checkin(v_hh, v_uid, v_id, v_date);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- mission_board — the caller's live missions with server-computed progress.
-- SECURITY DEFINER + household derivation so progress is always authoritative
-- and never leaks another household (§46.4).
-- ---------------------------------------------------------------------------
create or replace function public.mission_board()
returns table (
  assignment_id uuid, definition_key text, title text, description text,
  area public.life_area, scope public.owner_type, period public.mission_period,
  measurement public.mission_measurement, target_value integer, difficulty public.mission_difficulty,
  status public.mission_status, period_start date, period_end date, swaps_used integer,
  progress numeric, personal_xp integer, city_xp integer,
  reward_resource public.resource_key, reward_resource_amount integer, reward_community integer,
  can_complete boolean
) language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  return query
  select ma.id, md.key, md.title, md.description, md.area, md.scope, md.period,
    md.measurement, md.target_value, md.difficulty, ma.status, ma.period_start, ma.period_end,
    ma.swaps_used, app.mission_progress(ma.id), md.personal_xp, md.city_xp,
    md.reward_resource, md.reward_resource_amount, md.reward_community,
    (app.mission_progress(ma.id) >= md.target_value) as can_complete
  from public.mission_assignments ma
  join public.mission_definitions md on md.id = ma.mission_definition_id
  where ma.household_id = v_hh
    and ma.status in ('offered', 'active', 'completed')
    and (ma.scope = 'shared' or ma.user_id = v_uid)
    and ma.period_end >= app.household_today(v_hh) - 1
  order by ma.period, ma.scope, ma.period_start desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (authenticated only).
-- ---------------------------------------------------------------------------
revoke all on function public.sync_missions() from public;
revoke all on function public.mission_board() from public;
revoke all on function public.swap_mission(uuid) from public;
revoke all on function public.skip_mission(uuid) from public;
revoke all on function public.complete_mission(uuid) from public;
revoke all on function public.sync_rewards() from public;
revoke all on function public.save_check_in(public.check_in_type, date, smallint, public.time_budget, public.day_intensity, public.day_focus, text, smallint, text, text, text) from public;

grant execute on function public.sync_missions() to authenticated;
grant execute on function public.mission_board() to authenticated;
grant execute on function public.swap_mission(uuid) to authenticated;
grant execute on function public.skip_mission(uuid) to authenticated;
grant execute on function public.complete_mission(uuid) to authenticated;
grant execute on function public.sync_rewards() to authenticated;
grant execute on function public.save_check_in(public.check_in_type, date, smallint, public.time_budget, public.day_intensity, public.day_focus, text, smallint, text, text, text) to authenticated;
