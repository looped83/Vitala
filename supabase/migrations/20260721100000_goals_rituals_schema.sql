-- ============================================================================
-- Vitala · Migration 0009 · Goals, rituals, check-ins & periods (Phase 4)
-- ----------------------------------------------------------------------------
-- Adds the personal + shared day/goal framework on top of the Phase-3 capture
-- domain: goals with typed measurement, materialised goal_periods (history is
-- preserved), a lean ritual system with completions, and strictly private
-- daily check-ins (morning + evening).
--
-- Binding Phase-1 decisions applied here:
--   * missions-and-goals §8 — goals are user-defined, voluntary, server-computed
--     progress, no punishment. NO XP / resources / city logic (spec §Abgrenzung).
--   * ADR-0004 / double-counting — a shared entry is ONE row, so household
--     progress counts it once; personal progress is scoped by participation.
--   * data-model §16.9 — soft delete (`deleted_at`) for user-owned goals/rituals.
--   * game-loop §5.1/§5.5 — morning/evening check-ins are ≤1 min, all optional,
--     no medical interpretation, free text stays private (ADR-0028).
--
-- New ADRs: 0025 (goal progress calc), 0026 (recurring goals & periods),
-- 0027 (ritual instances & completions), 0028 (check-in privacy),
-- 0029 (goal series edits), 0030 (review aggregation),
-- 0031 (archive vs delete).
--
-- References: docs/goals-domain.md, docs/goal-progress-calculation.md,
-- docs/recurring-goals.md, docs/rituals-domain.md, docs/morning-check-in.md,
-- docs/evening-check-in.md, docs/goals-and-rituals-database.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (typed columns instead of free text — data-model §16.8)
-- ---------------------------------------------------------------------------

-- Ownership is shared between goals and rituals: a personal item belongs to one
-- active member; a shared item belongs to the household.
create type public.owner_type as enum ('personal', 'shared');

-- Goal calendar horizon (missions-and-goals §8.2).
create type public.goal_period_type as enum ('day', 'week', 'month', 'quarter', 'custom');

-- Recurrence for the series head (missions-and-goals §8.3). 'none' = one-off.
create type public.goal_recurrence as enum ('none', 'daily', 'weekly', 'monthly', 'quarterly');

-- Exactly one primary measurement per goal (spec §5). Progress is derived
-- server-side from the Phase-3 entries — never trusted from the client.
create type public.goal_measurement as enum (
  'entry_count',       -- number of matching entries (activities or ritual check-ins)
  'duration_minutes',  -- sum of movement duration
  'active_days',       -- distinct local days with a matching entry
  'shared_count',      -- number of shared entries (counted once)
  'distinct_types',    -- number of distinct matching activity types / ritual blocks
  'manual',            -- user-confirmed value (only where not auto-measurable)
  'boolean'            -- done / not done (target = 1)
);

-- Only domain-necessary units (spec §6). Percent is display-only (never stored).
create type public.goal_unit as enum (
  'units', 'minutes', 'days', 'meals', 'actions', 'shared_activities'
);

-- Lifecycle (spec §13). Soft delete is a separate `deleted_at` column.
create type public.goal_status as enum (
  'draft', 'active', 'paused', 'completed', 'expired', 'archived'
);

-- A concrete period's own state (spec §8).
create type public.goal_period_status as enum ('active', 'completed', 'expired');

-- Ritual recurrence (spec §19). 'flexible' = weekday-driven / no fixed cadence.
create type public.ritual_recurrence as enum ('daily', 'weekly', 'monthly', 'flexible');

-- Preferred time of day (spec §19). Never triggers a push notification.
create type public.ritual_time as enum ('morning', 'day', 'evening', 'flexible');

-- Ritual interaction shape (spec §20). Curated, not a free form-builder.
create type public.ritual_type as enum (
  'check', 'choice', 'scale', 'reflection', 'activity_link', 'shared_checkin'
);

create type public.ritual_status as enum ('active', 'paused', 'archived');

-- A ritual instance's outcome (spec §26). "skipped" is never judged negatively.
create type public.ritual_completion_status as enum ('done', 'skipped', 'not_relevant');

create type public.check_in_type as enum ('morning', 'evening');

-- Morning structured choices (spec §21). Neutral, non-medical scales.
create type public.time_budget as enum ('minimal', 'quarter', 'half', 'hour', 'flexible');
create type public.day_intensity as enum ('recovery', 'light', 'balanced', 'active');
create type public.day_focus as enum (
  'movement', 'nutrition', 'sustainability', 'animal_welfare', 'recovery', 'shared', 'none'
);

