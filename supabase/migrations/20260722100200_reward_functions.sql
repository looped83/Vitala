-- ============================================================================
-- Vitala · Migration 0016 · Reward computation functions (Phase 5)
-- ----------------------------------------------------------------------------
-- Server-authoritative reward logic (ADR-0005). Design (ADR-0035):
--   * All per-entry XP/resource grants use a RECONCILE-TO-TARGET model: the
--     whole (user, area, day) is recomputed from live entries and the ledger is
--     adjusted by the delta. This is idempotent (re-run → delta 0), makes edits
--     and deletes ordinary corrections (target changes), applies daily caps in
--     a single stable pass, and never rewrites a past row (§41/§42).
--   * One-shot milestone grants (missions, goals, balance) use dedup keys so a
--     double request fails at the unique index (§15).
--   * The write-path RPCs from Phase 3/4 call these in the SAME transaction.
--
-- Formulas mirror src/domain/rewards exactly. Rounding = round(numeric) (half
-- away from zero). References: docs/reward-rules.md, docs/reward-corrections.md,
-- docs/reward-ledger.md, resources-and-xp §1/§2/§5.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Math helpers (immutable, private).
-- ---------------------------------------------------------------------------
create or replace function app.movement_base_xp(p_min integer)
returns integer language sql immutable set search_path = '' as $$
  select case
    when p_min <= 10  then 4
    when p_min <= 20  then 6
    when p_min <= 35  then 9
    when p_min <= 55  then 12
    when p_min <= 80  then 14
    else 15
  end;
$$;

create or replace function app.city_xp(p_amount integer)
returns integer language sql immutable set search_path = '' as $$
  select round(0.5 * p_amount)::integer;
$$;

create or replace function app.resource_amount(p_amount integer)
returns integer language sql immutable set search_path = '' as $$
  select round(0.4 * p_amount)::integer;
$$;

create or replace function app.area_resource(p_area public.life_area)
returns public.resource_key language sql immutable set search_path = '' as $$
  select case p_area
    when 'movement' then 'energy'
    when 'nutrition' then 'food'
    else 'nature'
  end::public.resource_key;
$$;

-- Rule version in force for a business date (§16). Latest active version whose
-- valid_from ≤ date; past ledger rows keep whatever version they carry.
create or replace function app.rule_version_for(p_date date)
returns integer language sql stable set search_path = '' as $$
  select coalesce(
    (select max(version) from public.reward_rule_versions
     where is_active and valid_from <= p_date), 1);
$$;

create or replace function app.week_start(p_hh uuid, p_date date)
returns date language sql stable set search_path = '' as $$
  select app.period_start('week'::public.goal_period_type, p_date,
    coalesce((select week_start from public.household_settings where household_id = p_hh), 1)::smallint);
$$;

-- ---------------------------------------------------------------------------
-- Ledger reconcile primitives. Bring the ledger's running total for one logical
-- identity to `p_target` by appending a single signed delta row. Idempotent.
-- ---------------------------------------------------------------------------
create or replace function app.reconcile_xp(
  p_hh uuid, p_uid uuid, p_scope public.xp_scope, p_target integer,
  p_reason public.xp_reason, p_area public.life_area,
  p_source_kind public.reward_source_kind, p_source_id uuid, p_date date
) returns void language plpgsql set search_path = '' as $$
declare
  v_existing integer;
  v_delta integer;
begin
  -- Identity is date-scoped: an entry's reward belongs to its business day, so
  -- moving an entry to another day moves its reward there (§43).
  select coalesce(sum(amount), 0) into v_existing
  from public.experience_transactions
  where source_kind = p_source_kind and source_id = p_source_id
    and scope = p_scope and user_id is not distinct from p_uid and business_date = p_date;
  v_delta := p_target - v_existing;
  if v_delta = 0 then return; end if;
  insert into public.experience_transactions
    (household_id, user_id, scope, amount, reason, area, source_kind, source_id,
     rule_version, business_date)
  values (p_hh, p_uid, p_scope, v_delta,
    case when v_existing = 0 then p_reason else 'correction' end,
    p_area, p_source_kind, p_source_id, app.rule_version_for(p_date), p_date);
end;
$$;

create or replace function app.reconcile_resource(
  p_hh uuid, p_key public.resource_key, p_target integer,
  p_reason public.resource_reason, p_source_kind public.reward_source_kind,
  p_source_id uuid, p_uid uuid, p_date date
) returns void language plpgsql set search_path = '' as $$
declare
  v_existing integer;
  v_delta integer;
begin
  select coalesce(sum(amount), 0) into v_existing
  from public.resource_transactions
  where source_kind = p_source_kind and source_id = p_source_id
    and resource_key = p_key and created_by is not distinct from p_uid and business_date = p_date;
  v_delta := p_target - v_existing;
  if v_delta = 0 then return; end if;
  insert into public.resource_transactions
    (household_id, resource_key, amount, reason, source_kind, source_id,
     rule_version, created_by, business_date)
  values (p_hh, p_key, v_delta,
    case when v_existing = 0 then p_reason else 'correction' end,
    p_source_kind, p_source_id, app.rule_version_for(p_date), p_uid, p_date);
  insert into public.resources (household_id, resource_key, balance, total_earned, total_spent)
  values (p_hh, p_key, greatest(0, v_delta), greatest(0, v_delta), greatest(0, -v_delta))
  on conflict (household_id, resource_key) do update set
    balance = greatest(0, public.resources.balance + v_delta),
    total_earned = public.resources.total_earned + greatest(0, v_delta),
    total_spent = public.resources.total_spent + greatest(0, -v_delta),
    updated_at = now();
