-- ============================================================================
-- Vitala · Migration 0028 · Building ledger & refunds (Phase 7, AP3)
-- ---------------------------------------------------------------------------
-- Resource refund logic, ledger verification guards, and error correction
-- for the construction project system. All building resource operations go
-- through SECURITY DEFINER functions that maintain ledger consistency.
--
-- References: docs/building-system.md §69–78, ADR-0032 (append-only ledger).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- cancel_construction_project — refund all resources and mark project cancelled.
-- Atomically:
-- 1. Verify user, household, project ownership
-- 2. Verify project is in cancellable state (not completed)
-- 3. Create refund ledger entries for each resource
-- 4. Update balances back to pre-project state
-- 5. Mark project as 'cancelled'
--
-- Returns: { project_id, refunded_resources, status } or error.
-- Idempotent: calling twice is safe (ledger dedup_key prevents double-refund).
-- ---------------------------------------------------------------------------
create or replace function app.cancel_construction_project(
  p_project_id text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_project record;
  v_refund_count integer := 0;
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

  -- ---- 2. Fetch project ----
  select cp.* into v_project
    from public.construction_projects cp
   where cp.id::text = p_project_id
     and cp.household_id = v_household_id
   limit 1;

  if v_project is null then
    raise exception 'Project not found or not owned by household: %', p_project_id;
  end if;

  -- ---- 3. Check if project is cancellable ----
  if v_project.status = 'completed' then
    raise exception 'Cannot cancel a completed project';
  end if;

  if v_project.status = 'cancelled' then
    raise exception 'Project is already cancelled';
  end if;

  -- ---- 4. Create refund ledger entries ----
  -- Energy refund
  if v_project.cost_energy > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id,
      'energy'::public.resource_key,
      v_project.cost_energy,
      'refund'::public.resource_reason,
      'manual'::public.reward_source_kind,
      p_project_id::uuid,
      1,
      current_date,
      p_idempotency_key || ':energy_refund',
      jsonb_build_object('building_id', v_project.building_definition_id, 'project_id', p_project_id)
    ) on conflict (dedup_key) where dedup_key is not null do nothing;

    update public.resources
       set balance = balance + v_project.cost_energy,
           updated_at = now()
     where household_id = v_household_id and resource_key = 'energy';

    v_refund_count := v_refund_count + 1;
  end if;

  -- Food refund
  if v_project.cost_food > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'food'::public.resource_key, v_project.cost_food,
      'refund'::public.resource_reason, 'manual'::public.reward_source_kind, p_project_id::uuid, 1, current_date,
      p_idempotency_key || ':food_refund', jsonb_build_object('building_id', v_project.building_definition_id, 'project_id', p_project_id)
    ) on conflict (dedup_key) where dedup_key is not null do nothing;

    update public.resources set balance = balance + v_project.cost_food, updated_at = now()
     where household_id = v_household_id and resource_key = 'food';

    v_refund_count := v_refund_count + 1;
  end if;

  -- Nature refund
  if v_project.cost_nature > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'nature'::public.resource_key, v_project.cost_nature,
      'refund'::public.resource_reason, 'manual'::public.reward_source_kind, p_project_id::uuid, 1, current_date,
      p_idempotency_key || ':nature_refund', jsonb_build_object('building_id', v_project.building_definition_id, 'project_id', p_project_id)
    ) on conflict (dedup_key) where dedup_key is not null do nothing;

    update public.resources set balance = balance + v_project.cost_nature, updated_at = now()
     where household_id = v_household_id and resource_key = 'nature';

    v_refund_count := v_refund_count + 1;
  end if;

  -- Community refund
  if v_project.cost_community > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'community'::public.resource_key, v_project.cost_community,
      'refund'::public.resource_reason, 'manual'::public.reward_source_kind, p_project_id::uuid, 1, current_date,
      p_idempotency_key || ':community_refund', jsonb_build_object('building_id', v_project.building_definition_id, 'project_id', p_project_id)
    ) on conflict (dedup_key) where dedup_key is not null do nothing;

    update public.resources set balance = balance + v_project.cost_community, updated_at = now()
     where household_id = v_household_id and resource_key = 'community';

    v_refund_count := v_refund_count + 1;
  end if;

  -- Building material refund
  if v_project.cost_building_material > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'building_material'::public.resource_key, v_project.cost_building_material,
      'refund'::public.resource_reason, 'manual'::public.reward_source_kind, p_project_id::uuid, 1, current_date,
      p_idempotency_key || ':material_refund', jsonb_build_object('building_id', v_project.building_definition_id, 'project_id', p_project_id)
    ) on conflict (dedup_key) where dedup_key is not null do nothing;

    update public.resources set balance = balance + v_project.cost_building_material, updated_at = now()
     where household_id = v_household_id and resource_key = 'building_material';

    v_refund_count := v_refund_count + 1;
  end if;

  -- ---- 5. Mark project as cancelled ----
  update public.construction_projects
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = p_project_id::uuid;

  -- ---- 6. Return success ----
  return jsonb_build_object(
    'project_id', p_project_id,
    'status', 'cancelled',
    'refunded_resource_count', v_refund_count,
    'refunded_resources', jsonb_build_object(
      'energy', v_project.cost_energy,
      'food', v_project.cost_food,
      'nature', v_project.cost_nature,
      'community', v_project.cost_community,
      'building_material', v_project.cost_building_material
    )
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.cancel_construction_project to authenticated;

-- ---------------------------------------------------------------------------
-- verify_ledger_consistency — check that a household's ledger balances are
-- consistent with the sum of transactions. Used for audits/recovery.
--
-- Returns: { is_consistent, resource_key, expected_balance, actual_balance }
-- for any mismatches, or empty array if all consistent.
-- ---------------------------------------------------------------------------
create or replace function app.verify_ledger_consistency(
  p_household_id uuid
)
returns table (
  is_consistent boolean,
  resource_key public.resource_key,
  expected_balance integer,
  actual_balance integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_current_household_id uuid;
begin
  -- ---- Only allow users to check their own household ledger ----
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_current_household_id
    from public.household_members
   where user_id = v_user_id and is_active = true
   limit 1;

  if v_current_household_id is null or v_current_household_id != p_household_id then
    raise exception 'Cannot access other household ledgers';
  end if;

  -- ---- For each resource key, compute expected balance from ledger ----
  return query
  with ledger_sums as (
    select
      rt.resource_key,
      coalesce(sum(rt.amount), 0) as computed_balance
    from public.resource_transactions rt
    where rt.household_id = p_household_id
    group by rt.resource_key
  )
  select
    (ls.computed_balance = r.balance)::boolean,
    ls.resource_key,
    ls.computed_balance::integer,
    r.balance::integer
  from ledger_sums ls
  full outer join public.resources r on ls.resource_key = r.resource_key
    and r.household_id = p_household_id
  where (ls.computed_balance != r.balance)
     or (ls.computed_balance is null and r.balance > 0)
     or (ls.computed_balance > 0 and r.balance is null);
end;
$$;

grant execute on function app.verify_ledger_consistency to authenticated;

-- ---------------------------------------------------------------------------
-- check_double_spend — verify that all dedup_keys are unique (no double-spend).
-- Returns count of violations, 0 if all OK.
-- ---------------------------------------------------------------------------
create or replace function app.check_double_spend(
  p_household_id uuid
)
returns table (
  dedup_key text,
  transaction_count integer,
  affected_resources text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_current_household_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into v_current_household_id
    from public.household_members
   where user_id = v_user_id and is_active = true
   limit 1;

  if v_current_household_id is null or v_current_household_id != p_household_id then
    raise exception 'Cannot access other household ledgers';
  end if;

  -- ---- Find all dedup_keys with more than one transaction ----
  return query
  select
    rt.dedup_key,
    count(*)::integer,
    string_agg(distinct rt.resource_key::text, ', ')
  from public.resource_transactions rt
  where rt.household_id = p_household_id
    and rt.dedup_key is not null
  group by rt.dedup_key
  having count(*) > 1;
end;
$$;

grant execute on function app.check_double_spend to authenticated;

-- ---------------------------------------------------------------------------
-- correct_transaction — add a correction transaction that reverses a prior
-- transaction. Used only in error recovery (rare). Corrections are append-only
-- and reference the original transaction via correction_of.
--
-- Returns: { original_id, correction_id, resource_key, original_amount, correction_amount }
-- ---------------------------------------------------------------------------
create or replace function app.correct_transaction(
  p_transaction_id uuid,
  p_correction_reason text,
  p_meta jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_original record;
  v_correction_id uuid;
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

  -- ---- Fetch original transaction ----
  select rt.* into v_original
    from public.resource_transactions rt
   where rt.id = p_transaction_id
     and rt.household_id = v_household_id
   limit 1;

  if v_original is null then
    raise exception 'Transaction not found or not owned by household';
  end if;

  -- ---- Create reverse transaction (negate the amount) ----
  v_correction_id := gen_random_uuid();

  insert into public.resource_transactions (
    id, household_id, resource_key, amount, reason, source_kind, source_id,
    rule_version, business_date, correction_of, created_by, meta
  ) values (
    v_correction_id,
    v_household_id,
    v_original.resource_key,
    -v_original.amount,
    'correction'::public.resource_reason,
    'manual'::public.reward_source_kind,
    p_transaction_id,
    v_original.rule_version,
    current_date,
    p_transaction_id,
    v_user_id,
    coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('correction_reason', p_correction_reason)
  );

  -- ---- Update balance ----
  update public.resources
     set balance = balance - v_original.amount,
         updated_at = now()
   where household_id = v_household_id and resource_key = v_original.resource_key;

  -- ---- Return success ----
  return jsonb_build_object(
    'original_id', p_transaction_id,
    'correction_id', v_correction_id,
    'resource_key', v_original.resource_key::text,
    'original_amount', v_original.amount,
    'correction_amount', -v_original.amount,
    'reason', p_correction_reason
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.correct_transaction to authenticated;

-- ---------------------------------------------------------------------------
-- get_project_refund_preview — calculate what would be refunded if a project
-- were cancelled (without actually cancelling). Useful for UI confirmation.
--
-- Returns: { can_cancel, resources } or error.
-- ---------------------------------------------------------------------------
create or replace function app.get_project_refund_preview(
  p_project_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_project record;
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

  select cp.* into v_project
    from public.construction_projects cp
   where cp.id::text = p_project_id
     and cp.household_id = v_household_id
   limit 1;

  if v_project is null then
    raise exception 'Project not found or not owned by household: %', p_project_id;
  end if;

  return jsonb_build_object(
    'can_cancel', v_project.status != 'completed' and v_project.status != 'cancelled',
    'status', v_project.status,
    'resources', jsonb_build_object(
      'energy', v_project.cost_energy,
      'food', v_project.cost_food,
      'nature', v_project.cost_nature,
      'community', v_project.cost_community,
      'building_material', v_project.cost_building_material
    )
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.get_project_refund_preview to authenticated;
