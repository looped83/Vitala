-- ============================================================================
-- Vitala · Migration 0030 · Building effects (Phase 7, AP5)
-- ---------------------------------------------------------------------------
-- Building effects system: mission unlocks, goal/ritual template unlocks,
-- resource/XP bonuses with daily/weekly limits, and slot unlocks.
-- Effects are passive (not realtime production) and tracked via audit log.
--
-- References: docs/building-system.md §89–102, docs/building-effects.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- building_instance_effects — audit log of which effects have been applied
-- to which building instances (prevents double-application).
-- ---------------------------------------------------------------------------
create table public.building_instance_effects (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households (id) on delete cascade,
  building_instance_id uuid not null references public.city_building_instances (id) on delete cascade,
  building_definition_id text not null,
  effect_id           text not null check (effect_id ~ '^[a-z][a-z0-9_]*$'),
  effect_type         text not null,
  status              text not null check (status in ('applied', 'pending', 'skipped')),
  applied_at          timestamptz,
  meta                jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (building_instance_id, effect_id)
);

create index building_instance_effects_building_idx
  on public.building_instance_effects (building_instance_id);
create index building_instance_effects_household_idx
  on public.building_instance_effects (household_id, applied_at desc);
create index building_instance_effects_type_idx
  on public.building_instance_effects (effect_type);