-- ---------------------------------------------------------------------------
-- goals — the series head / definition. One row per goal (recurring or one-off).
-- Recurring goals spawn goal_periods; a one-off goal has exactly one period.
-- ---------------------------------------------------------------------------
create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  created_by     uuid not null references auth.users (id) on delete restrict,
  owner_type     public.owner_type not null,
  owner_user_id  uuid references auth.users (id) on delete cascade, -- personal only
  title          text not null check (char_length(btrim(title)) between 1 and 80),
  description    text check (description is null or char_length(description) <= 500),
  life_area      public.life_area not null,
  measurement    public.goal_measurement not null,
  target_value   numeric(10, 2) not null check (target_value > 0),
  unit           public.goal_unit not null,
  period_type    public.goal_period_type not null,
  recurrence     public.goal_recurrence not null default 'none',
  -- Optional filters that narrow which entries count (spec §5, "bestimmte Typen").
  activity_type_keys    text[] not null default '{}',
  ritual_definition_keys text[] not null default '{}',
  start_date     date not null,
  end_date       date,                         -- null for open-ended recurring goals
  status         public.goal_status not null default 'active',
  manual_value   numeric(10, 2),               -- manual/boolean measurement progress
  template_key   text,                         -- provenance if created from a template
  pause_reason   text check (pause_reason is null or char_length(pause_reason) <= 200),
  resume_on      date,                         -- optional planned resume date
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz,
  paused_at      timestamptz,
  archived_at    timestamptz,
  deleted_at     timestamptz,

  constraint goals_owner_shape check (
    (owner_type = 'personal' and owner_user_id is not null)
    or (owner_type = 'shared' and owner_user_id is null)
  ),
  -- Unit ↔ measurement bijection for the two strict pairs (spec §38).
  constraint goals_unit_measurement check (
    (measurement = 'duration_minutes') = (unit = 'minutes')
    and (measurement = 'active_days') = (unit = 'days')
  ),
  -- Boolean goals always target exactly 1.
  constraint goals_boolean_target check (measurement <> 'boolean' or target_value = 1),
  -- A one-off goal (recurrence none) needs a bounded custom period unless it is
  -- day/week/month/quarter anchored; a recurring goal must not be 'custom'.
  constraint goals_recurrence_period check (
    (recurrence = 'none')
    or (recurrence = 'daily' and period_type = 'day')
    or (recurrence = 'weekly' and period_type = 'week')
    or (recurrence = 'monthly' and period_type = 'month')
    or (recurrence = 'quarterly' and period_type = 'quarter')
  ),
  constraint goals_date_range check (end_date is null or end_date >= start_date),
  constraint goals_manual_value_sign check (manual_value is null or manual_value >= 0)
);

create index goals_household_status_idx
  on public.goals (household_id, status)
  where deleted_at is null;
create index goals_owner_idx
  on public.goals (household_id, owner_user_id)
  where deleted_at is null;
create index goals_area_idx
  on public.goals (household_id, life_area)
  where deleted_at is null;

create trigger goals_touch_updated_at
  before update on public.goals
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- goal_periods — one concrete evaluation window per goal (spec §7/§8).
-- A one-off goal has exactly one period == [start_date, end_date]. Recurring
-- goals accumulate periods; elapsed periods freeze `final_value` so history is
-- never rewritten (ADR-0026). The active/current period is computed live.
-- ---------------------------------------------------------------------------
create table public.goal_periods (
  id            uuid primary key default gen_random_uuid(),
  goal_id       uuid not null references public.goals (id) on delete cascade,
  household_id  uuid not null references public.households (id) on delete cascade,
  period_index  integer not null,              -- 0-based order within the series
  period_start  date not null,
  period_end    date not null,                 -- inclusive
  target_value  numeric(10, 2) not null check (target_value > 0), -- snapshot at roll
  status        public.goal_period_status not null default 'active',
  final_value   numeric(10, 2),                -- frozen when the period elapses
  completed_at  timestamptz,                   -- when target was first met
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint goal_periods_range check (period_end >= period_start),
  constraint goal_periods_unique unique (goal_id, period_index)
);

create unique index goal_periods_goal_start_idx
  on public.goal_periods (goal_id, period_start);
create index goal_periods_household_idx
  on public.goal_periods (household_id, period_start desc);
create index goal_periods_active_idx
  on public.goal_periods (goal_id)
  where status = 'active';

