-- ============================================================================
-- Vitala · pgTAP tests · Goals, rituals & check-ins (Phase 4)
-- ----------------------------------------------------------------------------
-- Verifies the RPC write path, database constraints, RLS and the private
-- check-in guarantee (spec §52.3/§52.4). Runs inside a rolled-back transaction
-- via `supabase test db`. Assertions run as the `authenticated` role; catalog
-- and goal ids are carried through session GUCs (no TEMP tables — the
-- authenticated role cannot read them).
--
-- Uses test-only UUIDs that never collide with supabase/seed.sql.
-- ============================================================================

begin;
select plan(22);

-- --- Fixtures (as superuser; RLS bypassed) --------------------------------
--   g1 owner + g2 member  → household A (two active members)
--   g3 owner              → household B (outsider)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('d1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','goal-u1@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('d1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','goal-u2@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('d1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','goal-u3@vitala.test','x',now(),now(),now(),'{}','{}');

insert into public.households (id, name, created_by) values
  ('d1000000-0000-0000-0000-0000000000aa','Haushalt A','d1000000-0000-0000-0000-000000000001'),
  ('d1000000-0000-0000-0000-0000000000bb','Haushalt B','d1000000-0000-0000-0000-000000000003');
insert into public.household_settings (household_id) values
  ('d1000000-0000-0000-0000-0000000000aa'),
  ('d1000000-0000-0000-0000-0000000000bb');
insert into public.household_members (household_id, user_id, role, status) values
  ('d1000000-0000-0000-0000-0000000000aa','d1000000-0000-0000-0000-000000000001','owner','active'),
  ('d1000000-0000-0000-0000-0000000000aa','d1000000-0000-0000-0000-000000000002','member','active'),
  ('d1000000-0000-0000-0000-0000000000bb','d1000000-0000-0000-0000-000000000003','owner','active');

create or replace function public._login(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role','authenticated')::text, true);
end $$;

set local role authenticated;

-- ===========================================================================
-- Goals: create, validation, ownership
-- ===========================================================================
select public._login('d1000000-0000-0000-0000-000000000001');

-- (1) owner creates a personal weekly movement goal
select lives_ok(
  $$ select public.save_goal(null,'personal','d1000000-0000-0000-0000-000000000001',
       'Dreimal Bewegung',null,'movement','entry_count',3,'units','week','weekly',
       '{}'::text[],'{}'::text[], current_date, null, null, null) $$,
  'owner creates a personal weekly goal');

-- (2) the goal appears in the overview with a current period
select is(
  (select count(*)::int from public.goal_overview
   where household_id='d1000000-0000-0000-0000-0000000000aa' and title='Dreimal Bewegung'
     and period_id is not null),
  1, 'goal overview exposes the goal with an active period');

-- (3) shared goal creation succeeds
select lives_ok(
  $$ select public.save_goal(null,'shared',null,'Gemeinsame Aktivitäten',null,'movement',
       'shared_count',4,'shared_activities','month','monthly','{}'::text[],'{}'::text[],
       date_trunc('month',current_date)::date, null, null, null) $$,
  'shared monthly goal created');

-- (4) non-positive target is rejected
select throws_ok(
  $$ select public.save_goal(null,'personal','d1000000-0000-0000-0000-000000000001',
       'Bad',null,'movement','entry_count',0,'units','week','weekly',
       '{}'::text[],'{}'::text[], current_date, null, null, null) $$,
  'P0001', 'invalid_target', 'non-positive target rejected');

-- (5) unit incompatible with measurement is rejected
select throws_ok(
  $$ select public.save_goal(null,'personal','d1000000-0000-0000-0000-000000000001',
       'Bad',null,'movement','duration_minutes',30,'units','week','weekly',
       '{}'::text[],'{}'::text[], current_date, null, null, null) $$,
  'P0001', 'invalid_measurement', 'unit/measurement mismatch rejected');

-- (6) a personal goal for a foreign (non-member) owner is rejected
select throws_ok(
  $$ select public.save_goal(null,'personal','d1000000-0000-0000-0000-000000000003',
       'Bad',null,'movement','entry_count',3,'units','week','weekly',
       '{}'::text[],'{}'::text[], current_date, null, null, null) $$,
  'P0001', 'invalid_owner', 'foreign owner rejected');

-- (7) ritual filters on a movement goal are rejected
select throws_ok(
  $$ select public.save_goal(null,'personal','d1000000-0000-0000-0000-000000000001',
       'Bad',null,'movement','entry_count',3,'units','week','weekly',
       '{}'::text[], array['balanced_vegan_meal'], current_date, null, null, null) $$,
  'P0001', 'invalid_filter', 'ritual filter on movement goal rejected');

-- (8) clients cannot UPDATE goals directly (no privilege; RPC-only writes)
select throws_ok(
  $$ update public.goals set target_value = 999
     where household_id='d1000000-0000-0000-0000-0000000000aa' $$,
  '42501', NULL, 'direct goal UPDATE denied (progress cannot be forged)');

-- ===========================================================================
-- Status transitions
-- ===========================================================================
-- Capture the weekly goal id in a GUC.
select set_config('vitala.goal_id',
  (select id::text from public.goals
   where household_id='d1000000-0000-0000-0000-0000000000aa' and title='Dreimal Bewegung'), true);

-- (9) pause is allowed
select lives_ok(
  $$ select public.set_goal_status(current_setting('vitala.goal_id')::uuid, 'paused', 'Urlaub', null) $$,
  'active goal can be paused');

-- (10) paused goal records the reason
select is(
  (select pause_reason from public.goals where id = current_setting('vitala.goal_id')::uuid),
  'Urlaub', 'pause reason stored');

-- (11) resume is allowed
select lives_ok(
  $$ select public.set_goal_status(current_setting('vitala.goal_id')::uuid, 'active', null, null) $$,
  'paused goal can be resumed');

-- (12) manual progress is rejected for an auto-measured goal
select throws_ok(
  $$ select public.set_goal_manual_progress(current_setting('vitala.goal_id')::uuid, 5) $$,
  'P0001', 'invalid_measurement', 'manual progress forbidden on auto-measured goal');

-- ===========================================================================
-- Rituals & completions
-- ===========================================================================
-- (13) create a shared daily ritual
select lives_ok(
  $$ select public.save_ritual(null,'shared',null,'Vogeltränke prüfen',null,'animal_welfare',
       'check','daily','morning','{}'::smallint[], current_date, null, 10) $$,
  'shared daily ritual created');

select set_config('vitala.ritual_id',
  (select id::text from public.rituals
   where household_id='d1000000-0000-0000-0000-0000000000aa' and title='Vogeltränke prüfen'), true);

-- (14) completing the ritual is allowed
select lives_ok(
  $$ select public.complete_ritual(current_setting('vitala.ritual_id')::uuid, current_date, 'done', null, null) $$,
  'ritual instance completed');

-- (15) a second completion for the same instance upserts (still one row)
select public.complete_ritual(current_setting('vitala.ritual_id')::uuid, current_date, 'skipped', null, null);
select is(
  (select count(*)::int from public.ritual_completions where ritual_id = current_setting('vitala.ritual_id')::uuid),
  1, 'no duplicate ritual completion (upsert keeps one instance)');

-- ===========================================================================
-- Check-ins (private)
-- ===========================================================================
-- (16) morning check-in
select lives_ok(
  $$ select public.save_check_in('morning'::public.check_in_type, current_date, 3::smallint,
       'half'::public.time_budget, 'balanced'::public.day_intensity, 'movement'::public.day_focus,
       'Ruhig starten', null, null, null, null) $$,
  'morning check-in saved');

-- (17) a second morning check-in the same day upserts (max one per user/type/day)
select public.save_check_in('morning'::public.check_in_type, current_date, 5::smallint,
  null,null,null,null,null,null,null,null);
select is(
  (select count(*)::int from public.daily_check_ins
   where user_id='d1000000-0000-0000-0000-000000000001'
     and check_in_type='morning' and business_date=current_date),
  1, 'max one morning check-in per user and day');

-- (18) a future check-in is rejected
select throws_ok(
  $$ select public.save_check_in('morning'::public.check_in_type, current_date + 1) $$,
  'P0001', 'invalid_date', 'future check-in rejected');

-- ===========================================================================
-- RLS: household read scope + private check-ins
-- ===========================================================================
-- (19) the partner sees household goals
select public._login('d1000000-0000-0000-0000-000000000002');
select cmp_ok(
  (select count(*)::int from public.goal_overview where household_id='d1000000-0000-0000-0000-0000000000aa'),
  '>=', 1, 'partner reads household goals');

-- (20) the partner CANNOT read the other member's private check-in
select is(
  (select count(*)::int from public.daily_check_ins
   where user_id='d1000000-0000-0000-0000-000000000001'),
  0, 'partner cannot read a private check-in');

-- (21) an outsider (household B) sees no household A goals
select public._login('d1000000-0000-0000-0000-000000000003');
select is(
  (select count(*)::int from public.goal_overview where household_id='d1000000-0000-0000-0000-0000000000aa'),
  0, 'outsider reads no foreign-household goals');

-- (22) an outsider sees no household A rituals
select is(
  (select count(*)::int from public.rituals where household_id='d1000000-0000-0000-0000-0000000000aa'),
  0, 'outsider reads no foreign-household rituals');

select * from finish();
rollback;
