-- ============================================================================
-- Vitala · Migration 0004 · Activity & ritual capture (Phase 3)
-- ----------------------------------------------------------------------------
-- Adds the four life-area capture domains: movement (activities) and the
-- generic nutrition/sustainability/animal-welfare rituals (ritual_entries),
-- plus shared-entry participants, favourites and their reference catalogs.
--
-- Model follows the binding Phase-1 decisions:
--   * ADR-0009 / data-model §16.2 — movement kept separate (own duration /
--     intensity fields); nutrition + sustainability + animal_welfare share the
--     generic ritual_definitions / ritual_entries with an `area` discriminator.
--   * ADR-0004 — every entry has exactly ONE primary life area (no multi-count).
--   * data-model §16.9 — soft delete (`deleted_at`) for user-captured entries.
--   * ADR-0019 (new) — shared entries are stored ONCE with a group id + a
--     generic `entry_participants` table (refines data-model's activity_participants).
--   * ADR-0020 (new) — all writes go through SECURITY DEFINER RPCs (atomic,
--     mass-assignment-safe); clients get SELECT only. NO reward/XP logic here.
--
-- References: docs/activity-domain.md, docs/activity-database-schema.md,
-- docs/activity-rls.md, docs/life-areas.md, docs/double-counting-rules.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums (typed columns instead of free-text — data-model §16.8)
-- ---------------------------------------------------------------------------
create type public.life_area as enum
  ('movement', 'nutrition', 'sustainability', 'animal_welfare');

-- Three levels only, per data-model §16.8 (binding). "Regeneration" is a
-- movement *type*, not an intensity — see docs/decisions/0004 & life-areas §4.1.
create type public.activity_intensity as enum ('light', 'medium', 'intense');

-- Only manual sources exist in Phase 3; import/integration reserved for later.
create type public.entry_source as enum ('manual', 'quick_action', 'import');

-- Discriminates which base table a participant / favourite / audit row targets.
create type public.entry_kind as enum ('activity', 'ritual');

-- Daily habit vs. larger one-off action (life-areas §4.3 / §4.4).
create type public.ritual_kind as enum ('daily_block', 'special_action');

-- ---------------------------------------------------------------------------
-- Reference catalog: activity_types (movement). Global, read-only for clients.
-- Stable string `key` is the domain id; labels are display-only & translatable.
-- ---------------------------------------------------------------------------
create table public.activity_types (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  area        public.life_area not null default 'movement' check (area = 'movement'),
  name        text not null,
  category    text not null,
  icon        text,
  sort_order  integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reference catalog: ritual_definitions (nutrition / sustainability / animal).
-- ---------------------------------------------------------------------------
create table public.ritual_definitions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  area        public.life_area not null check (area <> 'movement'),
  kind        public.ritual_kind not null default 'daily_block',
  name        text not null,
  icon        text,
  sort_order  integer not null default 100,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index ritual_definitions_area_idx on public.ritual_definitions (area, sort_order);

-- ---------------------------------------------------------------------------
-- activities (movement). One row per movement entry; shared entries are a
-- single row (creator = user_id) + participant rows keyed by group_id.
-- ---------------------------------------------------------------------------
create table public.activities (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,   -- primary person
  created_by       uuid not null references auth.users (id) on delete cascade,
  activity_type_id uuid not null references public.activity_types (id) on delete restrict,
  occurred_on      date not null,
  started_at_time  time,                          -- optional local wall-clock time
  duration_min     integer not null check (duration_min between 5 and 300),
  intensity        public.activity_intensity,
  location         text check (location is null or char_length(location) <= 120),
  note             text check (note is null or char_length(note) <= 500),
  custom_label     text check (custom_label is null or char_length(custom_label) <= 80),
  is_shared        boolean not null default false,
  group_id         uuid,                          -- links participants of a shared entry
  source           public.entry_source not null default 'manual',
  idempotency_key  uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  constraint activities_shared_has_group check (is_shared = (group_id is not null)),
  constraint activities_date_range check (occurred_on between date '2020-01-01' and date '2100-01-01')
);

create index activities_household_date_idx
  on public.activities (household_id, occurred_on desc)
  where deleted_at is null;
create index activities_user_idx on public.activities (user_id) where deleted_at is null;
create index activities_group_idx on public.activities (group_id) where group_id is not null;
create unique index activities_idempotency_idx
  on public.activities (household_id, idempotency_key)
  where idempotency_key is not null;

create trigger activities_touch_updated_at
  before update on public.activities
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- ritual_entries. A "check-in" is a group of ritual_entries (one per chosen
-- definition) that share entry_group_id, occurred_on, note and participants.
-- Unique(household,user,definition,day) prevents double-abhaken the same fact
-- the same day (life-areas §4.2/§4.3; ADR-0004).
-- ---------------------------------------------------------------------------
create table public.ritual_entries (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references public.households (id) on delete cascade,
  user_id              uuid not null references auth.users (id) on delete cascade,   -- primary person
  created_by           uuid not null references auth.users (id) on delete cascade,
  ritual_definition_id uuid not null references public.ritual_definitions (id) on delete restrict,
  area                 public.life_area not null check (area <> 'movement'),
  occurred_on          date not null,
  note                 text check (note is null or char_length(note) <= 500),
  meal_label           text check (meal_label is null or char_length(meal_label) <= 80),
  custom_label         text check (custom_label is null or char_length(custom_label) <= 80),
  is_shared            boolean not null default false,
  entry_group_id       uuid not null,
  source               public.entry_source not null default 'manual',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  constraint ritual_entries_date_range check (occurred_on between date '2020-01-01' and date '2100-01-01')
);

-- One entry per (user, definition, day) among the LIVE rows (double-count guard).
create unique index ritual_entries_unique_per_day
  on public.ritual_entries (household_id, user_id, ritual_definition_id, occurred_on)
  where deleted_at is null;
create index ritual_entries_household_date_idx
  on public.ritual_entries (household_id, occurred_on desc)
  where deleted_at is null;
create index ritual_entries_group_idx on public.ritual_entries (entry_group_id);
create index ritual_entries_area_idx
  on public.ritual_entries (household_id, area, occurred_on desc)
  where deleted_at is null;

create trigger ritual_entries_touch_updated_at
  before update on public.ritual_entries
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- entry_participants — generic participant set for shared entries (ADR-0019).
-- group_id references activities.group_id OR ritual_entries.entry_group_id,
-- discriminated by entry_kind. At most two participants per group (product cap).
-- ---------------------------------------------------------------------------
create table public.entry_participants (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  entry_kind   public.entry_kind not null,
  group_id     uuid not null,
  user_id      uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint entry_participants_unique unique (entry_kind, group_id, user_id)
);

create index entry_participants_group_idx
  on public.entry_participants (entry_kind, group_id);
create index entry_participants_user_idx
  on public.entry_participants (household_id, user_id);

-- ---------------------------------------------------------------------------
-- entry_favorites — quick actions. Household-scoped, optionally owned by a user.
-- Stores a template payload; executing a favourite pre-fills the capture form.
-- ---------------------------------------------------------------------------
create table public.entry_favorites (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references public.households (id) on delete cascade,
  created_by           uuid not null references auth.users (id) on delete cascade,
  owner_user_id        uuid references auth.users (id) on delete cascade,  -- null = shared
  area                 public.life_area not null,
  label                text not null check (char_length(btrim(label)) between 1 and 80),
  -- Movement template
  activity_type_id     uuid references public.activity_types (id) on delete cascade,
  duration_min         integer check (duration_min is null or duration_min between 5 and 300),
  intensity            public.activity_intensity,
  -- Ritual template (chosen definitions)
  ritual_definition_ids uuid[] not null default '{}',
  is_shared            boolean not null default false,
  sort_order           integer not null default 100,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint favorites_area_shape check (
    (area = 'movement' and activity_type_id is not null)
    or (area <> 'movement' and array_length(ritual_definition_ids, 1) >= 1)
  )
);

create index entry_favorites_household_idx
  on public.entry_favorites (household_id, sort_order);

create trigger entry_favorites_touch_updated_at
  before update on public.entry_favorites
  for each row execute function app.touch_updated_at();
