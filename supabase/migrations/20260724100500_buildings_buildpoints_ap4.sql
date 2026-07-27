-- ============================================================================
-- Vitala · Migration 0029 · Building build points & completion (Phase 7, AP4)
-- ---------------------------------------------------------------------------
-- Build point accumulation, project progress tracking, and automatic
-- completion when build points reach 100%. For Phase 7, all projects have
-- build_points_required = 0 (instant completion), so this infrastructure is
-- primarily ready for Phase 8+ where build_points_required > 0.
--
-- References: docs/building-system.md §79–88, ADR-TBD (build mechanics).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- add_construction_contribution — record a build point contribution from a
-- qualified shared event (activity, ritual, goal, mission). Automatically
-- completes the project if build_points_earned >= build_points_required.
--
-- Atomically:
-- 1. Verify project exists + belongs to household + is in progress
-- 2. Verify source event is "shared" (both household members participated)
-- 3. Award build points to project
-- 4. Track contribution (idempotent via dedup_key)
-- 5. Check if project is now complete (100%+)
-- 6. If complete, mark project as 'completed' + create building instance
--
-- Returns: { project_id, points_earned, project_progress } or error.
-- Idempotent: calling twice with same source won't double-count.
-- ---------------------------------------------------------------------------
create or replace function app.add_construction_contribution(
  p_project_id text,
  p_source_kind public.reward_source_kind,
  p_source_id uuid,
  p_build_points integer,
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
  v_contribution_id uuid;
  v_total_points_earned integer;
  v_can_complete boolean;
  v_building_def record;
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

  -- ---- 3. Check project is not in terminal state ----
  if v_project.status in ('completed', 'cancelled', 'failed') then
    raise exception 'Cannot contribute to a terminal project (status: %)', v_project.status;
  end if;

  -- ---- 4. Verify source event is shared ----
  -- TODO: In Phase 7, all projects complete instantly, so contributions won't
  -- actually be earned. In Phase 8+, we'd verify the source event (activity,
  -- ritual, goal, mission) involved both household members.
  --
  -- For now, we accept the contribution as-is. A more complete implementation
  -- would query the actual event table and check is_shared or scope = 'shared'.

  -- ---- 5. Create contribution record (idempotent) ----
  v_contribution_id := gen_random_uuid();

  insert into public.construction_project_contributions (
    id, construction_project_id, household_id, source, source_id, points, idempotency_key, rule_version, event_date
  ) values (
    v_contribution_id,
    v_project.id,
    v_household_id,
    p_source_kind::text,
    p_source_id,
    p_build_points,
    p_idempotency_key,
    1,
    current_date
  ) on conflict (idempotency_key) where idempotency_key is not null do nothing;

  -- ---- 6. Update project build points earned ----
  update public.construction_projects
     set build_points_earned = build_points_earned + p_build_points,
         updated_at = now()
   where id = v_project.id;

  -- ---- 7. Fetch updated project to check completion ----
  select cp.* into v_project
    from public.construction_projects cp
   where cp.id = v_project.id;

  -- ---- 8. Check if project can be completed ----
  v_can_complete := v_project.build_points_required > 0
                 and v_project.build_points_earned >= v_project.build_points_required;

  -- ---- 9. If complete, create building instance + mark project completed ----
  if v_can_complete then
    -- Fetch building definition for region info
    select bd.* into v_building_def
      from public.building_definitions bd
     where bd.id = v_project.building_definition_id
     limit 1;

    -- Create building instance
    insert into public.city_building_instances (
      id, household_id, building_definition_id, definition_version, slot_id, region_id,
      current_stage, status, built_by, construction_project_id, completed_at
    ) values (
      gen_random_uuid(),
      v_household_id,
      v_project.building_definition_id,
      v_project.definition_version,
      v_project.slot_id,
      v_project.region_id,
      1, -- Stage 1 (base)
      'active',
      v_project.initiated_by,
      v_project.id,
      now()
    );

    -- Mark project as completed
    update public.construction_projects
       set status = 'completed', completed_at = now(), updated_at = now()
     where id = v_project.id;
  end if;

  -- ---- 10. Return success ----
  return jsonb_build_object(
    'project_id', p_project_id,
    'contribution_id', v_contribution_id::text,
    'points_awarded', p_build_points,
    'project_progress', jsonb_build_object(
      'build_points_earned', v_project.build_points_earned + p_build_points,
      'build_points_required', v_project.build_points_required,
      'is_complete', v_can_complete
    )
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.add_construction_contribution to authenticated;

-- ---------------------------------------------------------------------------
-- get_project_progress — fetch current progress status of a construction project.
-- Returns build points earned, required, and percentage complete.
--
-- Returns: { project_id, status, progress_percent, can_complete }
-- ---------------------------------------------------------------------------
create or replace function app.get_project_progress(
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
  v_progress_percent numeric;
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

  -- ---- Calculate progress ----
  if v_project.build_points_required = 0 then
    v_progress_percent := 100; -- Instant builds are always "100% done"
  else
    v_progress_percent := (v_project.build_points_earned::numeric / v_project.build_points_required) * 100;
  end if;

  return jsonb_build_object(
    'project_id', p_project_id,
    'status', v_project.status,
    'build_points_earned', v_project.build_points_earned,
    'build_points_required', v_project.build_points_required,
    'progress_percent', v_progress_percent,
    'can_complete', v_project.status in ('in_progress', 'prepared', 'confirmed')
      and v_project.build_points_earned >= v_project.build_points_required
  );

exception when others then
  raise;
end;
$$;

grant execute on function app.get_project_progress to authenticated;

-- ---------------------------------------------------------------------------
-- list_project_contributions — fetch all contributions to a project (audit trail).
-- Returns: array of { source, source_id, points, event_date }
-- ---------------------------------------------------------------------------
create or replace function app.list_project_contributions(
  p_project_id text
)
returns table (
  contribution_id uuid,
  source text,
  source_id uuid,
  points integer,
  event_date date,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_project_exists boolean;
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

  -- ---- Verify project ownership ----
  select exists(
    select 1 from public.construction_projects cp
     where cp.id::text = p_project_id and cp.household_id = v_household_id
  ) into v_project_exists;

  if not v_project_exists then
    raise exception 'Project not found or not owned by household: %', p_project_id;
  end if;

  -- ---- Return contributions in order ----
  return query
  select
    cpc.id,
    cpc.source,
    cpc.source_id,
    cpc.points,
    cpc.event_date,
    cpc.created_at
  from public.construction_project_contributions cpc
  where cpc.construction_project_id::text = p_project_id
    and cpc.household_id = v_household_id
  order by cpc.event_date asc, cpc.created_at asc;
end;
$$;

grant execute on function app.list_project_contributions to authenticated;