end;
$$;

-- One-shot dedup grant (missions/goals/balance). Returns true when it inserted.
create or replace function app.grant_once_xp(
  p_hh uuid, p_uid uuid, p_scope public.xp_scope, p_amount integer,
  p_reason public.xp_reason, p_source_kind public.reward_source_kind,
  p_source_id uuid, p_date date, p_dedup text
) returns boolean language plpgsql set search_path = '' as $$
begin
  if p_amount = 0 then return false; end if;
  insert into public.experience_transactions
    (household_id, user_id, scope, amount, reason, source_kind, source_id,
     rule_version, business_date, dedup_key)
  values (p_hh, p_uid, p_scope, p_amount, p_reason, p_source_kind, p_source_id,
    app.rule_version_for(p_date), p_date, p_dedup)
  on conflict (dedup_key) where dedup_key is not null do nothing;
  return found;
end;
$$;

create or replace function app.grant_once_resource(
  p_hh uuid, p_key public.resource_key, p_amount integer,
  p_reason public.resource_reason, p_source_kind public.reward_source_kind,
  p_source_id uuid, p_uid uuid, p_date date, p_dedup text
) returns boolean language plpgsql set search_path = '' as $$
declare v_inserted boolean := false;
begin
  if p_amount = 0 then return false; end if;
  insert into public.resource_transactions
    (household_id, resource_key, amount, reason, source_kind, source_id,
     rule_version, created_by, business_date, dedup_key)
  values (p_hh, p_key, p_amount, p_reason, p_source_kind, p_source_id,
    app.rule_version_for(p_date), p_uid, p_date, p_dedup)
  on conflict (dedup_key) where dedup_key is not null do nothing;
  v_inserted := found;
  if v_inserted then
    insert into public.resources (household_id, resource_key, balance, total_earned, total_spent)
    values (p_hh, p_key, greatest(0, p_amount), greatest(0, p_amount), greatest(0, -p_amount))
    on conflict (household_id, resource_key) do update set
      balance = greatest(0, public.resources.balance + p_amount),
      total_earned = public.resources.total_earned + greatest(0, p_amount),
      total_spent = public.resources.total_spent + greatest(0, -p_amount),
      updated_at = now();
  end if;
  return v_inserted;
end;
$$;

-- ---------------------------------------------------------------------------
-- Per-user movement reconcile for a local day. Recomputes the whole day so the
-- 30-XP cap, regeneration "max 1/day" and the shared-community cap are applied
-- in one stable pass (§8/§9/§38). City XP is granted once, only on the pass of
-- the entry's creator.
-- ---------------------------------------------------------------------------
create or replace function app.reconcile_movement_user(p_hh uuid, p_uid uuid, p_day date)
returns void language plpgsql set search_path = '' as $$
declare
  a record;
  v_raw integer;
  v_award integer;
  v_prior integer := 0;
  v_regen_used boolean := false;
  v_comm_prior integer := 0;
  v_comm integer;
begin
  for a in
    select act.id, act.user_id, act.is_shared, act.group_id, act.duration_min,
           act.intensity, t.reward_weight, t.is_regeneration, act.created_at
    from public.activities act
    join public.activity_types t on t.id = act.activity_type_id
    where act.household_id = p_hh and act.deleted_at is null and act.occurred_on = p_day
      and (
        (act.user_id = p_uid and not act.is_shared)
        or (act.is_shared and exists (
          select 1 from public.entry_participants ep
          where ep.entry_kind = 'activity' and ep.group_id = act.group_id and ep.user_id = p_uid))
      )
    order by act.created_at, act.id
  loop
    if a.is_regeneration then
      v_raw := 6;
      if v_regen_used then v_raw := 0; else v_regen_used := true; end if;
    else
      v_raw := round(
        app.movement_base_xp(a.duration_min) * a.reward_weight
        * case a.intensity when 'light' then 0.95 when 'intense' then 1.10 else 1.00 end)::integer;
    end if;
    v_award := least(v_raw, greatest(0, 30 - v_prior));
    v_prior := v_prior + v_award;

    perform app.reconcile_xp(p_hh, p_uid, 'personal', v_award, 'activity', 'movement', 'activity', a.id, p_day);
    perform app.reconcile_resource(p_hh, 'energy', app.resource_amount(v_award), 'grant', 'activity', a.id, p_uid, p_day);
    if a.user_id = p_uid then
      perform app.reconcile_xp(p_hh, null, 'city', app.city_xp(v_award), 'activity', 'movement', 'activity', a.id, p_day);
    end if;
    if a.is_shared then
      v_comm := least(2, greatest(0, 3 - v_comm_prior));
      v_comm_prior := v_comm_prior + v_comm;
      perform app.reconcile_resource(p_hh, 'community', v_comm, 'grant', 'activity', a.id, p_uid, p_day);
    else
      perform app.reconcile_resource(p_hh, 'community', 0, 'grant', 'activity', a.id, p_uid, p_day);
    end if;
  end loop;

  -- Sweep: zero any activity source that still carries ledger rows for this
  -- (user, day) but is no longer a live participated entry — i.e. it was
  -- deleted, moved to another day, or lost this participant (§42).
  perform app.sweep_orphan_reward(p_hh, p_uid, 'activity', p_day, s.source_id, 'movement', 'energy')
  from (
    select distinct source_id from public.experience_transactions
      where household_id = p_hh and scope = 'personal' and user_id = p_uid
        and source_kind = 'activity' and business_date = p_day and source_id is not null
    union
    select distinct source_id from public.resource_transactions
      where household_id = p_hh and created_by = p_uid
        and source_kind = 'activity' and business_date = p_day and source_id is not null
  ) s
  where not exists (
    select 1 from public.activities act
    where act.id = s.source_id and act.deleted_at is null
      and act.occurred_on = p_day and act.household_id = p_hh
      and ((act.user_id = p_uid and not act.is_shared)
        or (act.is_shared and exists (select 1 from public.entry_participants ep
              where ep.entry_kind = 'activity' and ep.group_id = act.group_id and ep.user_id = p_uid))));
