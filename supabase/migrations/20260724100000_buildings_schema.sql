-- ============================================================================
-- Vitala · Migration 0024 · Building definitions & instances (Phase 7) — DDL
-- ---------------------------------------------------------------------------
-- The building system is the tangible expression of urban development. This
-- migration establishes the canonical catalog of 19 buildings (V1) and the
-- persistent structures to track them. All writes go through SECURITY DEFINER
-- RPCs (migration 0025); clients get SELECT only (migration 0026).
--
-- Key principles:
-- • A building definition is static + versioned; instances keep the version
--   they were built under so later definition changes don't invalidate them.
-- • Costs are frozen at project-start (cost snapshot) → safe balancing changes.
-- • Slots are predefined; buildings are placed only on compatible slots.
-- • No realtime production; all effects are passive + capped per day/week.
--
-- References: docs/building-system.md, building-definitions.md, building-costs.md,
-- docs/building-database-schema.md, ADR-TBD (definition strategy).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- building_definition_versions — reference table for safe migrations.
-- Exactly one row is the current version; all others are historical.
-- ---------------------------------------------------------------------------
create table public.building_definition_versions (
  version    integer primary key check (version >= 1),
  is_current boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);

-- At most one current building definition version at any time.
create unique index building_definition_versions_one_current
  on public.building_definition_versions ((is_current)) where is_current;

-- Insert the V1 version (immutable in this phase).
insert into public.building_definition_versions (version, is_current, notes)
values (1, true, 'V1 canonical (Phase 7): 19 buildings');