create trigger goal_periods_touch_updated_at
  before update on public.goal_periods
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- rituals — lean recurring habits / reflections (spec §18/§19). A ritual is
-- neither a goal nor an activity, and produces no points in this phase.
-- ---------------------------------------------------------------------------
create table public.rituals (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  created_by     uuid not null references auth.users (id) on delete restrict,
  owner_type     public.owner_type not null,
  owner_user_id  uuid references auth.users (id) on delete cascade,
  title          text not null check (char_length(btrim(title)) between 1 and 80),
  description    text check (description is null or char_length(description) <= 300),
  life_area      public.life_area,             -- optional colour/category
  ritual_type    public.ritual_type not null default 'check',
  recurrence     public.ritual_recurrence not null default 'daily',
  preferred_time public.ritual_time not null default 'flexible',
  weekdays       smallint[] not null default '{}', -- ISO 0..6 (Sun..Sat); empty = every day
  start_date     date not null,
  end_date       date,
  status         public.ritual_status not null default 'active',
  sort_order     integer not null default 100,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  paused_at      timestamptz,
  archived_at    timestamptz,
  deleted_at     timestamptz,
  constraint rituals_owner_shape check (
    (owner_type = 'personal' and owner_user_id is not null)
    or (owner_type = 'shared' and owner_user_id is null)
  ),
  constraint rituals_date_range check (end_date is null or end_date >= start_date),
  constraint rituals_weekdays_valid check (
    weekdays <@ array[0,1,2,3,4,5,6]::smallint[]
  )
);

create index rituals_household_status_idx
  on public.rituals (household_id, status)
  where deleted_at is null;
create index rituals_owner_idx
  on public.rituals (household_id, owner_user_id)
  where deleted_at is null;

create trigger rituals_touch_updated_at
  before update on public.rituals
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- ritual_completions — one outcome per ritual instance (ritual + local day).
-- Personal rituals: the single owner acts. Shared rituals: either member may
-- complete once for the household; user_id records who did (spec §26/§28).
-- ---------------------------------------------------------------------------
create table public.ritual_completions (
  id            uuid primary key default gen_random_uuid(),
  ritual_id     uuid not null references public.rituals (id) on delete cascade,
  household_id  uuid not null references public.households (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade, -- who completed
  occurred_on   date not null,
  status        public.ritual_completion_status not null default 'done',
  value_num     smallint check (value_num is null or value_num between 0 and 100),
  note          text check (note is null or char_length(note) <= 300),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- At most one completion per ritual instance (spec §26/§38 "kein Doppelabschluss").
  constraint ritual_completions_unique unique (ritual_id, occurred_on)
);

create index ritual_completions_household_date_idx
  on public.ritual_completions (household_id, occurred_on desc);
create index ritual_completions_ritual_idx
  on public.ritual_completions (ritual_id, occurred_on desc);

create trigger ritual_completions_touch_updated_at
  before update on public.ritual_completions
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- daily_check_ins — strictly private morning/evening check-ins (ADR-0028).
-- One base table with typed detail columns (spec §25); no JSONB. Free text is
-- private to the owning user by RLS and never logged (spec §24/§49).
-- ---------------------------------------------------------------------------
create table public.daily_check_ins (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  check_in_type  public.check_in_type not null,
  business_date  date not null,
  timezone       text not null default 'Europe/Berlin',
  -- Morning fields (all optional)
  energy_level   smallint check (energy_level is null or energy_level between 1 and 5),
  available_time public.time_budget,
  intensity      public.day_intensity,
  focus          public.day_focus,
  wish_text      text check (wish_text is null or char_length(wish_text) <= 280),
  -- Evening fields (all optional)
  day_feeling    smallint check (day_feeling is null or day_feeling between 1 and 5),
  positive_moment text check (positive_moment is null or char_length(positive_moment) <= 280),
  reflection_good text check (reflection_good is null or char_length(reflection_good) <= 280),
  reflection_easier text check (reflection_easier is null or char_length(reflection_easier) <= 280),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Exactly one check-in per user, type and local day (spec §22/§24/§38).
  constraint daily_check_ins_unique unique (user_id, check_in_type, business_date)
);

create index daily_check_ins_user_date_idx
  on public.daily_check_ins (user_id, business_date desc);
create index daily_check_ins_household_date_idx
  on public.daily_check_ins (household_id, business_date desc);

create trigger daily_check_ins_touch_updated_at
  before update on public.daily_check_ins
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- goal_templates — curated, versioned reference data (spec §17). Global read,
-- never client-writable. Populated in the reference-data migration.
-- ---------------------------------------------------------------------------
create table public.goal_templates (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  owner_type     public.owner_type not null,
  life_area      public.life_area not null,
  title          text not null,
  description    text,
  measurement    public.goal_measurement not null,
  target_value   numeric(10, 2) not null check (target_value > 0),
  unit           public.goal_unit not null,
  period_type    public.goal_period_type not null,
  recurrence     public.goal_recurrence not null default 'none',
  activity_type_keys     text[] not null default '{}',
  ritual_definition_keys text[] not null default '{}',
  sort_order     integer not null default 100,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  constraint goal_templates_unit_measurement check (
    (measurement = 'duration_minutes') = (unit = 'minutes')
    and (measurement = 'active_days') = (unit = 'days')
  )
);

create index goal_templates_area_idx on public.goal_templates (life_area, sort_order);
