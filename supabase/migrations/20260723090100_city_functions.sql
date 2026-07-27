-- ============================================================================
-- Vitala · Migration 0020 · City & world server functions (Phase 6)
-- ----------------------------------------------------------------------------
-- All city writes flow through SECURITY DEFINER RPCs with a fixed empty
-- search_path (§48/§69). Every function uses auth.uid(), verifies household
-- membership via app.current_household, never trusts a client-passed household
-- id, and is idempotent. Unlocks are DERIVED from the city level; no RPC lets a
-- client set the level, the highest level, an unlock or a slot status (§14/§47).
--
-- References: docs/city-migration.md, docs/city-rls.md, ADR-0041.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Derivation helpers (private app schema; bypass RLS with fixed search_path).
-- ---------------------------------------------------------------------------

-- Current layout version (the single row flagged is_current).
create or replace function app.city_layout_current()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select version from public.city_layout_versions where is_current limit 1;
$$;

-- Total city XP for a household (0 when none).
create or replace function app.city_total_xp(p_hh uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.experience_transactions
  where household_id = p_hh and scope = 'city';
$$;

-- Current city level derived from the XP ledger + level_definitions (ADR-0041).
-- Level never falls because XP never falls; identical formula to the client.
create or replace function app.city_current_level(p_hh uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(max(ld.level), 1)
  from public.level_definitions ld
  where ld.scope = 'city'
    and ld.cumulative_xp <= app.city_total_xp(p_hh);
$$;

-- Idempotent: ensure a household has a city row and bump the highest reached
-- level up to the current level (never down — the trigger also guards this).
create or replace function app.city_ensure(p_hh uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_level integer := app.city_current_level(p_hh);
begin
  insert into public.city_states (household_id, layout_version, highest_level)
  values (p_hh, app.city_layout_current(), v_level)
  on conflict (household_id) do nothing;

  update public.city_states
    set highest_level = greatest(highest_level, v_level)
    where household_id = p_hh and highest_level < v_level;
end;
$$;

revoke all on function app.city_layout_current() from public;
revoke all on function app.city_total_xp(uuid) from public;
revoke all on function app.city_current_level(uuid) from public;
revoke all on function app.city_ensure(uuid) from public;
grant execute on function app.city_layout_current() to authenticated, service_role;
grant execute on function app.city_total_xp(uuid) to authenticated, service_role;
grant execute on function app.city_current_level(uuid) to authenticated, service_role;
grant execute on function app.city_ensure(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- public.city_overview — the single authoritative read. Initialises the city on
-- first access (§48), bumps the highest level, ensures a preference row, and
-- returns the household city state + the caller's view preference.
-- ---------------------------------------------------------------------------
create or replace function public.city_overview()
returns table (
  household_id    uuid,
  name            text,
  layout_version  integer,
  current_level   integer,
  highest_level   integer,
  city_xp         bigint,
  next_level_xp   bigint,
  view_mode       text,
  seen_city_level integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
  v_level integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  perform app.city_ensure(v_hh);

  insert into public.city_view_preferences (user_id, household_id)
  values (v_uid, v_hh)
  on conflict (user_id) do nothing;

  v_level := app.city_current_level(v_hh);

  return query
  select
    cs.household_id,
    cs.name,
    cs.layout_version,
    v_level,
    cs.highest_level,
    app.city_total_xp(v_hh),
    (select ld.cumulative_xp
       from public.level_definitions ld
      where ld.scope = 'city' and ld.level = v_level + 1),
    vp.view_mode,
    vp.seen_city_level
  from public.city_states cs
  join public.city_view_preferences vp on vp.user_id = v_uid
  where cs.household_id = v_hh;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.rename_city — validate + set the city name. Any active member may
-- rename; it touches only `name`, never ids or relationships (§21).
-- ---------------------------------------------------------------------------
create or replace function public.rename_city(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
  v_clean text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  v_clean := btrim(coalesce(p_name, ''));
  if char_length(v_clean) < 2 or char_length(v_clean) > 40 then
    raise exception 'invalid_city_name'
      using hint = 'Der Stadtname braucht 2 bis 40 Zeichen.';
  end if;
  if v_clean ~ '[<>]' then
    raise exception 'invalid_city_name'
      using hint = 'Der Stadtname darf keine spitzen Klammern enthalten.';
  end if;

  perform app.city_ensure(v_hh);
  update public.city_states set name = v_clean where household_id = v_hh;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.set_city_view_mode — persist the caller's preferred surface (§30).
-- ---------------------------------------------------------------------------
create or replace function public.set_city_view_mode(p_mode text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  if p_mode not in ('map', 'list', 'system') then
    raise exception 'invalid_view_mode';
  end if;

  insert into public.city_view_preferences (user_id, household_id, view_mode)
  values (v_uid, v_hh, p_mode)
  on conflict (user_id)
  do update set view_mode = excluded.view_mode, household_id = excluded.household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.acknowledge_city_level — mark the current city level as seen, so the
-- calm unlock banner does not reappear (§33). Monotone (never lowers seen).
-- ---------------------------------------------------------------------------
create or replace function public.acknowledge_city_level()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
  v_level integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;
  v_level := app.city_current_level(v_hh);

  insert into public.city_view_preferences (user_id, household_id, seen_city_level)
  values (v_uid, v_hh, v_level)
  on conflict (user_id)
  do update set
    seen_city_level = greatest(public.city_view_preferences.seen_city_level, excluded.seen_city_level),
    household_id = excluded.household_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- public.repair_city — safe reconciliation for support/diagnostics (§67).
-- Re-derives the city state from the level; changes NO XP and NO resources.
-- Idempotent; returns the fresh overview.
-- ---------------------------------------------------------------------------
create or replace function public.repair_city()
returns table (
  household_id    uuid,
  name            text,
  layout_version  integer,
  current_level   integer,
  highest_level   integer,
  city_xp         bigint,
  next_level_xp   bigint,
  view_mode       text,
  seen_city_level integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hh  uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  v_hh := app.current_household(v_uid);
  if v_hh is null then raise exception 'not_in_household'; end if;

  perform app.city_ensure(v_hh);
  -- Re-align to a valid layout version if it drifted.
  update public.city_states
    set layout_version = app.city_layout_current()
    where household_id = v_hh
      and layout_version not in (select version from public.city_layout_versions);

  return query select * from public.city_overview();
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: authenticated only; never anon. Writes are RPC-only (RLS blocks
-- direct table writes, migration 0021).
-- ---------------------------------------------------------------------------
revoke all on function public.city_overview() from public;
revoke all on function public.rename_city(text) from public;
revoke all on function public.set_city_view_mode(text) from public;
revoke all on function public.acknowledge_city_level() from public;
revoke all on function public.repair_city() from public;
grant execute on function public.city_overview() to authenticated;
grant execute on function public.rename_city(text) to authenticated;
grant execute on function public.set_city_view_mode(text) to authenticated;
grant execute on function public.acknowledge_city_level() to authenticated;
grant execute on function public.repair_city() to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: initialise a city for every existing household (§50). Idempotent;
-- adjusts NO XP and NO resources. New households get their city lazily on first
-- city_overview() call and via the auth trigger is unnecessary (household comes
-- first). Runs as the migration role, bypassing RLS on purpose.
-- ---------------------------------------------------------------------------
insert into public.city_states (household_id, layout_version, highest_level)
select h.id, app.city_layout_current(), app.city_current_level(h.id)
from public.households h
on conflict (household_id) do nothing;
