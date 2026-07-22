-- ============================================================================
-- Vitala · Migration 0014 · Reward system schema (Phase 5) — DDL only
-- ----------------------------------------------------------------------------
-- The append-only economy behind XP, resources, levels, missions and balance.
-- Ledgers are the single source of truth (ADR-0032); balances are a cached
-- projection kept consistent inside the same RPC that writes the ledger.
-- All reward writes go through SECURITY DEFINER RPCs (ADR-0005/0020); clients
-- get SELECT only (RLS in migration 0017). NO reward logic lives here — this
-- migration is pure structure.
--
-- References: docs/reward-database-schema.md, docs/reward-ledger.md,
-- data-model §16.3/§16.4, ADR-0002/0003/0032/0033/0035/0037.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (typed columns instead of free text — data-model §16.8).
-- Reuses public.owner_type (personal|shared) and public.life_area from earlier
-- phases for mission scope + area.
-- ---------------------------------------------------------------------------
create type public.xp_scope as enum ('personal', 'city');

create type public.xp_reason as enum
  ('activity', 'ritual', 'checkin', 'goal', 'mission', 'balance_bonus', 'week_bonus', 'correction');

create type public.resource_key as enum
  ('energy', 'food', 'nature', 'community', 'building_material');

create type public.resource_reason as enum
  ('grant', 'balance_bonus', 'week_material', 'mission', 'goal', 'refund', 'spend_build', 'correction');

-- What produced a reward (used for dedup keys + the transaction history).
create type public.reward_source_kind as enum
  ('activity', 'ritual_checkin', 'ritual_completion', 'checkin', 'goal_period',
   'mission', 'balance', 'backfill', 'manual');

create type public.mission_period as enum ('day', 'week');
create type public.mission_status as enum ('offered', 'active', 'completed', 'skipped', 'expired');
create type public.mission_measurement as enum
  ('activity_count', 'duration_minutes', 'active_days', 'ritual_count', 'shared_count', 'distinct_areas');
create type public.mission_difficulty as enum ('leicht', 'normal', 'gemeinschaftlich');

-- ---------------------------------------------------------------------------
-- activity_types: add reward weight + regeneration flag so the server owns the
-- movement XP factors (resources-and-xp §2). Weights seeded in migration 0015.
-- ---------------------------------------------------------------------------
alter table public.activity_types
  add column reward_weight numeric(4, 2) not null default 1.00
    check (reward_weight between 0.50 and 2.00),
  add column is_regeneration boolean not null default false;

-- ---------------------------------------------------------------------------
-- reward_rule_versions — a past ledger row keeps the version it was written
-- with; a new version never rewrites history (§16, ADR-0033). Reference data.
-- ---------------------------------------------------------------------------
create table public.reward_rule_versions (
  version     integer primary key check (version >= 1),
  is_active   boolean not null default true,
  valid_from  date not null,
  description text,
  params      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- level_definitions — generated from the ADR-0003 formulas (migration 0015).
-- Reference data: personal + city thresholds and titles. Never client-written.
-- ---------------------------------------------------------------------------
create table public.level_definitions (
  scope         public.xp_scope not null,
  level         integer not null check (level >= 1),
  cumulative_xp bigint not null check (cumulative_xp >= 0),
  title         text not null,
  primary key (scope, level),
  unique (scope, cumulative_xp)
);

-- ---------------------------------------------------------------------------
-- experience_transactions — append-only XP ledger (data-model §16.3). Personal
-- rows carry user_id; city rows do not. `area` + `is_special` enable per-area
-- daily caps. `dedup_key` blocks double grants (§15); corrections have no dedup
-- key (an edit may legitimately correct many times) and reference the origin
-- via `correction_of`.
-- ---------------------------------------------------------------------------
create table public.experience_transactions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete cascade,
  scope         public.xp_scope not null,
  amount        integer not null,
  reason        public.xp_reason not null,
  area          public.life_area,
  is_special    boolean not null default false,
  source_kind   public.reward_source_kind not null,
  source_id     uuid,
  rule_version  integer not null references public.reward_rule_versions (version),
  correction_of uuid references public.experience_transactions (id),
  business_date date not null,
  dedup_key     text,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  constraint xp_personal_has_user check (
    (scope = 'personal' and user_id is not null)
    or (scope = 'city' and user_id is null)
  )
);

