-- ============================================================================
-- Vitala · pgTAP tests · Reward system (Phase 5)
-- ----------------------------------------------------------------------------
-- Verifies server-authoritative rewards: per-entry XP/resources, daily caps,
-- city-XP coupling, idempotency, edit/delete corrections, shared entries,
-- mission completion (once), the weekly balance bonus, level status views and
-- RLS immutability. Runs inside a rolled-back transaction via `supabase test db`.
-- Assertions run as `authenticated`; ids flow through session GUCs (the
-- authenticated role cannot read TEMP tables). Test UUIDs never collide with
-- supabase/seed.sql.
-- ============================================================================

begin;
select plan(24);

-- --- Fixtures (superuser; RLS bypassed) ------------------------------------
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('e1000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rw-u1@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('e1000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rw-u2@vitala.test','x',now(),now(),now(),'{}','{}'),
  ('e1000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rw-u3@vitala.test','x',now(),now(),now(),'{}','{}');
insert into public.households (id, name, created_by) values
  ('e1000000-0000-0000-0000-0000000000aa','Haushalt A','e1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-0000000000bb','Haushalt B','e1000000-0000-0000-0000-000000000003');
insert into public.household_settings (household_id) values
  ('e1000000-0000-0000-0000-0000000000aa'),('e1000000-0000-0000-0000-0000000000bb');
insert into public.household_members (household_id, user_id, role, status) values
  ('e1000000-0000-0000-0000-0000000000aa','e1000000-0000-0000-0000-000000000001','owner','active'),
  ('e1000000-0000-0000-0000-0000000000aa','e1000000-0000-0000-0000-000000000002','member','active'),
  ('e1000000-0000-0000-0000-0000000000bb','e1000000-0000-0000-0000-000000000003','owner','active');

create or replace function public._login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role','authenticated')::text, true);
end $$;

set local role authenticated;
select public._login('e1000000-0000-0000-0000-000000000001');

-- ===========================================================================
-- Per-entry movement reward
-- ===========================================================================
select set_config('t.act',
  (select public.save_activity(null,(select id from public.activity_types where key='strength'),
     current_date, 60, 'medium'))::text, false);

select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='personal' and source_id = current_setting('t.act')::uuid),
  15, '60 min strength → 15 personal XP');

select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='city' and source_id = current_setting('t.act')::uuid),
  8, '→ 8 city XP (round 0.5×15)');

select is(
  (select balance::int from public.resources
   where household_id='e1000000-0000-0000-0000-0000000000aa' and resource_key='energy'),
  6, '→ 6 energy (round 0.4×15)');

-- Idempotency: reconciling again changes nothing.
set local role postgres;
select app.reward_sync_movement('e1000000-0000-0000-0000-0000000000aa', current_date);
set local role authenticated;
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='personal' and source_id = current_setting('t.act')::uuid),
  15, 're-sync is idempotent (still 15)');

-- Edit to 30 min → correction row + new net.
select public.save_activity(current_setting('t.act')::uuid,
  (select id from public.activity_types where key='strength'), current_date, 30, 'medium');
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='personal' and source_id = current_setting('t.act')::uuid),
  10, 'edit 60→30 min nets to 10 XP');
select cmp_ok(
  (select count(*)::int from public.experience_transactions
   where reason='correction' and source_id = current_setting('t.act')::uuid),
  '>=', 1, 'edit writes a correction row');

-- Delete → net XP and energy return to zero.
select public.delete_entry('activity', current_setting('t.act')::uuid);
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='personal' and source_id = current_setting('t.act')::uuid),
  0, 'delete nets personal XP to 0');
select is(
  (select balance::int from public.resources
   where household_id='e1000000-0000-0000-0000-0000000000aa' and resource_key='energy'),
  0, 'delete returns energy to 0');

-- ===========================================================================
-- Nutrition cap + shared entry
-- ===========================================================================
select set_config('t.grp',
  (select public.save_ritual_checkin(null,'nutrition',
     array(select id from public.ritual_definitions where area='nutrition' order by sort_order limit 6),
     current_date))::text, false);
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='personal' and source_id = current_setting('t.grp')::uuid),
  12, 'nutrition 6 blocks capped at 12 XP/day');

select set_config('t.sh',
  (select public.save_activity(null,(select id from public.activity_types where key='endurance'),
     current_date, 60, 'medium', null,null,null,null, true, 'e1000000-0000-0000-0000-000000000002'))::text, false);
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='city' and source_id = current_setting('t.sh')::uuid),
  8, 'shared entry grants city XP exactly once');