end;
$$;

-- Reconcile every ledger identity of one orphaned source back to zero.
create or replace function app.sweep_orphan_reward(
  p_hh uuid, p_uid uuid, p_source_kind public.reward_source_kind, p_day date,
  p_source_id uuid, p_area public.life_area, p_key public.resource_key
) returns void language plpgsql set search_path = '' as $$
begin
  perform app.reconcile_xp(p_hh, p_uid, 'personal', 0, 'correction', p_area, p_source_kind, p_source_id, p_day);
  perform app.reconcile_xp(p_hh, null, 'city', 0, 'correction', p_area, p_source_kind, p_source_id, p_day);
  perform app.reconcile_resource(p_hh, p_key, 0, 'correction', p_source_kind, p_source_id, p_uid, p_day);
  perform app.reconcile_resource(p_hh, 'community', 0, 'correction', p_source_kind, p_source_id, p_uid, p_day);
end;
$$;

-- Per-user ritual reconcile for one area + local day (nutrition/sustainability/
-- animal welfare). Daily-block and special-action budgets are independent (§8).
create or replace function app.reconcile_ritual_user(
  p_hh uuid, p_uid uuid, p_area public.life_area, p_day date)
returns void language plpgsql set search_path = '' as $$
declare
  g record;
  v_special_cap integer := case when p_area in ('sustainability', 'animal_welfare') then 5 else 0 end;
  v_area_cap integer := case p_area when 'nutrition' then 12 else 10 end;
  v_daily integer; v_special integer; v_award integer;
  v_prior_daily integer := 0; v_prior_special integer := 0;
  v_comm_prior integer := 0; v_comm integer;
  v_key public.resource_key := app.area_resource(p_area);
begin
  for g in
    select re.entry_group_id,
           bool_or(re.is_shared) as is_shared,
           max(re.user_id::text)::uuid as creator,
           count(*) filter (where rd.kind = 'daily_block') as daily_blocks,
           count(*) filter (where rd.kind = 'special_action') as special_actions,
           min(re.created_at) as created_at
    from public.ritual_entries re
    join public.ritual_definitions rd on rd.id = re.ritual_definition_id
    where re.household_id = p_hh and re.deleted_at is null and re.area = p_area and re.occurred_on = p_day
      and (
        (re.user_id = p_uid and not re.is_shared)
        or (re.is_shared and exists (
          select 1 from public.entry_participants ep
          where ep.entry_kind = 'ritual' and ep.group_id = re.entry_group_id and ep.user_id = p_uid))
      )
    group by re.entry_group_id
    order by min(re.created_at), re.entry_group_id
  loop
    v_daily := least(2 * g.daily_blocks, greatest(0, v_area_cap - v_prior_daily));
    v_prior_daily := v_prior_daily + v_daily;
    v_special := least(5 * g.special_actions, greatest(0, v_special_cap - v_prior_special));
    v_prior_special := v_prior_special + v_special;
    v_award := v_daily + v_special;

    perform app.reconcile_xp(p_hh, p_uid, 'personal', v_award, 'ritual', p_area, 'ritual_checkin', g.entry_group_id, p_day);
    perform app.reconcile_resource(p_hh, v_key, app.resource_amount(v_award), 'grant', 'ritual_checkin', g.entry_group_id, p_uid, p_day);
    if g.creator = p_uid then
      perform app.reconcile_xp(p_hh, null, 'city', app.city_xp(v_award), 'ritual', p_area, 'ritual_checkin', g.entry_group_id, p_day);
    end if;
    if g.is_shared then
      v_comm := least(2, greatest(0, 3 - v_comm_prior));
      v_comm_prior := v_comm_prior + v_comm;
      perform app.reconcile_resource(p_hh, 'community', v_comm, 'grant', 'ritual_checkin', g.entry_group_id, p_uid, p_day);
    else
      perform app.reconcile_resource(p_hh, 'community', 0, 'grant', 'ritual_checkin', g.entry_group_id, p_uid, p_day);
    end if;
  end loop;

  -- Sweep orphaned ritual check-in grants (deleted / moved / participant lost).
  -- Candidates come from the area-tagged XP ledger; resource grants always
  -- accompany an XP grant, except a fully day-capped shared check-in whose only
  -- grant was community — that rare community-only source is left untouched
  -- (a tiny, loss-free surplus, never a user loss — documented reward-corrections.md).
  perform app.sweep_orphan_reward(p_hh, p_uid, 'ritual_checkin', p_day, s.source_id, p_area, v_key)
  from (
    select distinct source_id from public.experience_transactions
      where household_id = p_hh and scope = 'personal' and user_id = p_uid
        and source_kind = 'ritual_checkin' and area = p_area and business_date = p_day and source_id is not null
  ) s
  where not exists (
    select 1 from public.ritual_entries re
    where re.entry_group_id = s.source_id and re.deleted_at is null
      and re.area = p_area and re.occurred_on = p_day and re.household_id = p_hh
      and ((re.user_id = p_uid and not re.is_shared)
        or (re.is_shared and exists (select 1 from public.entry_participants ep
              where ep.entry_kind = 'ritual' and ep.group_id = re.entry_group_id and ep.user_id = p_uid))));