create unique index experience_transactions_dedup_idx
  on public.experience_transactions (dedup_key) where dedup_key is not null;
create index experience_transactions_hh_scope_idx
  on public.experience_transactions (household_id, scope);
create index experience_transactions_user_idx
  on public.experience_transactions (user_id, scope) where user_id is not null;
create index experience_transactions_hh_date_idx
  on public.experience_transactions (household_id, business_date);
create index experience_transactions_source_idx
  on public.experience_transactions (source_kind, source_id);
create index experience_transactions_area_day_idx
  on public.experience_transactions (user_id, area, business_date)
  where scope = 'personal' and reason in ('activity', 'ritual');

-- ---------------------------------------------------------------------------
-- resources — cached per-household balances (a projection of the ledger).
-- resource_transactions — the append-only truth (data-model §16.3, ADR-0032).
-- ---------------------------------------------------------------------------
create table public.resources (
  household_id uuid not null references public.households (id) on delete cascade,
  resource_key public.resource_key not null,
  balance      integer not null default 0 check (balance >= 0),
  total_earned bigint not null default 0 check (total_earned >= 0),
  total_spent  bigint not null default 0 check (total_spent >= 0),
  updated_at   timestamptz not null default now(),
  primary key (household_id, resource_key)
);

create table public.resource_transactions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households (id) on delete cascade,
  resource_key  public.resource_key not null,
  amount        integer not null,
  reason        public.resource_reason not null,
  source_kind   public.reward_source_kind not null,
  source_id     uuid,
  rule_version  integer not null references public.reward_rule_versions (version),
  correction_of uuid references public.resource_transactions (id),
  created_by    uuid references auth.users (id) on delete set null,
  business_date date not null,
  dedup_key     text,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create unique index resource_transactions_dedup_idx
  on public.resource_transactions (dedup_key) where dedup_key is not null;
create index resource_transactions_hh_key_idx
  on public.resource_transactions (household_id, resource_key, created_at desc);
create index resource_transactions_source_idx
  on public.resource_transactions (source_kind, source_id);

