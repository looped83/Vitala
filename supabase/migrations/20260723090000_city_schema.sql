-- ============================================================================
-- Vitala · Migration 0019 · City & world schema (Phase 6) — DDL only
-- ----------------------------------------------------------------------------
-- The household's visual city is *reconstructed* from static, versioned layout
-- definitions (in TypeScript, ADR-0039) plus a small amount of household state
-- kept here. This migration is pure structure: one city per household, a
-- per-user view preference, and a layout-version reference table. All writes go
-- through SECURITY DEFINER RPCs (migration 0020); clients get SELECT only
-- (RLS in migration 0021). No unlock logic lives here — unlocks are DERIVED
-- from the city level (ADR-0041).
--
-- References: docs/city-database-schema.md, docs/city-layout-versioning.md,
-- ADR-0038/0039/0040/0041.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- city_layout_versions — reference table so a city's layout_version is always a
-- valid, known version (FK target). Exactly one row is the current version.
-- ---------------------------------------------------------------------------
create table public.city_layout_versions (
  version    integer primary key check (version >= 1),
  is_current boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);

-- At most one current layout version at any time.
create unique index city_layout_versions_one_current
  on public.city_layout_versions ((is_current)) where is_current;

insert into public.city_layout_versions (version, is_current, notes)
values (1, true, 'Initiales kuratiertes 3x3-Layout (Phase 6)');

-- ---------------------------------------------------------------------------
-- city_states — one row per household (PK == household_id → exactly one city).
-- `name` is plain text, length- and markup-constrained (§21/§69). `highest_
-- level` is the monotone highest reached city level (§14), guarded by a trigger
-- so it can never decrease. The *current* level is derived from the city XP
-- ledger, never stored (single source of truth, ADR-0041).
-- ---------------------------------------------------------------------------
create table public.city_states (
  household_id   uuid primary key references public.households (id) on delete cascade,
  name           text not null default 'Unsere Stadt'
                   check (char_length(btrim(name)) between 2 and 40 and name !~ '[<>]'),
  layout_version integer not null default 1 references public.city_layout_versions (version),
  highest_level  integer not null default 1 check (highest_level >= 1),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger city_states_touch_updated_at
  before update on public.city_states
  for each row execute function app.touch_updated_at();

-- Monotone guard: the highest reached level never falls (§14/§46). Defense in
-- depth on top of the RPCs, which only ever bump it upward.
create or replace function app.city_guard_highest_level()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.highest_level < old.highest_level then
    new.highest_level := old.highest_level;
  end if;
  return new;
end;
$$;

create trigger city_states_guard_highest_level
  before update on public.city_states
  for each row execute function app.city_guard_highest_level();

-- ---------------------------------------------------------------------------
-- city_view_preferences — per-user, minimal, no sensitive data (§30/§68).
-- `view_mode` is the preferred surface; `seen_city_level` is the highest city
-- level the user has acknowledged, so newly-unlocked regions can be surfaced
-- once (§33) without a separate acknowledgement table.
-- ---------------------------------------------------------------------------
create table public.city_view_preferences (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  household_id    uuid not null references public.households (id) on delete cascade,
  view_mode       text not null default 'system' check (view_mode in ('map', 'list', 'system')),
  seen_city_level integer not null default 0 check (seen_city_level >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index city_view_preferences_household_idx
  on public.city_view_preferences (household_id);

create trigger city_view_preferences_touch_updated_at
  before update on public.city_view_preferences
  for each row execute function app.touch_updated_at();