end;
$$;

-- Household-wide sync entry points: reconcile both members (a household has at
-- most two), then refresh the week's balance snapshot.
create or replace function app.reward_sync_movement(p_hh uuid, p_day date)
returns void language plpgsql set search_path = '' as $$
declare m record;
begin
  for m in select user_id from public.household_members where household_id = p_hh and status = 'active' loop
    perform app.reconcile_movement_user(p_hh, m.user_id, p_day);
  end loop;
  perform app.touch_weekly_balance(p_hh, p_day);
end;
$$;

create or replace function app.reward_sync_ritual(p_hh uuid, p_area public.life_area, p_day date)
returns void language plpgsql set search_path = '' as $$
declare m record;
begin
  for m in select user_id from public.household_members where household_id = p_hh and status = 'active' loop
    perform app.reconcile_ritual_user(p_hh, m.user_id, p_area, p_day);
  end loop;
  perform app.touch_weekly_balance(p_hh, p_day);
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekly balance snapshot + graduated, once-per-week, loss-free bonus (§37).
-- Grants are incremental per stage via dedup keys, so a week that reaches
-- stage 4 ends with exactly balanceBonus(4); nothing is ever removed.
-- ---------------------------------------------------------------------------
create or replace function app.touch_weekly_balance(p_hh uuid, p_day date)
returns void language plpgsql set search_path = '' as $$
declare
  v_ws date := app.week_start(p_hh, p_day);
  v_we date := v_ws + 6;
  v_mov integer; v_nut integer; v_sus integer; v_ani integer;
  v_active integer; v_both boolean;
  v_members uuid[];
begin
  -- Qualifying entry counts per area in the week (live entries only).
  select count(*) filter (where kind = 'movement') into v_mov from (
    select 'movement' as kind from public.activities
      where household_id = p_hh and deleted_at is null and occurred_on between v_ws and v_we
  ) s;
  select
    count(*) filter (where area = 'nutrition'),
    count(*) filter (where area = 'sustainability'),
    count(*) filter (where area = 'animal_welfare')
  into v_nut, v_sus, v_ani
  from (
    select distinct area, entry_group_id from public.ritual_entries
    where household_id = p_hh and deleted_at is null and occurred_on between v_ws and v_we
  ) r;

  v_active := (v_mov > 0)::int + (v_nut > 0)::int + (v_sus > 0)::int + (v_ani > 0)::int;

  -- Did both active members contribute at least one qualifying entry this week?
  select array_agg(user_id) into v_members
  from public.household_members where household_id = p_hh and status = 'active';
  v_both := (
    select count(*) = coalesce(array_length(v_members, 1), 0) and coalesce(array_length(v_members, 1), 0) >= 2
    from (
      select u as uid from unnest(v_members) u
      where exists (select 1 from public.activities a
              where a.household_id = p_hh and a.deleted_at is null
                and a.occurred_on between v_ws and v_we
                and (a.user_id = u or exists (select 1 from public.entry_participants ep
                       where ep.entry_kind = 'activity' and ep.group_id = a.group_id and ep.user_id = u)))
         or exists (select 1 from public.ritual_entries re
              where re.household_id = p_hh and re.deleted_at is null
                and re.occurred_on between v_ws and v_we
                and (re.user_id = u or exists (select 1 from public.entry_participants ep
                       where ep.entry_kind = 'ritual' and ep.group_id = re.entry_group_id and ep.user_id = u)))
    ) contributors
  );

  insert into public.weekly_balance_snapshots
    (household_id, week_start, week_end, movement_count, nutrition_count,
     sustainability_count, animal_welfare_count, active_areas, stage, both_contributed, bonus_granted)
  values (p_hh, v_ws, v_we, v_mov, v_nut, v_sus, v_ani, v_active, v_active, v_both, v_active >= 3)
  on conflict (household_id, week_start) do update set
    movement_count = excluded.movement_count,
    nutrition_count = excluded.nutrition_count,
    sustainability_count = excluded.sustainability_count,
    animal_welfare_count = excluded.animal_welfare_count,
    active_areas = excluded.active_areas,
    stage = excluded.stage,
    both_contributed = excluded.both_contributed,
    bonus_granted = public.weekly_balance_snapshots.bonus_granted or excluded.active_areas >= 3,
    computed_at = now();

  -- Incremental, idempotent bonus grants keyed per (household, week, tier).
  if v_active >= 3 then
    perform app.grant_once_xp(p_hh, null, 'city', 10, 'balance_bonus', 'balance', null, v_ws,
      'balance:' || p_hh || ':' || v_ws || ':city3');
    perform app.grant_once_resource(p_hh, 'community', 1, 'balance_bonus', 'balance', null, null, v_ws,
      'balance:' || p_hh || ':' || v_ws || ':comm3');
    if v_both then
      perform app.grant_balance_personal(p_hh, v_members, v_ws);
    end if;
  end if;
  if v_active >= 4 then
    perform app.grant_once_xp(p_hh, null, 'city', 10, 'balance_bonus', 'balance', null, v_ws,
      'balance:' || p_hh || ':' || v_ws || ':city4');
    perform app.grant_once_resource(p_hh, 'nature', 1, 'balance_bonus', 'balance', null, null, v_ws,
      'balance:' || p_hh || ':' || v_ws || ':nat4');
    perform app.grant_once_resource(p_hh, 'community', 1, 'balance_bonus', 'balance', null, null, v_ws,
      'balance:' || p_hh || ':' || v_ws || ':comm4');
  end if;
