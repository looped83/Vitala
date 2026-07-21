-- ============================================================================
-- Vitala · Migration 0002 · Row Level Security
-- ----------------------------------------------------------------------------
-- Enables RLS on every household-related table and defines policies. All
-- membership checks go through SECURITY DEFINER helpers in the private `app`
-- schema so policies never recurse into the same table's RLS.
--
-- References: docs/row-level-security.md, docs/security-and-privacy.md §18.2,
-- data-model §16.10, ADR-0006.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Security-definer membership helpers (bypass RLS; safe, fixed search_path).
-- Granted only to authenticated (+ service_role); never to anon.
-- ---------------------------------------------------------------------------
create or replace function app.is_active_member(p_household_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_user_id
      and hm.status = 'active'
  );
$$;

create or replace function app.is_owner(p_household_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_user_id
      and hm.status = 'active'
      and hm.role = 'owner'
  );
$$;

-- Do two users share the same active household?  Used by the profiles read
-- policy so members can see each other's profile (data-model §10.1).
create or replace function app.shares_active_household(p_other uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members me
    join public.household_members other
      on other.household_id = me.household_id
    where me.user_id = p_user_id
      and me.status = 'active'
      and other.user_id = p_other
      and other.status = 'active'
  );
$$;

create or replace function app.active_member_count(p_household_id uuid)
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.household_members hm
  where hm.household_id = p_household_id
    and hm.status = 'active';
$$;

revoke all on function app.is_active_member(uuid, uuid) from public;
revoke all on function app.is_owner(uuid, uuid) from public;
revoke all on function app.shares_active_household(uuid, uuid) from public;
revoke all on function app.active_member_count(uuid) from public;
grant execute on function app.is_active_member(uuid, uuid) to authenticated, service_role;
grant execute on function app.is_owner(uuid, uuid) to authenticated, service_role;
grant execute on function app.shares_active_household(uuid, uuid) to authenticated, service_role;
grant execute on function app.active_member_count(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Base privileges. RLS is the real gate (deny-by-default) — these GRANTs only
-- decide which *statements* a client role may attempt. Write-restricted tables
-- (members, invites, audit_log) get SELECT only; all writes go through the
-- security-definer RPCs. Explicit here so behaviour is identical on any
-- Postgres, not only where Supabase's implicit grants are present.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
grant select, update on public.households to authenticated;
grant delete on public.households to authenticated; -- owner-only via RLS
grant select, update on public.household_settings to authenticated;
grant select on public.household_members to authenticated;
grant select on public.household_invites to authenticated;
grant select on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere (deny-by-default; no policy == no access).
-- ---------------------------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_settings enable row level security;
alter table public.household_members enable row level security;
alter table public.profiles          enable row level security;
alter table public.user_preferences  enable row level security;
alter table public.household_invites enable row level security;
alter table public.audit_log         enable row level security;

-- ---------------------------------------------------------------------------
-- households: members read; members may rename; owner may delete.
-- INSERT only via create_household RPC (security definer) — no client policy.
-- ---------------------------------------------------------------------------
create policy households_select on public.households
  for select to authenticated
  using (app.is_active_member(id));

create policy households_update on public.households
  for update to authenticated
  using (app.is_active_member(id))
  with check (app.is_active_member(id));

create policy households_delete on public.households
  for delete to authenticated
  using (app.is_owner(id));

-- ---------------------------------------------------------------------------
-- household_settings: members read + update (non-critical prefs).
-- ---------------------------------------------------------------------------
create policy household_settings_select on public.household_settings
  for select to authenticated
  using (app.is_active_member(household_id));

create policy household_settings_update on public.household_settings
  for update to authenticated
  using (app.is_active_member(household_id))
  with check (app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- household_members: members read the roster. NO client writes — membership is
-- mutated only through security-definer RPCs (security §17.5).
-- ---------------------------------------------------------------------------
create policy household_members_select on public.household_members
  for select to authenticated
  using (app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- profiles: read own + same-household member; update own only.
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or app.shares_active_household(id));

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- user_preferences: strictly private to the owning user.
-- ---------------------------------------------------------------------------
create policy user_preferences_select on public.user_preferences
  for select to authenticated
  using (user_id = auth.uid());

create policy user_preferences_insert on public.user_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

create policy user_preferences_update on public.user_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- household_invites: members may read their household's invites (to see status).
-- Creation/acceptance only via RPC — no client insert/update policy.
-- code_hash is never useful to a client; the plaintext is shown once by the RPC.
-- ---------------------------------------------------------------------------
create policy household_invites_select on public.household_invites
  for select to authenticated
  using (app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- audit_log: members may read their household's audit trail; writes via RPC.
-- ---------------------------------------------------------------------------
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (household_id is not null and app.is_active_member(household_id));