-- ---------------------------------------------------------------------------
-- mission_definitions — curated template pool (reference data, §27). Rewards
-- are stored explicitly so a definition fully explains its own payout.
-- ---------------------------------------------------------------------------
create table public.mission_definitions (
  id                     uuid primary key default gen_random_uuid(),
  key                    text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  title                  text not null,
  description            text not null,
  area                   public.life_area,
  scope                  public.owner_type not null,
  period                 public.mission_period not null,
  measurement            public.mission_measurement not null,
  target_value           integer not null check (target_value > 0),
  difficulty             public.mission_difficulty not null default 'normal',
  activity_type_keys     text[] not null default '{}',
  ritual_definition_keys text[] not null default '{}',
  min_minutes            integer check (min_minutes is null or min_minutes >= 0),
  demanding              boolean not null default false,
  personal_xp            integer not null default 0 check (personal_xp >= 0),
  city_xp                integer not null default 0 check (city_xp >= 0),
  reward_resource        public.resource_key,
  reward_resource_amount integer not null default 0 check (reward_resource_amount >= 0),
  reward_community       integer not null default 0 check (reward_community >= 0),
  is_active              boolean not null default true,
  rule_version           integer not null default 1 references public.reward_rule_versions (version),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index mission_definitions_pool_idx
  on public.mission_definitions (scope, period, is_active);

-- ---------------------------------------------------------------------------
-- mission_assignments — a mission offered/active for a user or the household in
-- a period. At most one active personal + one active shared mission per period
-- (partial unique indexes = the "max one" constraints, §45).
-- ---------------------------------------------------------------------------
create table public.mission_assignments (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references public.households (id) on delete cascade,
  user_id               uuid references auth.users (id) on delete cascade,
  mission_definition_id uuid not null references public.mission_definitions (id) on delete restrict,
  scope                 public.owner_type not null,
  period                public.mission_period not null,
  period_start          date not null,
  period_end            date not null,
  status                public.mission_status not null default 'active',
  swaps_used            integer not null default 0 check (swaps_used >= 0),
  assigned_at           timestamptz not null default now(),
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint mission_scope_user check (
    (scope = 'personal' and user_id is not null)
    or (scope = 'shared' and user_id is null)
  )
);

-- One live personal mission per (user, period, period_start); one live shared
-- mission per (household, period, period_start). "Live" = offered or active.
create unique index mission_one_personal_live_idx
  on public.mission_assignments (user_id, period, period_start)
  where scope = 'personal' and status in ('offered', 'active');
create unique index mission_one_shared_live_idx
  on public.mission_assignments (household_id, period, period_start)
  where scope = 'shared' and status in ('offered', 'active');
create index mission_assignments_lookup_idx
  on public.mission_assignments (household_id, period, period_start, status);
create index mission_assignments_user_idx
  on public.mission_assignments (user_id, period_start) where user_id is not null;

-- ---------------------------------------------------------------------------
-- mission_completions — one terminal completion per assignment (§33). Reward is
-- granted exactly once; the ledger dedup keys guard the actual XP/resources.
-- ---------------------------------------------------------------------------
create table public.mission_completions (
  id                    uuid primary key default gen_random_uuid(),
  mission_assignment_id uuid not null unique references public.mission_assignments (id) on delete cascade,
  household_id          uuid not null references public.households (id) on delete cascade,
  completed_at          timestamptz not null default now(),
  progress_value        numeric not null default 0,
  reward_granted        boolean not null default true
);

-- ---------------------------------------------------------------------------
-- mission_exchanges — audit of swaps for repetition avoidance (§30).
-- ---------------------------------------------------------------------------
create table public.mission_exchanges (
  id                 uuid primary key default gen_random_uuid(),
  household_id       uuid not null references public.households (id) on delete cascade,
  user_id            uuid references auth.users (id) on delete cascade,
  scope              public.owner_type not null,
  period             public.mission_period not null,
  period_start       date not null,
  from_definition_id uuid references public.mission_definitions (id),
  to_definition_id   uuid references public.mission_definitions (id),
  created_at         timestamptz not null default now()
);

create index mission_exchanges_lookup_idx
  on public.mission_exchanges (household_id, period_start);

-- ---------------------------------------------------------------------------
-- weekly_balance_snapshots — one row per household + week; the balance bonus is
-- granted at most once (bonus_granted flag + unique index, §37).
-- ---------------------------------------------------------------------------
create table public.weekly_balance_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references public.households (id) on delete cascade,
  week_start            date not null,
  week_end              date not null,
  movement_count        integer not null default 0,
  nutrition_count       integer not null default 0,
  sustainability_count  integer not null default 0,
  animal_welfare_count  integer not null default 0,
  active_areas          integer not null default 0,
  stage                 integer not null default 0,
  both_contributed      boolean not null default false,
  bonus_granted         boolean not null default false,
  computed_at           timestamptz not null default now(),
  unique (household_id, week_start)
);

-- ---------------------------------------------------------------------------
-- reward_processing_log — lightweight audit for the historical backfill (§67).
-- ---------------------------------------------------------------------------
create table public.reward_processing_log (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,
  kind         text not null,
  source_id    uuid,
  detail       jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse app.touch_updated_at from Phase 2).
-- ---------------------------------------------------------------------------
create trigger resources_touch_updated_at
  before update on public.resources
  for each row execute function app.touch_updated_at();
create trigger mission_definitions_touch_updated_at
  before update on public.mission_definitions
  for each row execute function app.touch_updated_at();
create trigger mission_assignments_touch_updated_at
  before update on public.mission_assignments
  for each row execute function app.touch_updated_at();