end;
$$;

create or replace function app.grant_balance_personal(p_hh uuid, p_members uuid[], p_ws date)
returns void language plpgsql set search_path = '' as $$
declare u uuid;
begin
  foreach u in array coalesce(p_members, '{}'::uuid[]) loop
    perform app.grant_once_xp(p_hh, u, 'personal', 5, 'balance_bonus', 'balance', null, p_ws,
      'balance:' || p_hh || ':' || p_ws || ':p5:' || u);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ritual-completion + check-in rewards (§40). Small, capped nudges. Idempotent
-- via reconcile (ritual completion) / dedup (check-in). Called from Phase-4 RPCs.
-- ---------------------------------------------------------------------------
create or replace function app.reward_ritual_completion(p_hh uuid, p_uid uuid, p_completion_id uuid, p_day date)
returns void language plpgsql set search_path = '' as $$
declare
  v_prior integer;
  v_already integer;
  v_award integer;
begin
  -- XP already granted for ritual completions by this user today (excluding this one).
  select coalesce(sum(amount), 0) into v_prior
  from public.experience_transactions
  where household_id = p_hh and user_id = p_uid and scope = 'personal'
    and source_kind = 'ritual_completion' and reason in ('ritual', 'correction')
    and business_date = p_day and source_id <> p_completion_id;
  select count(*) into v_already
  from public.experience_transactions
  where household_id = p_hh and user_id = p_uid and scope = 'personal'
    and source_kind = 'ritual_completion' and business_date = p_day and source_id <> p_completion_id;
  v_award := least(case when v_already = 0 then 2 else 1 end, greatest(0, 6 - v_prior));
  perform app.reconcile_xp(p_hh, p_uid, 'personal', v_award, 'ritual', null, 'ritual_completion', p_completion_id, p_day);
  perform app.reconcile_xp(p_hh, null, 'city', app.city_xp(v_award), 'ritual', null, 'ritual_completion', p_completion_id, p_day);
  perform app.touch_weekly_balance(p_hh, p_day);
end;
$$;

create or replace function app.clear_reward(p_source_kind public.reward_source_kind, p_source_id uuid, p_hh uuid, p_day date)
returns void language plpgsql set search_path = '' as $$
begin
  -- Reconcile every scope/user identity touched by this source back to zero.
  perform app.reconcile_xp(p_hh, user_id, scope, 0, 'correction', area, p_source_kind, p_source_id, p_day)
  from (
    select distinct scope, user_id, area from public.experience_transactions
    where source_kind = p_source_kind and source_id = p_source_id
  ) s;
  perform app.reconcile_resource(p_hh, resource_key, 0, 'correction', p_source_kind, p_source_id, created_by, p_day)
  from (
    select distinct resource_key, created_by from public.resource_transactions
    where source_kind = p_source_kind and source_id = p_source_id
  ) r;
end;
$$;

create or replace function app.reward_checkin(p_hh uuid, p_uid uuid, p_checkin_id uuid, p_day date)
returns void language plpgsql set search_path = '' as $$
declare v_prior integer; v_award integer;
begin
  select coalesce(sum(amount), 0) into v_prior
  from public.experience_transactions
  where household_id = p_hh and user_id = p_uid and scope = 'personal'
    and source_kind = 'checkin' and business_date = p_day and source_id <> p_checkin_id;
  v_award := least(1, greatest(0, 2 - v_prior));
  perform app.reconcile_xp(p_hh, p_uid, 'personal', v_award, 'checkin', null, 'checkin', p_checkin_id, p_day);
  perform app.reconcile_xp(p_hh, null, 'city', app.city_xp(v_award), 'checkin', null, 'checkin', p_checkin_id, p_day);
  -- Community for the shared rhythm of daily check-ins (§5.1).
  perform app.reconcile_resource(p_hh, 'community', 1, 'grant', 'checkin', p_checkin_id, p_uid, p_day);
  perform app.touch_weekly_balance(p_hh, p_day);