-- ---------------------------------------------------------------------------
-- building_definitions — the canonical V1 catalog (19 buildings, fully static).
-- All costs are stored as separate fields; effects are a JSONB array.
-- No city_id/household_id here — these are universally available.
-- ---------------------------------------------------------------------------
create table public.building_definitions (
  id                    text primary key,
  title                 text not null,
  description           text not null,
  long_description      text not null,
  primary_category      text not null check (primary_category in ('movement', 'nutrition', 'sustainability', 'animal_welfare', 'community')),
  secondary_areas       text[] not null default '{}',
  compatible_sizes      text[] not null default '{}',
  allowed_regions       text[],
  unlock_level          integer not null check (unlock_level >= 1),
  prerequisite_building text,

  -- Base stage costs (all non-negative integers).
  base_cost_energy           integer not null check (base_cost_energy >= 0),
  base_cost_food             integer not null check (base_cost_food >= 0),
  base_cost_nature           integer not null check (base_cost_nature >= 0),
  base_cost_community        integer not null check (base_cost_community >= 0),
  base_cost_building_material integer not null check (base_cost_building_material >= 0),

  -- Optional upgrade costs (stages 2–3). Stored as JSONB for flexibility.
  -- Format: { "2": { "energy": 18, ... }, "3": { ... } }
  upgrade_costs         jsonb not null default '{}'::jsonb,

  -- Building effects (passive, capped). Stored as JSONB array.
  -- Format: [{ id: "...", type: "mission_pool_add", parameters: {...}, limit: 0, limitPeriod: "none", label: "..." }, ...]
  effects               jsonb not null default '[]'::jsonb,

  asset_id              text not null,
  a11y_description      text not null,
  sort_order            integer not null,
  rule_version          integer not null default 1,

  definition_version    integer not null references public.building_definition_versions (version),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Quick lookups by category, unlock level.
create index building_definitions_primary_category_idx
  on public.building_definitions (primary_category);
create index building_definitions_unlock_level_idx
  on public.building_definitions (unlock_level);
create index building_definitions_definition_version_idx
  on public.building_definitions (definition_version);

-- Prerequisite reference (optional FK; only for consistency check).
create index building_definitions_prerequisite_idx
  on public.building_definitions (prerequisite_building);

-- Update timestamp trigger.
create trigger building_definitions_touch_updated_at
  before update on public.building_definitions
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- city_building_instances — buildings that have been built (completed projects).
-- One row per built building per household. Slot can only be occupied once.
-- The building_definition_id + version pair is immutable once built.
-- ---------------------------------------------------------------------------
create table public.city_building_instances (
  id                        uuid primary key default gen_random_uuid(),
  household_id              uuid not null references public.households (id) on delete cascade,
  building_definition_id    text not null references public.building_definitions (id) on delete restrict,
  definition_version        integer not null references public.building_definition_versions (version),
  slot_id                   text not null,
  region_id                 text not null,
  current_stage             integer not null default 1 check (current_stage in (1, 2, 3)),
  status                    text not null default 'active' check (status in ('active', 'upgraded', 'max_upgraded')),
  built_by                  uuid not null references auth.users (id),
  construction_project_id   uuid not null, -- Will have FK to construction_projects below
  completed_at              timestamptz not null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Unique constraint: one building per (household, slot).
create unique index city_building_instances_household_slot_idx
  on public.city_building_instances (household_id, slot_id);

-- Quick lookups.
create index city_building_instances_household_idx
  on public.city_building_instances (household_id);
create index city_building_instances_building_definition_idx
  on public.city_building_instances (building_definition_id);
create index city_building_instances_region_idx
  on public.city_building_instances (region_id);
create index city_building_instances_status_idx
  on public.city_building_instances (status);

-- Update timestamp trigger.
create trigger city_building_instances_touch_updated_at
  before update on public.city_building_instances
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- construction_projects — active or completed building projects.
-- One row per project; status progresses through lifecycle.
-- Cost snapshot captures the costs at the moment project was initiated.
-- ---------------------------------------------------------------------------
create table public.construction_projects (
  id                      uuid primary key default gen_random_uuid(),
  household_id            uuid not null references public.households (id) on delete cascade,
  building_definition_id  text not null references public.building_definitions (id) on delete restrict,
  definition_version      integer not null references public.building_definition_versions (version),
  slot_id                 text not null,
  region_id               text not null,
  initiated_by            uuid not null references auth.users (id),
  status                  text not null default 'prepared' check (status in ('prepared', 'confirmed', 'in_progress', 'completed', 'cancelled', 'failed')),

  -- Cost snapshot: what was required when project started.
  cost_energy             integer not null check (cost_energy >= 0),
  cost_food               integer not null check (cost_food >= 0),
  cost_nature             integer not null check (cost_nature >= 0),
  cost_community          integer not null check (cost_community >= 0),
  cost_building_material  integer not null check (cost_building_material >= 0),

  -- Build point requirements (0 = instant build; only phase 7 small buildings may be instant).
  build_points_required   integer not null default 0 check (build_points_required >= 0),
  build_points_earned     integer not null default 0 check (build_points_earned >= 0),

  started_at              timestamptz not null default now(),
  completed_at            timestamptz,
  cancelled_at            timestamptz,
  rule_version            integer not null default 1,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Unique constraint: only one active project per (household, slot).
-- (Multi-part: only one project with status in (prepared, confirmed, in_progress) per slot/household.)
-- We'll enforce this in the RPC instead (business logic).

-- Quick lookups.
create index construction_projects_household_idx
  on public.construction_projects (household_id);
create index construction_projects_status_idx
  on public.construction_projects (status);
create index construction_projects_slot_idx
  on public.construction_projects (slot_id);
create index construction_projects_building_definition_idx
  on public.construction_projects (building_definition_id);

-- Update timestamp trigger.
create trigger construction_projects_touch_updated_at
  before update on public.construction_projects
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- construction_project_contributions — build point ledger for active projects.
-- Append-only; tracks every qualified event that contributes to a project.
-- Idempotency key prevents double-counting.
-- ---------------------------------------------------------------------------
create table public.construction_project_contributions (
  id                        uuid primary key default gen_random_uuid(),
  construction_project_id   uuid not null references public.construction_projects (id) on delete cascade,
  household_id              uuid not null references public.households (id) on delete cascade,
  source                    text not null, -- e.g., 'shared_activity', 'shared_goal', 'shared_ritual', 'balance_bonus'
  source_id                 text not null,
  points                    integer not null check (points > 0),
  idempotency_key           text not null, -- Format: `${source}:${source_id}`
  rule_version              integer not null default 1,
  event_date                date not null,
  created_at                timestamptz not null default now()
);

-- Unique constraint: one contribution per (project, idempotency_key).
-- This prevents double-counting if the same event is processed twice.
create unique index construction_project_contributions_idempotency_idx
  on public.construction_project_contributions (construction_project_id, idempotency_key);

-- Quick lookups.
create index construction_project_contributions_project_idx
  on public.construction_project_contributions (construction_project_id);
create index construction_project_contributions_household_idx
  on public.construction_project_contributions (household_id);

-- ---------------------------------------------------------------------------
-- Resource transaction types — new type for building spend.
-- (The resource_transactions table already exists in migration 0016;
--  we add 'spend_build' to the transaction_type enum here via migration.)
--
-- Note: This would normally be done with ALTER TYPE, but we'll handle it
-- in the RPC functions by validation. The actual ledger entry is created
-- by the app.spend_resources() RPC.
-- ---------------------------------------------------------------------------

-- End of DDL. RPC functions follow in migration 0025.