-- Verify the partner's own XP while logged in AS the partner (RLS hides it from
-- user 1 — that privacy is asserted separately below).
select public._login('e1000000-0000-0000-0000-000000000002');
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where scope='personal' and source_id = current_setting('t.sh')::uuid
     and user_id='e1000000-0000-0000-0000-000000000002'),
  15, 'shared entry grants the partner personal XP too (seen by the partner)');
select public._login('e1000000-0000-0000-0000-000000000001');

-- ===========================================================================
-- RLS: privacy + immutability
-- ===========================================================================
-- The partner's personal XP rows are hidden from user 1 (non-competitive).
select is(
  (select count(*)::int from public.experience_transactions
   where user_id='e1000000-0000-0000-0000-000000000002' and scope='personal'),
  0, 'a member cannot read the partner''s personal XP rows');

select throws_ok(
  $$ insert into public.experience_transactions(household_id,user_id,scope,amount,reason,source_kind,rule_version,business_date)
     values ('e1000000-0000-0000-0000-0000000000aa','e1000000-0000-0000-0000-000000000001','personal',9999,'activity','manual',1,current_date) $$,
  '42501', null, 'client cannot INSERT into the XP ledger');

select throws_ok(
  $$ insert into public.resource_transactions(household_id,resource_key,amount,reason,source_kind,rule_version,business_date)
     values ('e1000000-0000-0000-0000-0000000000aa','energy',9999,'grant','manual',1,current_date) $$,
  '42501', null, 'client cannot INSERT into the resource ledger');

select throws_ok(
  $$ update public.resources set balance = 9999
     where household_id='e1000000-0000-0000-0000-0000000000aa' and resource_key='energy' $$,
  '42501', null, 'client cannot UPDATE resource balances directly');

-- ===========================================================================
-- Level status views
-- ===========================================================================
select is(
  (select level::int from public.personal_reward_status
   where user_id='e1000000-0000-0000-0000-000000000001'),
  1, 'personal level status is level 1 for a new member');
select is(
  (select title from public.city_reward_status
   where household_id='e1000000-0000-0000-0000-0000000000aa'),
  'Keimzelle', 'city status title starts at Keimzelle');

-- ===========================================================================
-- Missions: assignment, completion (once), swap, skip
-- ===========================================================================
select lives_ok($$ select public.sync_missions() $$, 'sync_missions assigns the period missions');
select cmp_ok(
  (select count(*)::int from public.mission_assignments
   where household_id='e1000000-0000-0000-0000-0000000000aa' and status='active'),
  '>=', 3, 'at least personal day/week + shared day/week are offered');

-- Deterministic completion of sd_walk via a shared walk.
set local role postgres;
update public.mission_assignments set status='expired'
  where household_id='e1000000-0000-0000-0000-0000000000aa' and scope='shared' and period='day' and status in ('offered','active');
insert into public.mission_assignments (household_id, user_id, mission_definition_id, scope, period, period_start, period_end, status)
  values ('e1000000-0000-0000-0000-0000000000aa', null,(select id from public.mission_definitions where key='sd_walk'),
    'shared','day', current_date, current_date, 'active');
set local role authenticated;
select public.save_activity(null,(select id from public.activity_types where key='walk'),
  current_date, 30, 'light', null,null,null,null, true, 'e1000000-0000-0000-0000-000000000002');
select set_config('t.mid',
  (select id::text from public.mission_assignments
   where household_id='e1000000-0000-0000-0000-0000000000aa' and scope='shared' and period='day' and status='active' limit 1), false);
select lives_ok($$ select public.complete_mission(current_setting('t.mid')::uuid) $$, 'shared mission completes');
select lives_ok($$ select public.complete_mission(current_setting('t.mid')::uuid) $$, 'double completion is safe (idempotent)');
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where source_kind='mission' and source_id = current_setting('t.mid')::uuid and scope='city'),
  10, 'shared daily mission grants 10 city XP exactly once');

-- ===========================================================================
-- Balance bonus (household reaches four active areas this week)
-- ===========================================================================
select public.save_ritual_checkin(null,'sustainability',
  array(select id from public.ritual_definitions where area='sustainability' and kind='daily_block' order by sort_order limit 1), current_date);
select public.save_ritual_checkin(null,'animal_welfare',
  array(select id from public.ritual_definitions where area='animal_welfare' and kind='daily_block' order by sort_order limit 1), current_date);
select is(
  (select coalesce(sum(amount),0)::int from public.experience_transactions
   where household_id='e1000000-0000-0000-0000-0000000000aa' and reason='balance_bonus' and scope='city'),
  20, 'four active areas grant the full 20 city-XP balance bonus (once)');

select * from finish();
rollback;