end;
$$;

-- ---------------------------------------------------------------------------
-- Read views (status + resources). security_invoker = false so a household
-- member can see the household's aggregate level status without READ access to
-- the partner's individual XP rows; an explicit is_active_member guard keeps
-- each caller to their own household (§46).
-- ---------------------------------------------------------------------------
create or replace view public.personal_reward_status
with (security_invoker = false) as
select
  hm.household_id,
  hm.user_id,
  coalesce(agg.total_xp, 0) as total_xp,
  ld.level,
  ld.title,
  ld.cumulative_xp as level_floor_xp,
  nx.cumulative_xp as next_level_xp
from public.household_members hm
left join (
  select user_id, household_id, sum(amount)::bigint as total_xp
  from public.experience_transactions where scope = 'personal'
  group by user_id, household_id
) agg on agg.user_id = hm.user_id and agg.household_id = hm.household_id
cross join lateral (
  select * from public.level_definitions
  where scope = 'personal' and cumulative_xp <= coalesce(agg.total_xp, 0)
  order by level desc limit 1
) ld
left join lateral (
  select * from public.level_definitions
  where scope = 'personal' and level = ld.level + 1
) nx on true
where hm.status = 'active' and app.is_active_member(hm.household_id);

create or replace view public.city_reward_status
with (security_invoker = false) as
select
  h.id as household_id,
  coalesce(agg.total_xp, 0) as total_xp,
  ld.level,
  ld.title,
  ld.cumulative_xp as level_floor_xp,
  nx.cumulative_xp as next_level_xp
from public.households h
left join (
  select household_id, sum(amount)::bigint as total_xp
  from public.experience_transactions where scope = 'city'
  group by household_id
) agg on agg.household_id = h.id
cross join lateral (
  select * from public.level_definitions
  where scope = 'city' and cumulative_xp <= coalesce(agg.total_xp, 0)
  order by level desc limit 1
) ld
left join lateral (
  select * from public.level_definitions
  where scope = 'city' and level = ld.level + 1
) nx on true
where app.is_active_member(h.id);

grant select on public.personal_reward_status to authenticated;
grant select on public.city_reward_status to authenticated;

-- ---------------------------------------------------------------------------
-- Re-create the Phase-3 write-path RPCs so they trigger reward reconciliation
-- in the SAME transaction (ADR-0035). Bodies are unchanged except for the added
-- reward-sync calls covering both the old and new business day of an edit.
-- ---------------------------------------------------------------------------
create or replace function public.save_activity(
  p_id uuid, p_activity_type_id uuid, p_occurred_on date, p_duration_min integer,
  p_intensity public.activity_intensity default null, p_started_at_time time default null,
  p_location text default null, p_note text default null, p_custom_label text default null,
  p_is_shared boolean default false, p_partner_user_id uuid default null,
  p_source public.entry_source default 'manual', p_idempotency_key uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_today date;
  v_group uuid;
  v_id uuid;
  v_existing public.activities;
  v_prev_day date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_household := app.current_household(v_uid);
  if v_household is null then raise exception 'not_in_household' using hint = 'Du gehörst zu keinem aktiven Household.'; end if;

  if not exists (select 1 from public.activity_types t
      where t.id = p_activity_type_id and t.is_active and t.area = 'movement') then
    raise exception 'invalid_type' using hint = 'Unbekannter Bewegungstyp.';
  end if;
  if p_duration_min is null or p_duration_min < 5 or p_duration_min > 300 then
    raise exception 'invalid_duration' using hint = 'Dauer muss zwischen 5 und 300 Minuten liegen.';
  end if;

  v_today := app.household_today(v_household);
  if p_occurred_on is null or p_occurred_on > v_today or p_occurred_on < date '2020-01-01' then
    raise exception 'invalid_date' using hint = 'Datum darf nicht in der Zukunft liegen.';
  end if;

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

  if p_id is null and p_idempotency_key is not null then
    select a.id into v_id from public.activities a
    where a.household_id = v_household and a.idempotency_key = p_idempotency_key;
    if v_id is not null then return v_id; end if;
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
    ) returning id into v_id;
  else
    select * into v_existing from public.activities where id = p_id and deleted_at is null;
    if v_existing.id is null then raise exception 'not_found'; end if;
    if v_existing.household_id <> v_household then raise exception 'not_allowed'; end if;
    if v_existing.created_by <> v_uid then
      raise exception 'not_allowed' using hint = 'Nur die erfassende Person kann bearbeiten.';
    end if;
    v_prev_day := v_existing.occurred_on;
    v_group := coalesce(v_existing.group_id, case when p_is_shared then gen_random_uuid() else null end);
    update public.activities set
      activity_type_id = p_activity_type_id, occurred_on = p_occurred_on,
      started_at_time = p_started_at_time, duration_min = p_duration_min, intensity = p_intensity,
      location = p_location, note = p_note, custom_label = p_custom_label, is_shared = p_is_shared,
      group_id = case when p_is_shared then v_group else null end
    where id = p_id;
    v_id := p_id;
  end if;

  delete from public.entry_participants
    where entry_kind = 'activity' and group_id = coalesce(v_group, '00000000-0000-0000-0000-000000000000');
  if p_is_shared then
    insert into public.entry_participants (household_id, entry_kind, group_id, user_id)
    values (v_household, 'activity', v_group, v_uid), (v_household, 'activity', v_group, p_partner_user_id)
    on conflict (entry_kind, group_id, user_id) do nothing;
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_household, v_uid, case when p_id is null then 'activity_created' else 'activity_updated' end,
    'activity', v_id, jsonb_build_object('is_shared', p_is_shared));

  -- Reward reconciliation (ADR-0035): the new day, plus the old day when edited.
  perform app.reward_sync_movement(v_household, p_occurred_on);
  if v_prev_day is not null and v_prev_day <> p_occurred_on then
    perform app.reward_sync_movement(v_household, v_prev_day);
  end if;
  return v_id;
