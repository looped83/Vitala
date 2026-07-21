-- ============================================================================
-- Vitala · pgTAP tests · Activity & ritual capture (Phase 3)
-- ----------------------------------------------------------------------------
-- Verifies the RPC write path, database constraints and RLS for the four life
-- areas (spec §37.3 DB tests, §37.4 RLS tests). Runs inside a rolled-back
-- transaction via `supabase test db`.
-- ============================================================================

begin;
select plan(22);

-- --- Fixtures (as superuser; RLS bypassed) --------------------------------
--   u1 owner + u2 member  → household A (two active members)
--   u3 owner              → household B (outsider)
--   u5 member(deactivated)→ household A (lost access)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('c1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','act-u1@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('c1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','act-u2@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('c1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','act-u3@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('c1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','act-u5@vitala.test','x',now(),now(),now(),'{}','{}');

insert into public.households (id, name, created_by) values
  ('c1000000-0000-0000-0000-0000000000aa','Haushalt A','c1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-0000000000bb','Haushalt B','c1000000-0000-0000-0000-000000000003');
insert into public.household_settings (household_id) values
  ('c1000000-0000-0000-0000-0000000000aa'),
  ('c1000000-0000-0000-0000-0000000000bb');
insert into public.household_members (household_id, user_id, role, status) values
  ('c1000000-0000-0000-0000-0000000000aa','c1000000-0000-0000-0000-000000000001','owner','active'),
  ('c1000000-0000-0000-0000-0000000000aa','c1000000-0000-0000-0000-000000000002','member','active'),
  ('c1000000-0000-0000-0000-0000000000aa','c1000000-0000-0000-0000-000000000005','member','deactivated'),
  ('c1000000-0000-0000-0000-0000000000bb','c1000000-0000-0000-0000-000000000003','owner','active');

create or replace function public._login(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role','authenticated')::text, true);
end $$;

-- Convenience: id of a movement type / ritual definition by key.
create temp table k as
  select 'strength'::text as key, id from public.activity_types where key = 'strength'
  union all select 'walk', id from public.activity_types where key = 'walk'
  union all select 'veg', id from public.ritual_definitions where key = 'vegetables'
  union all select 'meal', id from public.ritual_definitions where key = 'balanced_vegan_meal'
  union all select 'bike', id from public.ritual_definitions where key = 'bike_instead_car';

set local role authenticated;

-- ===========================================================================
-- Movement RPC
-- ===========================================================================
select public._login('c1000000-0000-0000-0000-000000000001');

-- (1) a valid personal activity is created
select lives_ok(
  format($$ select public.save_activity(null, %L, current_date - 1, 30, 'medium') $$,
         (select id from k where key='strength')),
  'owner creates a personal movement entry');

-- (2) invalid duration is rejected
select throws_ok(
  format($$ select public.save_activity(null, %L, current_date - 1, 3) $$,
         (select id from k where key='strength')),
  'P0001', 'invalid_duration', 'a 3-minute duration is rejected');

-- (3) unknown activity type is rejected
select throws_ok(
  $$ select public.save_activity(null, '00000000-0000-0000-0000-0000000000ff', current_date - 1, 30) $$,
  'P0001', 'invalid_type', 'an unknown activity type is rejected');

-- (4) a future date is rejected
select throws_ok(
  format($$ select public.save_activity(null, %L, current_date + 5, 30) $$,
         (select id from k where key='strength')),
  'P0001', 'invalid_date', 'a future date is rejected');

-- (5) a shared activity with a foreign partner is rejected
select throws_ok(
  format($$ select public.save_activity(null, %L, current_date - 1, 30, null, null, null, null, null, true, 'c1000000-0000-0000-0000-000000000003') $$,
         (select id from k where key='walk')),
  'P0001', 'invalid_participant', 'a foreign partner cannot be added to a shared entry');

-- (6) a valid shared activity creates exactly two participant rows
select lives_ok(
  format($$ select public.save_activity(null, %L, current_date - 1, 30, null, null, null, null, null, true, 'c1000000-0000-0000-0000-000000000002') $$,
         (select id from k where key='walk')),
  'owner creates a shared movement entry with the member');

-- ===========================================================================
-- Ritual RPC
-- ===========================================================================
-- (7) a nutrition check-in with two blocks is created
select lives_ok(
  format($$ select public.save_ritual_checkin(null, 'nutrition', array[%L,%L]::uuid[], current_date) $$,
         (select id from k where key='veg'), (select id from k where key='meal')),
  'a nutrition check-in with two blocks is created');

-- (8) selecting the movement area for a ritual is rejected
select throws_ok(
  format($$ select public.save_ritual_checkin(null, 'movement', array[%L]::uuid[], current_date) $$,
         (select id from k where key='veg')),
  'P0001', 'invalid_type', 'a ritual cannot use the movement area');

-- (9) a definition from another area is rejected (type/area mismatch)
select throws_ok(
  format($$ select public.save_ritual_checkin(null, 'nutrition', array[%L]::uuid[], current_date) $$,
         (select id from k where key='bike')),
  'P0001', 'invalid_type', 'a sustainability definition cannot be used under nutrition');

-- (10) an empty selection is rejected
select throws_ok(
  $$ select public.save_ritual_checkin(null, 'nutrition', array[]::uuid[], current_date) $$,
  'P0001', 'empty_selection', 'an empty ritual selection is rejected');

-- (11) re-selecting the same block the same day is a duplicate
select throws_ok(
  format($$ select public.save_ritual_checkin(null, 'nutrition', array[%L]::uuid[], current_date) $$,
         (select id from k where key='veg')),
  'P0001', 'duplicate_ritual', 'the same block cannot be counted twice a day');

-- ===========================================================================
-- Deactivated member
-- ===========================================================================
-- (12) a deactivated member cannot capture
select public._login('c1000000-0000-0000-0000-000000000005');
select throws_ok(
  format($$ select public.save_activity(null, %L, current_date - 1, 30) $$,
         (select id from k where key='strength')),
  'P0001', 'not_in_household', 'a deactivated member cannot capture');

-- ===========================================================================
-- RLS reads
-- ===========================================================================
-- (13) member u2 can read the household's activities
select public._login('c1000000-0000-0000-0000-000000000002');
select cmp_ok(
  (select count(*)::int from public.activities where household_id = 'c1000000-0000-0000-0000-0000000000aa'),
  '>=', 2, 'a member reads the household activities');

-- (14) member u2 can read the household's ritual entries
select cmp_ok(
  (select count(*)::int from public.ritual_entries where household_id = 'c1000000-0000-0000-0000-0000000000aa'),
  '>=', 2, 'a member reads the household ritual entries');

-- (15) member u2 can read the shared participants
select cmp_ok(
  (select count(*)::int from public.entry_participants where household_id = 'c1000000-0000-0000-0000-0000000000aa'),
  '>=', 2, 'a member reads shared participants');

-- (16) outsider u3 cannot read household A activities
select public._login('c1000000-0000-0000-0000-000000000003');
select is(
  (select count(*)::int from public.activities where household_id = 'c1000000-0000-0000-0000-0000000000aa'),
  0, 'an outsider cannot read foreign activities');

-- (17) outsider cannot read household A ritual entries
select is(
  (select count(*)::int from public.ritual_entries where household_id = 'c1000000-0000-0000-0000-0000000000aa'),
  0, 'an outsider cannot read foreign ritual entries');

-- ===========================================================================
-- Update / delete permissions
-- ===========================================================================
-- Capture the personal activity id (as superuser).
reset role;
create temp table t_ids as
  select id from public.activities
  where user_id = 'c1000000-0000-0000-0000-000000000001' and is_shared = false and deleted_at is null
  limit 1;
set local role authenticated;

-- (18) a non-creator member cannot update someone else's entry
select public._login('c1000000-0000-0000-0000-000000000002');
select throws_ok(
  format($$ select public.save_activity(%L, %L, current_date - 1, 40) $$,
         (select id from t_ids), (select id from k where key='strength')),
  'P0001', 'not_allowed', 'a member cannot edit another person''s entry');

-- (19) the creator can update their own entry
select public._login('c1000000-0000-0000-0000-000000000001');
select lives_ok(
  format($$ select public.save_activity(%L, %L, current_date - 1, 40) $$,
         (select id from t_ids), (select id from k where key='strength')),
  'the creator can edit their own entry');

-- (20) delete soft-deletes the entry (any active member; actor recorded)
select public._login('c1000000-0000-0000-0000-000000000002');
select lives_ok(
  format($$ select public.delete_entry('activity', %L) $$, (select id from t_ids)),
  'an active member can delete a household entry');

reset role;
-- (21) the deleted row still exists but is flagged (soft delete)
select isnt(
  (select deleted_at from public.activities where id = (select id from t_ids)),
  null, 'delete performs a soft delete, keeping the row for correction');

-- (22) the outsider cannot delete a foreign entry (not_found via household scope)
set local role authenticated;
select public._login('c1000000-0000-0000-0000-000000000003');
select throws_ok(
  format($$ select public.delete_entry('activity', %L) $$, (select id from t_ids)),
  'P0001', 'not_found', 'an outsider cannot delete a foreign entry');

select * from finish();
rollback;
