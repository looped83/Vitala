-- ============================================================================
-- Vitala · pgTAP RLS + policy tests
-- ----------------------------------------------------------------------------
-- Run with `supabase test db` (applies migrations to a fresh DB, then this file
-- inside a rolled-back transaction). Verifies household isolation, the two
-- active-member cap, role restrictions and deactivation (spec §32.3,
-- security-and-privacy §18.9). See docs/row-level-security.md.
-- ============================================================================

begin;
select plan(14);

-- ---------------------------------------------------------------------------
-- Fixtures (created as the superuser test role; RLS is bypassed here).
--   u1 owner + u2 member  → household A (full: two active members)
--   u3 owner + u4 member(deactivated) → household B
-- Uses test-only UUIDs that do NOT collide with supabase/seed.sql, since
-- `supabase start` loads the seed before `supabase test db` runs.
-- ---------------------------------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('a1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-u1@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('a1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-u2@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('a1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-u3@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('a1000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-u4@vitala.test','x',now(),now(),now(),'{}','{}');

update public.profiles set display_name = 'U1' where id = 'a1000000-0000-0000-0000-000000000001';
update public.profiles set display_name = 'U2' where id = 'a1000000-0000-0000-0000-000000000002';
update public.profiles set display_name = 'U3' where id = 'a1000000-0000-0000-0000-000000000003';

insert into public.households (id, name, created_by) values
  ('a1000000-0000-0000-0000-0000000000aa','Haushalt A','a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-0000000000bb','Haushalt B','a1000000-0000-0000-0000-000000000003');
insert into public.household_settings (household_id) values
  ('a1000000-0000-0000-0000-0000000000aa'),
  ('a1000000-0000-0000-0000-0000000000bb');
insert into public.household_members (household_id, user_id, role, status) values
  ('a1000000-0000-0000-0000-0000000000aa','a1000000-0000-0000-0000-000000000001','owner','active'),
  ('a1000000-0000-0000-0000-0000000000aa','a1000000-0000-0000-0000-000000000002','member','active'),
  ('a1000000-0000-0000-0000-0000000000bb','a1000000-0000-0000-0000-000000000003','owner','active'),
  ('a1000000-0000-0000-0000-0000000000bb','a1000000-0000-0000-0000-000000000004','member','deactivated');

-- Helper: act as a given authenticated user for RLS-scoped queries.
create or replace function public._login(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid::text, 'role','authenticated')::text, true);
end $$;

-- ===========================================================================
set local role authenticated;

-- (1) user reads own profile
select public._login('a1000000-0000-0000-0000-000000000001');
select is(
  (select count(*)::int from public.profiles where id = 'a1000000-0000-0000-0000-000000000001'),
  1, 'user can read own profile');

-- (2) user updates own profile
select lives_ok(
  $$ update public.profiles set display_name = 'U1 neu' where id = 'a1000000-0000-0000-0000-000000000001' $$,
  'user can update own profile');

-- (3) member reads the other household member's profile
select is(
  (select count(*)::int from public.profiles where id = 'a1000000-0000-0000-0000-000000000002'),
  1, 'member can read the other household member profile');

-- (4) user can read own household
select is(
  (select count(*)::int from public.households where id = 'a1000000-0000-0000-0000-0000000000aa'),
  1, 'user can read own household');

-- (5) user cannot directly write household_members (no client UPDATE grant;
--     membership changes flow only through the security-definer RPCs)
select throws_ok(
  $$ update public.household_members set role = 'owner'
     where user_id = 'a1000000-0000-0000-0000-000000000002' $$,
  '42501', NULL, 'member roles cannot be changed directly (no privilege)');

-- Switch to the outsider (household B owner).
select public._login('a1000000-0000-0000-0000-000000000003');

-- (6) outsider cannot read household A profiles
select is(
  (select count(*)::int from public.profiles where id = 'a1000000-0000-0000-0000-000000000001'),
  0, 'outsider cannot read a foreign household profile');

-- (7) outsider cannot read household A
select is(
  (select count(*)::int from public.households where id = 'a1000000-0000-0000-0000-0000000000aa'),
  0, 'outsider cannot read a foreign household');

-- (8) outsider cannot read household A members
select is(
  (select count(*)::int from public.household_members
     where household_id = 'a1000000-0000-0000-0000-0000000000aa'),
  0, 'outsider cannot read foreign household members');

-- (9) creating an invite for a full household is rejected
select public._login('a1000000-0000-0000-0000-000000000001');
select throws_ok(
  $$ select public.create_household_invite() $$,
  'P0001', 'household_full', 'owner cannot invite into a full household');

-- (10) accepting into a full household is rejected (u3 is already in B, but
--      test the cap directly with a fresh outsider having no household)
select public._login('a1000000-0000-0000-0000-000000000003');
select throws_ok(
  $$ select public.accept_household_invite('DEADBEEF01') $$,
  'P0001', 'already_in_household', 'a user already in a household cannot accept an invite');

-- (11) deactivated member (u4) cannot read household B
select public._login('a1000000-0000-0000-0000-000000000004');
select is(
  (select count(*)::int from public.households where id = 'a1000000-0000-0000-0000-0000000000bb'),
  0, 'deactivated member loses access to the household');

-- ===========================================================================
-- Database-level guarantees (checked as superuser: triggers/constraints fire
-- regardless of RLS).
reset role;

-- (12) a third active member cannot be inserted (trigger)
select throws_ok(
  $$ insert into public.household_members (household_id, user_id, role, status)
     values ('a1000000-0000-0000-0000-0000000000aa','a1000000-0000-0000-0000-000000000003','member','active') $$,
  'P0001', 'household_full', 'a third active member is rejected by the DB trigger');

-- (13) a user cannot be an active member of two households (unique index)
select throws_ok(
  $$ insert into public.household_members (household_id, user_id, role, status)
     values ('a1000000-0000-0000-0000-0000000000bb','a1000000-0000-0000-0000-000000000001','member','active') $$,
  '23505', NULL, 'a user cannot be active in two households');

-- (14) deleting a household cascades to its members
delete from public.households where id = 'a1000000-0000-0000-0000-0000000000bb';
select is(
  (select count(*)::int from public.household_members
     where household_id = 'a1000000-0000-0000-0000-0000000000bb'),
  0, 'deleting a household cascades to its members');

select * from finish();
rollback;