end;
$$;

create or replace function public.save_ritual_checkin(
  p_group_id uuid, p_area public.life_area, p_definition_ids uuid[], p_occurred_on date,
  p_note text default null, p_meal_label text default null, p_custom_label text default null,
  p_is_shared boolean default false, p_partner_user_id uuid default null,
  p_source public.entry_source default 'manual'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_today date;
  v_group uuid;
  v_def_ids uuid[];
  v_valid_count integer;
  v_def uuid;
  v_prev_day date;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_area = 'movement' then raise exception 'invalid_type' using hint = 'Bewegung wird als Aktivität erfasst.'; end if;
  v_household := app.current_household(v_uid);
  if v_household is null then raise exception 'not_in_household'; end if;

  select array_agg(distinct d) into v_def_ids
  from unnest(coalesce(p_definition_ids, '{}'::uuid[])) as d where d is not null;
  if v_def_ids is null or array_length(v_def_ids, 1) < 1 then
    raise exception 'empty_selection' using hint = 'Bitte mindestens einen Baustein auswählen.';
  end if;
  select count(*) into v_valid_count from public.ritual_definitions rd
  where rd.id = any(v_def_ids) and rd.is_active and rd.area = p_area;
  if v_valid_count <> array_length(v_def_ids, 1) then
    raise exception 'invalid_type' using hint = 'Ungültige Auswahl für diesen Bereich.';
  end if;

  v_today := app.household_today(v_household);
  if p_occurred_on is null or p_occurred_on > v_today or p_occurred_on < date '2020-01-01' then
    raise exception 'invalid_date';
  end if;

  if p_is_shared then
    if p_partner_user_id is null or p_partner_user_id = v_uid then raise exception 'invalid_participant'; end if;
    if not app.is_active_member(v_household, p_partner_user_id) then raise exception 'invalid_participant'; end if;
  else
    p_partner_user_id := null;
  end if;

  if p_group_id is null then
    v_group := gen_random_uuid();
  else
    if not exists (select 1 from public.ritual_entries re
        where re.entry_group_id = p_group_id and re.household_id = v_household and re.deleted_at is null) then
      raise exception 'not_found';
    end if;
    if exists (select 1 from public.ritual_entries re
        where re.entry_group_id = p_group_id and re.created_by <> v_uid limit 1) then
      raise exception 'not_allowed';
    end if;
    select occurred_on into v_prev_day from public.ritual_entries where entry_group_id = p_group_id limit 1;
    v_group := p_group_id;
    delete from public.ritual_entries where entry_group_id = v_group;
  end if;

  begin
    foreach v_def in array v_def_ids loop
      insert into public.ritual_entries (
        household_id, user_id, created_by, ritual_definition_id, area,
        occurred_on, note, meal_label, custom_label, is_shared, entry_group_id, source
      ) values (
        v_household, v_uid, v_uid, v_def, p_area,
        p_occurred_on, p_note, p_meal_label, p_custom_label, p_is_shared, v_group, coalesce(p_source, 'manual')
      );
    end loop;
  exception when unique_violation then
    raise exception 'duplicate_ritual' using hint = 'Diesen Baustein hast du an diesem Tag bereits erfasst.';
  end;

  delete from public.entry_participants where entry_kind = 'ritual' and group_id = v_group;
  if p_is_shared then
    insert into public.entry_participants (household_id, entry_kind, group_id, user_id)
    values (v_household, 'ritual', v_group, v_uid), (v_household, 'ritual', v_group, p_partner_user_id)
    on conflict (entry_kind, group_id, user_id) do nothing;
  end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_household, v_uid, case when p_group_id is null then 'ritual_created' else 'ritual_updated' end,
    'ritual_entry', v_group, jsonb_build_object('area', p_area, 'is_shared', p_is_shared, 'count', array_length(v_def_ids, 1)));

  perform app.reward_sync_ritual(v_household, p_area, p_occurred_on);
  if v_prev_day is not null and v_prev_day <> p_occurred_on then
    perform app.reward_sync_ritual(v_household, p_area, v_prev_day);
  end if;
  return v_group;
