-- ============================================================================
-- Vitala · Migration 0027 · Building RLS policies (Phase 7)
-- ---------------------------------------------------------------------------
-- Row-level security for all building-related tables. Clients get SELECT
-- on reference data + household-scoped data; all writes go through RPCs.
-- ============================================================================

-- ---- building_definitions — public reference data ----
alter table public.building_definitions enable row level security;

create policy building_definitions_public_read on public.building_definitions
  for select using (true);

-- Prevent any direct writes (only migrations populate this table).
create policy building_definitions_no_write on public.building_definitions
  for all with check (false);

-- ---- building_definition_versions — public reference data ----
alter table public.building_definition_versions enable row level security;

create policy building_definition_versions_public_read on public.building_definition_versions
  for select using (true);

create policy building_definition_versions_no_write on public.building_definition_versions
  for all with check (false);

-- ---- city_building_instances — household-scoped ----
alter table public.city_building_instances enable row level security;

create policy city_building_instances_household_read on public.city_building_instances
  for select using (
    household_id in (
      select household_id from public.household_members
       where user_id = auth.uid() and is_active = true
    )
  );

-- No direct inserts (only via RPC).
create policy city_building_instances_no_direct_write on public.city_building_instances
  for all with check (false);

-- ---- construction_projects — household-scoped ----
alter table public.construction_projects enable row level security;

create policy construction_projects_household_read on public.construction_projects
  for select using (
    household_id in (
      select household_id from public.household_members
       where user_id = auth.uid() and is_active = true
    )
  );

-- No direct writes (only via RPC).
create policy construction_projects_no_direct_write on public.construction_projects
  for all with check (false);

-- ---- construction_project_contributions — household-scoped ----
alter table public.construction_project_contributions enable row level security;

create policy construction_project_contributions_household_read on public.construction_project_contributions
  for select using (
    household_id in (
      select household_id from public.household_members
       where user_id = auth.uid() and is_active = true
    )
  );

-- No direct writes.
create policy construction_project_contributions_no_direct_write on public.construction_project_contributions
  for all with check (false);
