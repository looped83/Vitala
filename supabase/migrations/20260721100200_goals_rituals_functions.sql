-- ============================================================================
-- Vitala · Migration 0011 · Goal period math, progress & overview (Phase 4)
-- ----------------------------------------------------------------------------
-- Deterministic period-boundary helpers, the server-side progress calculation
-- (ADR-0025), and the `goal_overview` view the client reads. Progress is always
-- derived from the live Phase-3 entries — never a client value (spec §11/§50).
--
-- Timezone: goals evaluate on LOCAL calendar dates in the household timezone;
-- `occurred_on` is already a local date (spec §45, ADR-0024). Week start comes
-- from household_settings (spec §7).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Pure period-boundary helpers (app schema; not API-exposed).
-- week_start: 0=Sunday … 6=Saturday (household_settings.week_start).
-- ---------------------------------------------------------------------------
create or replace function app.period_start(
  p_type public.goal_period_type, p_anchor date, p_week_start smallint default 1
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'day'     then p_anchor
    when 'week'    then p_anchor - ((extract(dow from p_anchor)::int - p_week_start + 7) % 7)
    when 'month'   then date_trunc('month', p_anchor)::date
    when 'quarter' then date_trunc('quarter', p_anchor)::date
    else p_anchor  -- custom: caller supplies explicit bounds
  end;
$$;

create or replace function app.period_end_from_start(
  p_type public.goal_period_type, p_start date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'day'     then p_start
    when 'week'    then p_start + 6
    when 'month'   then (p_start + interval '1 month')::date - 1
    when 'quarter' then (p_start + interval '3 months')::date - 1
    else p_start
  end;
$$;

-- Start date of the period at 0-based `index`, counting from a series' first
-- aligned period start.
create or replace function app.period_start_for_index(
  p_type public.goal_period_type, p_series_start date, p_index integer
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_type
    when 'day'     then p_series_start + p_index
    when 'week'    then p_series_start + (p_index * 7)
    when 'month'   then (p_series_start + (p_index || ' month')::interval)::date
    when 'quarter' then (p_series_start + (p_index * 3 || ' month')::interval)::date
    else p_series_start
  end;
$$;

-- 0-based index of the period containing `p_today`, relative to an aligned
-- `p_series_start` (which must itself be a period start for the type).
create or replace function app.current_period_index(
  p_type public.goal_period_type, p_series_start date, p_today date
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(0, case p_type
    when 'day'     then (p_today - p_series_start)
    when 'week'    then (p_today - p_series_start) / 7
    when 'month'   then (extract(year from p_today)::int - extract(year from p_series_start)::int) * 12
                        + (extract(month from p_today)::int - extract(month from p_series_start)::int)
    when 'quarter' then (((extract(year from p_today)::int - extract(year from p_series_start)::int) * 12
                        + (extract(month from p_today)::int - extract(month from p_series_start)::int)) / 3)
    else 0
  end);
$$;

-- ---------------------------------------------------------------------------
-- app.goal_progress — the single source of truth for a goal's value over an
-- inclusive [p_start, p_end] window (ADR-0025). SECURITY INVOKER so it reads
-- activities / ritual_entries under the CALLER's RLS: a client can never probe
-- another household's aggregates. Deleted entries are excluded; edits and
-- participant changes are reflected automatically (spec §44).
-- ---------------------------------------------------------------------------
create or replace function app.goal_progress(p_goal_id uuid, p_start date, p_end date)
returns numeric
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  g public.goals;
  v_owner uuid;
  v_has_type_filter boolean;
  v_has_def_filter boolean;
  v_result numeric := 0;
begin
  select * into g from public.goals where id = p_goal_id and deleted_at is null;
  if g.id is null then
    return 0;
  end if;
  v_owner := g.owner_user_id;
  v_has_type_filter := coalesce(array_length(g.activity_type_keys, 1), 0) > 0;
  v_has_def_filter := coalesce(array_length(g.ritual_definition_keys, 1), 0) > 0;

  -- Manual / boolean goals do not read entries (spec §4.7).
  if g.measurement = 'manual' then
    return coalesce(g.manual_value, 0);
  elsif g.measurement = 'boolean' then
    return case when coalesce(g.manual_value, 0) >= 1 then 1 else 0 end;
  end if;

  if g.life_area = 'movement' then
    -- Owner scoping: shared goal counts the whole household (each shared entry
    -- is one row → once); personal goal counts entries the owner took part in.
    with matched as (
      select a.id, a.occurred_on, a.duration_min, a.activity_type_id, a.is_shared
      from public.activities a
      where a.household_id = g.household_id
        and a.deleted_at is null
        and a.occurred_on between p_start and p_end
        and (
          not v_has_type_filter
          or exists (
            select 1 from public.activity_types t
            where t.id = a.activity_type_id and t.key = any(g.activity_type_keys)
          )
        )
        and (
          g.owner_type = 'shared'
          or a.user_id = v_owner
          or exists (
            select 1 from public.entry_participants ep
            where ep.entry_kind = 'activity' and ep.group_id = a.group_id
              and ep.user_id = v_owner
          )
        )
        and (g.measurement <> 'shared_count' or a.is_shared)
    )
    select case g.measurement
      when 'duration_minutes' then coalesce(sum(duration_min), 0)
      when 'active_days'      then count(distinct occurred_on)
      when 'distinct_types'   then count(distinct activity_type_id)
      else count(*)  -- entry_count, shared_count
    end
    into v_result
    from matched;
  else
    -- Ritual areas (nutrition / sustainability / animal welfare).
    with matched as (
      select re.entry_group_id, re.occurred_on, re.ritual_definition_id, re.is_shared
      from public.ritual_entries re
      where re.household_id = g.household_id
        and re.deleted_at is null
        and re.area = g.life_area
        and re.occurred_on between p_start and p_end
        and (
          not v_has_def_filter
          or exists (
            select 1 from public.ritual_definitions rd
            where rd.id = re.ritual_definition_id and rd.key = any(g.ritual_definition_keys)
          )
        )
        and (
          g.owner_type = 'shared'
          or re.user_id = v_owner
          or exists (
            select 1 from public.entry_participants ep
            where ep.entry_kind = 'ritual' and ep.group_id = re.entry_group_id
              and ep.user_id = v_owner
          )
        )
        and (g.measurement <> 'shared_count' or re.is_shared)
    )
    select case g.measurement
      when 'active_days'    then count(distinct occurred_on)
      when 'distinct_types' then count(distinct ritual_definition_id)
      when 'shared_count'   then count(distinct entry_group_id)
      when 'entry_count'    then
        case when v_has_def_filter then count(*) else count(distinct entry_group_id) end
      else count(distinct entry_group_id)
    end
    into v_result
    from matched;
  end if;

  return coalesce(v_result, 0);
end;
$$;

revoke all on function app.goal_progress(uuid, date, date) from public;
grant execute on function app.goal_progress(uuid, date, date) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- goal_overview — one row per live goal with its current period + live value.
-- security_invoker: goals RLS scopes rows to the caller's household; the
-- progress function runs under the same identity. Elapsed-period history lives
-- in goal_periods (final_value frozen).
-- ---------------------------------------------------------------------------
create or replace view public.goal_overview
with (security_invoker = true)
as
select
  g.id,
  g.household_id,
  g.created_by,
  g.owner_type,
  g.owner_user_id,
  g.title,
  g.description,
  g.life_area,
  g.measurement,
  g.target_value,
  g.unit,
  g.period_type,
  g.recurrence,
  g.activity_type_keys,
  g.ritual_definition_keys,
  g.start_date,
  g.end_date,
  g.status,
  g.manual_value,
  g.template_key,
  g.pause_reason,
  g.resume_on,
  g.created_at,
  g.updated_at,
  g.completed_at,
  g.paused_at,
  g.archived_at,
  gp.id            as period_id,
  gp.period_index,
  gp.period_start,
  gp.period_end,
  coalesce(gp.target_value, g.target_value) as period_target,
  case
    when gp.id is null then 0
    else app.goal_progress(g.id, gp.period_start, gp.period_end)
  end              as current_value
from public.goals g
left join public.goal_periods gp
  on gp.goal_id = g.id and gp.status = 'active'
where g.deleted_at is null;

grant select on public.goal_overview to authenticated;