end;
$$;

create or replace function public.delete_entry(p_kind public.entry_kind, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_household uuid;
  v_affected integer;
  v_day date;
  v_area public.life_area;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_household := app.current_household(v_uid);
  if v_household is null then raise exception 'not_in_household'; end if;

  if p_kind = 'activity' then
    select occurred_on into v_day from public.activities where id = p_id and household_id = v_household;
    update public.activities set deleted_at = now()
      where id = p_id and household_id = v_household and deleted_at is null;
    get diagnostics v_affected = row_count;
  else
    select occurred_on, area into v_day, v_area from public.ritual_entries
      where entry_group_id = p_id and household_id = v_household limit 1;
    update public.ritual_entries set deleted_at = now()
      where entry_group_id = p_id and household_id = v_household and deleted_at is null;
    get diagnostics v_affected = row_count;
  end if;
  if v_affected = 0 then raise exception 'not_found'; end if;

  insert into public.audit_log (household_id, actor_id, action, entity, entity_id, meta)
  values (v_household, v_uid, 'entry_deleted', p_kind::text, p_id, jsonb_build_object('kind', p_kind));

  -- Deletion is a correction: reconcile the affected day → grants shrink to the
  -- remaining live entries (§42). No ledger row is ever physically removed.
  if p_kind = 'activity' then
    perform app.reward_sync_movement(v_household, v_day);
  else
    perform app.reward_sync_ritual(v_household, v_area, v_day);
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Extend Phase-4 ritual completion + check-in RPCs to grant their small reward.
-- ---------------------------------------------------------------------------
create or replace function public.complete_ritual(
  p_ritual_id uuid, p_occurred_on date, p_status public.ritual_completion_status default 'done',
  p_value smallint default null, p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
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

  insert into public.ritual_completions (ritual_id, household_id, user_id, occurred_on, status, value_num, note)
  values (p_ritual_id, v_hh, v_uid, v_date, coalesce(p_status, 'done'), p_value, nullif(btrim(coalesce(p_note, '')), ''))
  on conflict (ritual_id, occurred_on) do update set
    user_id = excluded.user_id, status = excluded.status, value_num = excluded.value_num,
    note = excluded.note, updated_at = now()
  returning id into v_id;

  -- Reward only genuine "done" completions; a "skip"/"missed" state grants none.
  if coalesce(p_status, 'done') = 'done' then
    perform app.reward_ritual_completion(v_hh, v_uid, v_id, v_date);
    -- Rituals are scoped via owner_type (there is no is_shared column, unlike
    -- activities/ritual_entries): a shared ritual grants community.
    if r.owner_type = 'shared' then
      perform app.reconcile_resource(v_hh, 'community',
        least(1, greatest(0, 2 - app.shared_ritual_community_today(v_hh, v_date, v_id))),
        'grant', 'ritual_completion', v_id, v_uid, v_date);
    end if;
  else
    perform app.clear_reward('ritual_completion', v_id, v_hh, v_date);
  end if;
  return v_id;
end;
$$;

create or replace function app.shared_ritual_community_today(p_hh uuid, p_day date, p_exclude uuid)
returns integer language sql stable set search_path = '' as $$
  select coalesce(sum(amount), 0)::integer from public.resource_transactions
  where household_id = p_hh and resource_key = 'community' and business_date = p_day
    and source_kind = 'ritual_completion' and source_id <> p_exclude;
$$;

create or replace function public.clear_ritual_completion(p_ritual_id uuid, p_occurred_on date)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_hh uuid;
  r public.rituals;
  v_cid uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  select * into r from public.rituals where id = p_ritual_id;
  if r.id is null then raise exception 'not_found'; end if;
  if r.household_id <> v_hh then raise exception 'not_allowed'; end if;
  if r.owner_type = 'personal' and r.owner_user_id <> v_uid then raise exception 'not_allowed'; end if;
  select id into v_cid from public.ritual_completions where ritual_id = p_ritual_id and occurred_on = p_occurred_on and household_id = v_hh;
  delete from public.ritual_completions where ritual_id = p_ritual_id and occurred_on = p_occurred_on and household_id = v_hh;
  if v_cid is not null then
    perform app.clear_reward('ritual_completion', v_cid, v_hh, p_occurred_on);
    perform app.touch_weekly_balance(v_hh, p_occurred_on);
  end if;
end;
$$;

grant execute on function public.save_activity(uuid, uuid, date, integer, public.activity_intensity, time, text, text, text, boolean, uuid, public.entry_source, uuid) to authenticated;
grant execute on function public.save_ritual_checkin(uuid, public.life_area, uuid[], date, text, text, text, boolean, uuid, public.entry_source) to authenticated;
grant execute on function public.delete_entry(public.entry_kind, uuid) to authenticated;
grant execute on function public.complete_ritual(uuid, date, public.ritual_completion_status, smallint, text) to authenticated;
grant execute on function public.clear_ritual_completion(uuid, date) to authenticated;
