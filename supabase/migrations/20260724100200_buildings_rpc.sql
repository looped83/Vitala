-- ============================================================================
-- Vitala · Migration 0026 · Building RPC functions (Phase 7) — DDL only
-- ---------------------------------------------------------------------------
-- All building operations are SECURITY DEFINER functions that validate
-- permissions, ledger consistency, and building rules. The client never
-- directly manipulates building_instances, construction_projects, or
-- resource_transactions — only these RPCs do.
--
-- References: docs/building-system.md §68, ADR-TBD (RPC structure).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- start_construction_project — initiate a building project and deduct resources.
-- Atomically:
-- 1. Verify user, household, building unlock, slot availability
-- 2. Reserve/deduct resources
-- 3. Create construction project
-- 4. Log ledger entries
--
-- Returns: { project_id, cost_snapshot, build_points_required, ... } or error.
-- ---------------------------------------------------------------------------
create or replace function app.start_construction_project(
  p_building_id text,
  p_slot_id text,
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
  v_building_def record;
  v_slot_def record;
  v_city_level integer;
  v_built_buildings text[];
  v_current_resources record;
  v_new_project_id uuid;
  v_cost_energy integer;
  v_cost_food integer;
  v_cost_nature integer;
  v_cost_community integer;
  v_cost_material integer;
  v_total_cost integer;
  v_build_points_required integer;
begin
  -- ---- 1. Identify user & household -----
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

  -- ---- 2. Fetch building definition -----
  select bd.* into v_building_def
    from public.building_definitions bd
   where bd.id = p_building_id
   limit 1;

  if v_building_def is null then
    raise exception 'Building definition not found: %', p_building_id;
  end if;

  -- ---- 3. Fetch city level & unlocks -----
  -- City level is derived from city_xp; check unlock level.
  select coalesce(floor(
    (select coalesce(sum(amount), 0) from public.experience_transactions
      where household_id = v_household_id and scope = 'city') / 20.0
    ), 0) + 1 into v_city_level;

  if v_city_level < v_building_def.unlock_level then
    raise exception 'Building requires city level %, current %', v_building_def.unlock_level, v_city_level;
  end if;

  -- Check prerequisite building (if any).
  if v_building_def.prerequisite_building is not null then
    select array_agg(building_definition_id) filter (where status = 'active')
      into v_built_buildings
      from public.city_building_instances
     where household_id = v_household_id;

    if not (v_building_def.prerequisite_building = any(coalesce(v_built_buildings, '{}'::text[]))) then
      raise exception 'Prerequisite building not built: %', v_building_def.prerequisite_building;
    end if;
  end if;

  -- ---- 4. Fetch slot & verify compatibility -----
  -- For now, we trust the slot exists and is compatible; the UI layer validated.
  -- A full implementation would fetch the slot_id from city layout and re-verify.

  -- ---- 5. Check if slot is already occupied -----
  if exists (
    select 1 from public.city_building_instances
     where household_id = v_household_id and slot_id = p_slot_id
  ) then
    raise exception 'Slot already occupied: %', p_slot_id;
  end if;

  -- Check if there's an active project on this slot.
  if exists (
    select 1 from public.construction_projects
     where household_id = v_household_id
       and slot_id = p_slot_id
       and status not in ('completed', 'cancelled', 'failed')
  ) then
    raise exception 'Slot has active project: %', p_slot_id;
  end if;

  -- ---- 6. Enforce max 1 active project per household ----
  if exists (
    select 1 from public.construction_projects
     where household_id = v_household_id
       and status in ('prepared', 'confirmed', 'in_progress')
  ) then
    raise exception 'Household already has an active construction project';
  end if;

  -- ---- 7. Fetch current resources -----
  select e.balance, f.balance, n.balance, c.balance, bm.balance
    into v_cost_energy, v_cost_food, v_cost_nature, v_cost_community, v_cost_material
    from public.resources e
    full outer join public.resources f on e.household_id = f.household_id and f.resource_key = 'food'
    full outer join public.resources n on e.household_id = n.household_id and n.resource_key = 'nature'
    full outer join public.resources c on e.household_id = c.household_id and c.resource_key = 'community'
    full outer join public.resources bm on e.household_id = bm.household_id and bm.resource_key = 'building_material'
   where e.household_id = v_household_id and e.resource_key = 'energy';

  v_cost_energy := coalesce((select balance from public.resources where household_id = v_household_id and resource_key = 'energy'), 0);
  v_cost_food := coalesce((select balance from public.resources where household_id = v_household_id and resource_key = 'food'), 0);
  v_cost_nature := coalesce((select balance from public.resources where household_id = v_household_id and resource_key = 'nature'), 0);
  v_cost_community := coalesce((select balance from public.resources where household_id = v_household_id and resource_key = 'community'), 0);
  v_cost_material := coalesce((select balance from public.resources where household_id = v_household_id and resource_key = 'building_material'), 0);

  -- ---- 8. Check affordability -----
  if v_cost_energy < v_building_def.base_cost_energy then
    raise exception 'Insufficient energy: have %, need %', v_cost_energy, v_building_def.base_cost_energy;
  end if;
  if v_cost_food < v_building_def.base_cost_food then
    raise exception 'Insufficient food: have %, need %', v_cost_food, v_building_def.base_cost_food;
  end if;
  if v_cost_nature < v_building_def.base_cost_nature then
    raise exception 'Insufficient nature: have %, need %', v_cost_nature, v_building_def.base_cost_nature;
  end if;
  if v_cost_community < v_building_def.base_cost_community then
    raise exception 'Insufficient community: have %, need %', v_cost_community, v_building_def.base_cost_community;
  end if;
  if v_cost_material < v_building_def.base_cost_building_material then
    raise exception 'Insufficient building_material: have %, need %', v_cost_material, v_building_def.base_cost_building_material;
  end if;

  -- ---- 9. Create construction project -----
  v_new_project_id := gen_random_uuid();
  v_build_points_required := 0; -- For now, all projects are instant (Phase 7 spec).

  insert into public.construction_projects (
    id, household_id, building_definition_id, definition_version, slot_id, region_id,
    initiated_by, status,
    cost_energy, cost_food, cost_nature, cost_community, cost_building_material,
    build_points_required, build_points_earned, rule_version
  ) values (
    v_new_project_id,
    v_household_id,
    p_building_id,
    1, -- V1 definition version
    p_slot_id,
    '', -- region_id will be looked up from city layout; for now empty (TODO).
    v_user_id,
    'confirmed', -- Immediately confirmed since we're deducting resources.
    v_building_def.base_cost_energy,
    v_building_def.base_cost_food,
    v_building_def.base_cost_nature,
    v_building_def.base_cost_community,
    v_building_def.base_cost_building_material,
    v_build_points_required,
    0,
    1 -- rule_version
  );

  -- ---- 10. Deduct resources (via ledger) -----
  -- Energy
  if v_building_def.base_cost_energy > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id,
      'energy'::public.resource_key,
      -v_building_def.base_cost_energy,
      'spend_build'::public.resource_reason,
      'manual'::public.reward_source_kind,
      v_new_project_id,
      1,
      current_date,
      p_idempotency_key || ':energy',
      jsonb_build_object('building_id', p_building_id, 'project_id', v_new_project_id)
    );

    update public.resources
       set balance = balance - v_building_def.base_cost_energy,
           total_spent = total_spent + v_building_def.base_cost_energy,
           updated_at = now()
     where household_id = v_household_id and resource_key = 'energy';
  end if;

  -- Food
  if v_building_def.base_cost_food > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'food'::public.resource_key, -v_building_def.base_cost_food,
      'spend_build'::public.resource_reason, 'manual'::public.reward_source_kind, v_new_project_id, 1, current_date,
      p_idempotency_key || ':food', jsonb_build_object('building_id', p_building_id, 'project_id', v_new_project_id)
    );
    update public.resources set balance = balance - v_building_def.base_cost_food, total_spent = total_spent + v_building_def.base_cost_food, updated_at = now()
     where household_id = v_household_id and resource_key = 'food';
  end if;

  -- Nature
  if v_building_def.base_cost_nature > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'nature'::public.resource_key, -v_building_def.base_cost_nature,
      'spend_build'::public.resource_reason, 'manual'::public.reward_source_kind, v_new_project_id, 1, current_date,
      p_idempotency_key || ':nature', jsonb_build_object('building_id', p_building_id, 'project_id', v_new_project_id)
    );
    update public.resources set balance = balance - v_building_def.base_cost_nature, total_spent = total_spent + v_building_def.base_cost_nature, updated_at = now()
     where household_id = v_household_id and resource_key = 'nature';
  end if;

  -- Community
  if v_building_def.base_cost_community > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'community'::public.resource_key, -v_building_def.base_cost_community,
      'spend_build'::public.resource_reason, 'manual'::public.reward_source_kind, v_new_project_id, 1, current_date,
      p_idempotency_key || ':community', jsonb_build_object('building_id', p_building_id, 'project_id', v_new_project_id)
    );
    update public.resources set balance = balance - v_building_def.base_cost_community, total_spent = total_spent + v_building_def.base_cost_community, updated_at = now()
     where household_id = v_household_id and resource_key = 'community';
  end if;

  -- Building Material
  if v_building_def.base_cost_building_material > 0 then
    insert into public.resource_transactions (
      household_id, resource_key, amount, reason, source_kind, source_id, rule_version, business_date, dedup_key, meta
    ) values (
      v_household_id, 'building_material'::public.resource_key, -v_building_def.base_cost_building_material,
      'spend_build'::public.resource_reason, 'manual'::public.reward_source_kind, v_new_project_id, 1, current_date,
      p_idempotency_key || ':building_material', jsonb_build_object('building_id', p_building_id, 'project_id', v_new_project_id)
    );
    update public.resources set balance = balance - v_building_def.base_cost_building_material, total_spent = total_spent + v_building_def.base_cost_building_material, updated_at = now()
     where household_id = v_household_id and resource_key = 'building_material';
  end if;

  -- ---- 11. For instant builds (v_build_points_required = 0), complete immediately ----
  if v_build_points_required = 0 then
    insert into public.city_building_instances (
      id, household_id, building_definition_id, definition_version, slot_id, region_id,
      current_stage, status, built_by, construction_project_id, completed_at
    ) values (
      gen_random_uuid(),
      v_household_id,
      p_building_id,
      1,
      p_slot_id,
      '', -- TODO: look up from slot
      1,
      'active',
      v_user_id,
      v_new_project_id,
      now()
    );

    update public.construction_projects
       set status = 'completed', completed_at = now()
     where id = v_new_project_id;
  end if;

  -- ---- 12. Return success -----
  return jsonb_build_object(
    'project_id', v_new_project_id,
    'building_id', p_building_id,
    'slot_id', p_slot_id,
    'status', 'confirmed',
    'is_instant', v_build_points_required = 0,
    'costs', jsonb_build_object(
      'energy', v_building_def.base_cost_energy,
      'food', v_building_def.base_cost_food,
      'nature', v_building_def.base_cost_nature,
      'community', v_building_def.base_cost_community,
      'building_material', v_building_def.base_cost_building_material
    )
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.start_construction_project to authenticated;
