-- ============================================================================
-- Vitala · pgTAP tests · City & world (Phase 6)
-- ----------------------------------------------------------------------------
-- Verifies the server-authoritative city: idempotent init, name validation +
-- XSS guard, view/ack preferences, level derivation from the city XP ledger,
-- the monotone highest-level guard (unlocks never fall), one-city-per-household,
-- RLS household isolation and RPC-only writes. Runs via `supabase test db`
-- inside a rolled-back transaction. Test UUIDs never collide with the seed.
-- ============================================================================

begin;
select plan(19);

-- --- Fixtures (superuser; RLS bypassed) ------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('c1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','city-u1@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('c1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','city-u2@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('c1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','city-u3@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('c1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','city-u4@vitala.test','x',now(),now(),now(),'{}','{}');
insert into public.households (id, name, created_by) values
  ('c1000000-0000-0000-0000-0000000000aa','Stadt-Haushalt A','c1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-0000000000bb','Stadt-Haushalt B','c1000000-0000-0000-0000-000000000003');
insert into public.household_settings (household_id) values
  ('c1000000-0000-0000-0000-0000000000aa'),('c1000000-0000-0000-0000-0000000000bb');
insert into public.household_members (household_id, user_id, role, status) values
  ('c1000000-0000-0000-0000-0000000000aa','c1000000-0000-0000-0000-000000000001','owner','active'),
  ('c1000000-0000-0000-0000-0000000000aa','c1000000-0000-0000-0000-000000000002','member','active'),
  ('c1000000-0000-0000-0000-0000000000bb','c1000000-0000-0000-0000-000000000003','owner','active'),
  ('c1000000-0000-0000-0000-0000000000bb','c1000000-0000-0000-0000-000000000004','member','deactivated');

create or replace function public._login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role','authenticated')::text, true);
end $$;

set local role authenticated;
select public._login('c1000000-0000-0000-0000-000000000001');

-- ===========================================================================
-- Initialisation + defaults
-- ===========================================================================
select is(
  (select name from public.city_overview()),
  'Unsere Stadt', 'city_overview initialises a city with the default name');

select is(
  (select current_level from public.city_overview()),
  1, 'a fresh city starts at level 1');

select is(
  (select count(*)::int from public.city_states
   where household_id='c1000000-0000-0000-0000-0000000000aa'),
  1, 'exactly one city row per household after init');

-- Idempotent: a second call does not create a second row.
select public.city_overview();
select is(
  (select count(*)::int from public.city_states
   where household_id='c1000000-0000-0000-0000-0000000000aa'),
  1, 'city_overview is idempotent (still one row)');

-- ===========================================================================
-- Name validation + XSS guard
-- ===========================================================================
select lives_ok(
  $$ select public.rename_city('Grünhausen') $$,
  'rename_city accepts a valid name');
select is(
  (select name from public.city_states where household_id='c1000000-0000-0000-0000-0000000000aa'),
  'Grünhausen', 'rename_city persists the new name');
select throws_ok(
  $$ select public.rename_city('<script>') $$,
  null, 'invalid_city_name', 'rename_city rejects markup (XSS guard)');
select throws_ok(
  $$ select public.rename_city('a') $$,
  null, 'invalid_city_name', 'rename_city rejects too-short names');

-- ===========================================================================
-- View preference + acknowledgement
-- ===========================================================================
select lives_ok(
  $$ select public.set_city_view_mode('list') $$, 'set_city_view_mode accepts list');
select is(
  (select view_mode from public.city_view_preferences where user_id='c1000000-0000-0000-0000-000000000001'),
  'list', 'view mode is persisted per user');
select throws_ok(
  $$ select public.set_city_view_mode('bogus') $$,
  null, 'invalid_view_mode', 'set_city_view_mode rejects unknown modes');

-- ===========================================================================
-- Level derivation + monotone highest level (unlocks never fall, §14)
-- ===========================================================================
set local role postgres;
insert into public.experience_transactions(household_id,scope,amount,reason,source_kind,rule_version,business_date)
  values ('c1000000-0000-0000-0000-0000000000aa','city',900,'mission','mission',1,current_date);
set local role authenticated;
select public._login('c1000000-0000-0000-0000-000000000001');

select is(
  (select current_level from public.city_overview()),
  3, '900 city XP derives to city level 3');
select is(
  (select highest_level from public.city_states where household_id='c1000000-0000-0000-0000-0000000000aa'),
  3, 'highest_level is bumped to the current level');

-- Remove the XP: current would fall, but highest_level must not.
set local role postgres;
delete from public.experience_transactions
  where household_id='c1000000-0000-0000-0000-0000000000aa' and amount=900;
set local role authenticated;
select public._login('c1000000-0000-0000-0000-000000000001');
select is(
  (select highest_level from public.city_overview()),
  3, 'highest_level never falls even if XP is removed');

-- The guard trigger also blocks a direct lowering.
set local role postgres;
update public.city_states set highest_level=1 where household_id='c1000000-0000-0000-0000-0000000000aa';
select is(
  (select highest_level from public.city_states where household_id='c1000000-0000-0000-0000-0000000000aa'),
  3, 'the highest-level trigger blocks a direct lowering');
set local role authenticated;
select public._login('c1000000-0000-0000-0000-000000000001');

-- ===========================================================================
-- RLS isolation + RPC-only writes
-- ===========================================================================
-- Member of household B cannot see household A's city.
select public._login('c1000000-0000-0000-0000-000000000003');
select is(
  (select count(*)::int from public.city_states
   where household_id='c1000000-0000-0000-0000-0000000000aa'),
  0, 'a foreign household cannot read another city');

-- A direct client write is denied (no write grant / no policy).
select throws_ok(
  $$ update public.city_states set highest_level=99
     where household_id='c1000000-0000-0000-0000-0000000000bb' $$,
  '42501', null, 'direct client writes to city_states are denied');

-- A member sees only their own view preference.
select public._login('c1000000-0000-0000-0000-000000000001');
select is(
  (select count(*)::int from public.city_view_preferences
   where user_id <> 'c1000000-0000-0000-0000-000000000001'),
  0, 'a member cannot read another user''s view preference');

-- A deactivated member has no household and cannot open the city.
select public._login('c1000000-0000-0000-0000-000000000004');
select throws_ok(
  $$ select public.city_overview() $$,
  null, 'not_in_household', 'a deactivated member cannot open the city');

select * from finish();
rollback;
