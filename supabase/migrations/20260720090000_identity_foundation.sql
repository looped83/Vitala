-- ============================================================================
-- Vitala · Migration 0001 · Identity & Household foundation
-- ----------------------------------------------------------------------------
-- Creates the Phase-2 identity tables (households, settings, members, profiles,
-- preferences, invites) plus a minimal audit log, with constraints, indexes and
-- the timestamp trigger. RLS and RPCs follow in later migrations.
--
-- Design references: docs/data-model.md §16.1, docs/household-model.md,
-- docs/security-and-privacy.md §17, ADR-0006.
-- ============================================================================

-- pgcrypto provides gen_random_bytes / digest / crypt (invite code hashing,
-- seeded test passwords). Installed into the dedicated `extensions` schema.
create extension if not exists pgcrypto with schema extensions;

-- Private schema for security-definer helper functions used by RLS policies.
-- NOT exposed via the API (see supabase/config.toml → [api].schemas).
create schema if not exists app;
revoke all on schema app from public;
grant usage on schema app to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Shared enums (typed columns instead of free-text status, data-model §16.8)
-- ---------------------------------------------------------------------------
create type public.household_status as enum ('active', 'archived');
create type public.member_role as enum ('owner', 'member');
create type public.member_status as enum ('active', 'deactivated');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------
create table public.households (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  status       public.household_status not null default 'active',
  -- Hard product cap: a household may never exceed two members (ADR-0006).
  max_members  smallint not null default 2 check (max_members = 2),
  created_by   uuid not null references auth.users (id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger households_touch_updated_at
  before update on public.households
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- household_settings (1:1 with household)
-- ---------------------------------------------------------------------------
create table public.household_settings (
  household_id          uuid primary key references public.households (id) on delete cascade,
  timezone              text not null default 'Europe/Berlin',
  week_start            smallint not null default 1 check (week_start between 0 and 6),
  theme_default         text not null default 'system' check (theme_default in ('system','light','dark')),
  reduced_motion_default boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger household_settings_touch_updated_at
  before update on public.household_settings
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- household_members
-- ---------------------------------------------------------------------------
create table public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.member_role not null default 'member',
  status       public.member_status not null default 'active',
  joined_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- A user appears at most once per household (data-model §16.8).
  constraint household_members_unique unique (household_id, user_id)
);

-- A user can be an ACTIVE member of at most one household (single shared
-- household product). Deactivated rows are excluded so history is preserved.
create unique index household_members_one_active_per_user
  on public.household_members (user_id)
  where status = 'active';

create index household_members_household_idx on public.household_members (household_id);
create index household_members_user_idx on public.household_members (user_id);

create trigger household_members_touch_updated_at
  before update on public.household_members
  for each row execute function app.touch_updated_at();

-- Hard two-active-member cap, enforced in the database (defense in depth on
-- top of the RPC checks). security-and-privacy §17.5, ADR-0006.
create or replace function app.enforce_active_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
  cap integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select count(*) into active_count
  from public.household_members
  where household_id = new.household_id
    and status = 'active'
    and id <> new.id;

  select max_members into cap
  from public.households
  where id = new.household_id;

  if active_count >= coalesce(cap, 2) then
    raise exception 'household_full'
      using hint = 'Ein Household darf höchstens zwei aktive Mitglieder haben.';
  end if;

  return new;
end;
$$;

create trigger household_members_enforce_limit
  before insert or update on public.household_members
  for each row execute function app.enforce_active_member_limit();

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users; id == user id)
-- E-mail lives only in auth.users — never duplicated here (security §18.8).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  accent_color text not null default 'movement'
    check (accent_color in ('movement','nutrition','sustainability','animal_welfare')),
  avatar_motif text check (avatar_motif is null or char_length(avatar_motif) <= 40),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- user_preferences (per-user, device-independent)
-- ---------------------------------------------------------------------------
create table public.user_preferences (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  theme              text not null default 'system' check (theme in ('system','light','dark')),
  reduced_motion     boolean not null default false,
  locale             text not null default 'de' check (locale in ('de')),
  week_start_override smallint check (week_start_override is null or week_start_override between 0 and 6),
  notification_opt_in boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger user_preferences_touch_updated_at
  before update on public.user_preferences
  for each row execute function app.touch_updated_at();

-- ---------------------------------------------------------------------------
-- household_invites (codes stored hashed; plaintext returned once by RPC)
-- ---------------------------------------------------------------------------
create table public.household_invites (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  code_hash    text not null,
  created_by   uuid not null references auth.users (id) on delete cascade,
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  accepted_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint household_invites_code_hash_unique unique (code_hash)
);

create index household_invites_household_idx on public.household_invites (household_id);

-- ---------------------------------------------------------------------------
-- audit_log (critical mutations only: role/household/membership changes)
-- Stores aggregated context, never raw health/behaviour data (security §18.6).
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,
  actor_id     uuid references auth.users (id) on delete set null,
  action       text not null,
  entity       text not null,
  entity_id    uuid,
  meta         jsonb,
  created_at   timestamptz not null default now()
);

create index audit_log_household_idx on public.audit_log (household_id, created_at desc);

-- ---------------------------------------------------------------------------
-- New auth user → create bare profile + preferences rows so the app always
-- finds them. display_name stays empty until onboarding sets it.
-- ---------------------------------------------------------------------------
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
    on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();