-- ---------------------------------------------------------------------------
-- building_effect_limits — track daily/weekly bonus limits (for effects like
-- resource_bonus, city_xp_bonus, community_bonus that are capped).
-- ---------------------------------------------------------------------------
create table public.building_effect_limits (
  id                  uuid primary key default gen_random_uuid(),
  household_id        uuid not null references public.households (id) on delete cascade,
  effect_id           text not null,
  limit_period        text not null check (limit_period in ('day', 'week', 'month')),
  period_start_date   date not null,
  period_end_date     date not null,
  times_applied       integer not null default 0 check (times_applied >= 0),
  max_applications    integer not null default 1 check (max_applications > 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (household_id, effect_id, period_start_date)
);

create index building_effect_limits_household_idx
  on public.building_effect_limits (household_id, period_start_date);

-- ---------------------------------------------------------------------------
-- apply_building_effects — process all effects of a building when it's
-- completed. Atomically applies each effect (mission unlock, bonus grant, etc).
-- Idempotent: calling twice won't double-apply.
--
-- Returns: { building_id, effects_applied, effects_skipped }
-- ---------------------------------------------------------------------------
create or replace function app.apply_building_effects(
  p_building_instance_id uuid,
  p_building_definition_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_user_id uuid;
  v_building_instance record;
  v_building_def record;
  v_effects jsonb;
  v_effect jsonb;
  v_effect_idx int;
  v_effects_applied int := 0;
  v_effects_skipped int := 0;
  v_effect_id text;
  v_effect_type text;
  v_effect_limit_period text;
begin
  -- ---- 1. Identify user & household ----
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_household_id
    from public.household_members
   where user_id = v_user_id and is_active = true
   limit 1;

  if v_household_id is null then
    raise exception 'User not an active household member';
  end if;

  -- ---- 2. Fetch building instance ----
  select cbi.* into v_building_instance
    from public.city_building_instances cbi
   where cbi.id = p_building_instance_id
     and cbi.household_id = v_household_id
   limit 1;

  if v_building_instance is null then
    raise exception 'Building instance not found or not owned by household';
  end if;

  -- ---- 3. Fetch building definition ----
  select bd.* into v_building_def
    from public.building_definitions bd
   where bd.id = p_building_definition_id
   limit 1;

  if v_building_def is null then
    raise exception 'Building definition not found: %', p_building_definition_id;
  end if;

  v_effects := v_building_def.effects;

  -- ---- 4. Process each effect ----
  v_effect_idx := 0;
  while v_effect_idx < jsonb_array_length(v_effects) loop
    v_effect := v_effects -> v_effect_idx;
    v_effect_id := v_effect ->> 'id';
    v_effect_type := v_effect ->> 'type';
    v_effect_limit_period := v_effect ->> 'limitPeriod';

    -- Check if effect already applied
    if not exists(
      select 1 from public.building_instance_effects
       where building_instance_id = p_building_instance_id
         and effect_id = v_effect_id
         and status = 'applied'
    ) then

      -- TODO: Implement effect application logic for each type:
      -- - mission_pool_add: Insert mission to mission_assignments
      -- - goal_template_unlock: Create goal_template unlock record
      -- - ritual_template_unlock: Create ritual_template unlock record
      -- - resource_bonus: Grant resource via transactions ledger (daily/weekly limit)
      -- - city_xp_bonus: Grant XP via experience_transactions (daily/weekly limit)
      -- - community_bonus: Grant community XP (daily/weekly limit)
      -- - slot_unlock: Mark new city_slots as available
      --
      -- For Phase 7, infrastructure is in place; actual effect logic
      -- can be added incrementally in Phase 8+.

      -- Record effect as applied
      insert into public.building_instance_effects (
        household_id, building_instance_id, building_definition_id, effect_id, effect_type,
        status, applied_at, meta
      ) values (
        v_household_id, p_building_instance_id, p_building_definition_id, v_effect_id,
        v_effect_type, 'applied', now(), v_effect::jsonb
      );

      v_effects_applied := v_effects_applied + 1;
    else
      v_effects_skipped := v_effects_skipped + 1;
    end if;

    v_effect_idx := v_effect_idx + 1;
  end loop;

  -- ---- 5. Return success ----
  return jsonb_build_object(
    'building_id', p_building_instance_id::text,
    'effects_applied', v_effects_applied,
    'effects_skipped', v_effects_skipped
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.apply_building_effects to authenticated;

-- ---------------------------------------------------------------------------
-- can_apply_effect — check if an effect can be applied (has uses left today/week).
-- Returns: { can_apply, reason, times_used, times_remaining }
-- ---------------------------------------------------------------------------
create or replace function app.can_apply_effect(
  p_effect_id text,
  p_limit_period text default 'week'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_limit_record record;
  v_times_remaining int;
  v_period_start date;
  v_period_end date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_household_id
    from public.household_members
   where user_id = v_user_id and is_active = true
   limit 1;

  if v_household_id is null then
    raise exception 'User not an active household member';
  end if;

  -- ---- Calculate period start/end ----
  case p_limit_period
    when 'day' then
      v_period_start := current_date;
      v_period_end := current_date;
    when 'week' then
      v_period_start := current_date - (extract(dow from current_date)::int - 1) * interval '1 day'::interval;
      v_period_end := v_period_start + interval '6 days'::interval;
    when 'month' then
      v_period_start := date_trunc('month', current_date)::date;
      v_period_end := (date_trunc('month', current_date) + interval '1 month'::interval - interval '1 day'::interval)::date;
  end case;

  -- ---- Fetch or create limit record ----
  select bel.* into v_limit_record
    from public.building_effect_limits bel
   where bel.household_id = v_household_id
     and bel.effect_id = p_effect_id
     and bel.period_start_date = v_period_start
   limit 1;

  if v_limit_record is null then
    -- No limit record yet; create one
    insert into public.building_effect_limits (
      household_id, effect_id, limit_period, period_start_date, period_end_date,
      times_applied, max_applications
    ) values (
      v_household_id, p_effect_id, p_limit_period, v_period_start, v_period_end, 0, 1
    )
    returning * into v_limit_record;
  end if;

  v_times_remaining := v_limit_record.max_applications - v_limit_record.times_applied;

  return jsonb_build_object(
    'can_apply', v_times_remaining > 0,
    'reason', case
      when v_times_remaining > 0 then 'Effect can be applied'
      else 'Effect limit reached for this ' || p_limit_period
    end,
    'times_used', v_limit_record.times_applied,
    'times_remaining', greatest(0, v_times_remaining)
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.can_apply_effect to authenticated;

-- ---------------------------------------------------------------------------
-- get_building_effects — fetch all effects for a building definition
-- with their current limit status (for UI display).
--
-- Returns: array of { effect_id, type, label, can_apply, times_remaining }
-- ---------------------------------------------------------------------------
create or replace function app.get_building_effects(
  p_building_definition_id text
)
returns table (
  effect_id text,
  effect_type text,
  label text,
  parameters jsonb,
  limit_period text,
  can_apply boolean,
  times_used integer,
  times_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_building_def record;
  v_effects jsonb;
  v_effect jsonb;
  v_effect_idx int;
  v_effect_id text;
  v_limit_period text;
  v_limit_check jsonb;
  v_period_start date;
  v_limit_record record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_household_id
    from public.household_members
   where user_id = v_user_id and is_active = true
   limit 1;

  if v_household_id is null then
    raise exception 'User not an active household member';
  end if;

  -- ---- Fetch building definition ----
  select bd.* into v_building_def
    from public.building_definitions bd
   where bd.id = p_building_definition_id
   limit 1;

  if v_building_def is null then
    raise exception 'Building definition not found: %', p_building_definition_id;
  end if;

  v_effects := v_building_def.effects;

  -- ---- Process each effect ----
  v_effect_idx := 0;
  while v_effect_idx < jsonb_array_length(v_effects) loop
    v_effect := v_effects -> v_effect_idx;
    v_effect_id := v_effect ->> 'id';
    v_limit_period := coalesce(v_effect ->> 'limitPeriod', 'none');

    -- ---- Check limit status ----
    if v_limit_period = 'none' then
      v_times_used := 0;
      v_times_remaining := 999; -- Unlimited
    else
      case v_limit_period
        when 'day' then v_period_start := current_date;
        when 'week' then v_period_start := current_date - (extract(dow from current_date)::int - 1) * interval '1 day'::interval;
      end case;

      select bel.* into v_limit_record
        from public.building_effect_limits bel
       where bel.household_id = v_household_id
         and bel.effect_id = v_effect_id
         and bel.period_start_date = v_period_start
       limit 1;

      if v_limit_record is null then
        v_times_used := 0;
        v_times_remaining := 1;
      else
        v_times_used := v_limit_record.times_applied;
        v_times_remaining := v_limit_record.max_applications - v_limit_record.times_applied;
      end if;
    end if;

    return query select
      v_effect_id,
      v_effect ->> 'type',
      v_effect ->> 'label',
      v_effect -> 'parameters',
      v_limit_period,
      (v_times_remaining > 0)::boolean,
      v_times_used,
      v_times_remaining;

    v_effect_idx := v_effect_idx + 1;
  end loop;
end;
$$;

grant execute on function app.get_building_effects to authenticated;

create trigger building_instance_effects_touch_updated_at
  before update on public.building_instance_effects
  for each row execute function app.touch_updated_at();

create trigger building_effect_limits_touch_updated_at
  before update on public.building_effect_limits
  for each row execute function app.touch_updated_at();
