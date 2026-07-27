-- ============================================================================
-- Vitala · Local seed data (development + tests only)
-- ----------------------------------------------------------------------------
-- Creates deterministic test users and households. NEVER run against production
-- (guarded by fixed @vitala.test addresses and a NOTICE). Runs as the postgres
-- role, so it bypasses RLS on purpose. See docs/testing-implementation.md §Seeds.
--
-- Fixtures:
--   Household "Vitala von Lutz & René"  → lutz (owner, active) + rene (member, active)
--   Household "Anderer Haushalt"        → mara (owner, active)   ← RLS isolation
--   Deactivated member                  → theo (member, deactivated) in the Mara HH
-- Passwords are all "vitala-test-pw" (bcrypt).
-- ============================================================================

do $$ begin
  raise notice 'Vitala seed: inserting TEST fixtures (never use in production).';
end $$;

-- Fixed ids so tests can reference them.
-- lutz  11111111-1111-1111-1111-111111111111
-- rene  22222222-2222-2222-2222-222222222222
-- mara  33333333-3333-3333-3333-333333333333
-- theo  44444444-4444-4444-4444-444444444444

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'lutz@vitala.test',
   extensions.crypt('vitala-test-pw', extensions.gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'rene@vitala.test',
   extensions.crypt('vitala-test-pw', extensions.gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'mara@vitala.test',
   extensions.crypt('vitala-test-pw', extensions.gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'theo@vitala.test',
   extensions.crypt('vitala-test-pw', extensions.gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
on conflict (id) do nothing;

-- Email identities (required for password login).
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"lutz@vitala.test"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"rene@vitala.test"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"mara@vitala.test"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
   '{"sub":"44444444-4444-4444-4444-444444444444","email":"theo@vitala.test"}', 'email', now(), now(), now())
on conflict do nothing;

-- Profiles/preferences are auto-created by the on_auth_user_created trigger.
update public.profiles set display_name = 'Lutz', accent_color = 'movement'
  where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set display_name = 'René', accent_color = 'nutrition'
  where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set display_name = 'Mara', accent_color = 'sustainability'
  where id = '33333333-3333-3333-3333-333333333333';
update public.profiles set display_name = 'Theo', accent_color = 'animal_welfare'
  where id = '44444444-4444-4444-4444-444444444444';

-- Household A: fully set up (owner + member).
insert into public.households (id, name, created_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Vitala von Lutz & René',
        '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;
insert into public.household_settings (household_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') on conflict do nothing;
insert into public.household_members (household_id, user_id, role, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'member', 'active')
on conflict (household_id, user_id) do nothing;

-- Household B: separate household for RLS isolation tests, with a deactivated
-- member to verify that deactivation removes access.
insert into public.households (id, name, created_by)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Anderer Haushalt',
        '33333333-3333-3333-3333-333333333333')
on conflict (id) do nothing;
insert into public.household_settings (household_id)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') on conflict do nothing;
insert into public.household_members (household_id, user_id, role, status)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'owner', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'member', 'deactivated')
on conflict (household_id, user_id) do nothing;

-- ============================================================================
-- Phase 3 · capture fixtures (household A only). Clearly test data. Reference
-- ids are looked up by stable key so the seed survives reference re-ordering.
-- Uses fixed ids so tests can reference specific entries.
--   lutz 1111… · rene 2222… · household A aaaa…
-- ============================================================================

-- Personal movement: Lutz, 45 min strength, 2 days ago.
insert into public.activities
  (id, household_id, user_id, created_by, activity_type_id, occurred_on, duration_min, intensity, note, is_shared, source)
values
  ('e0000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   (select id from public.activity_types where key = 'strength'),
   (now() at time zone 'Europe/Berlin')::date - 2, 45, 'intense', 'Ganzkörper', false, 'manual')
on conflict (id) do nothing;

-- Shared movement: Lutz + René walk yesterday (one row + participants).
insert into public.activities
  (id, household_id, user_id, created_by, activity_type_id, occurred_on, duration_min, intensity, is_shared, group_id, source)
values
  ('e0000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   (select id from public.activity_types where key = 'walk'),
   (now() at time zone 'Europe/Berlin')::date - 1, 30, 'light', true,
   'e0000000-0000-0000-0000-0000000000f2', 'manual')
on conflict (id) do nothing;
insert into public.entry_participants (household_id, entry_kind, group_id, user_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'activity', 'e0000000-0000-0000-0000-0000000000f2', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'activity', 'e0000000-0000-0000-0000-0000000000f2', '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

-- Soft-deleted movement (archived; must stay hidden in the app).
insert into public.activities
  (id, household_id, user_id, created_by, activity_type_id, occurred_on, duration_min, is_shared, source, deleted_at)
values
  ('e0000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   (select id from public.activity_types where key = 'yoga'),
   (now() at time zone 'Europe/Berlin')::date - 3, 20, false, 'manual', now())
on conflict (id) do nothing;

-- Nutrition check-in: René today, three blocks sharing one group.
insert into public.ritual_entries
  (household_id, user_id, created_by, ritual_definition_id, area, occurred_on, entry_group_id, source)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
       '22222222-2222-2222-2222-222222222222', rd.id, 'nutrition',
       (now() at time zone 'Europe/Berlin')::date, 'e0000000-0000-0000-0000-0000000000a1', 'manual'
from public.ritual_definitions rd
where rd.key in ('balanced_vegan_meal', 'self_cooked', 'vegetables')
on conflict do nothing;

-- Sustainability action: Lutz, bike instead of car, today.
insert into public.ritual_entries
  (household_id, user_id, created_by, ritual_definition_id, area, occurred_on, entry_group_id, source)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
       '11111111-1111-1111-1111-111111111111', rd.id, 'sustainability',
       (now() at time zone 'Europe/Berlin')::date, 'e0000000-0000-0000-0000-0000000000a2', 'manual'
from public.ritual_definitions rd where rd.key = 'bike_instead_car'
on conflict do nothing;

-- Animal-welfare special action: René, bird bath, yesterday, with a note.
insert into public.ritual_entries
  (household_id, user_id, created_by, ritual_definition_id, area, occurred_on, note, entry_group_id, source)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
       '22222222-2222-2222-2222-222222222222', rd.id, 'animal_welfare',
       (now() at time zone 'Europe/Berlin')::date - 1, 'Frisches Wasser aufgefüllt',
       'e0000000-0000-0000-0000-0000000000a3', 'manual'
from public.ritual_definitions rd where rd.key = 'bird_bath'
on conflict do nothing;

-- Favourites: one shared movement quick action + one personal nutrition one.
insert into public.entry_favorites
  (household_id, created_by, owner_user_id, area, label, activity_type_id, duration_min, intensity, is_shared, sort_order)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', null,
   'movement', '30 Min Krafttraining',
   (select id from public.activity_types where key = 'strength'), 30, 'medium', false, 10)
on conflict do nothing;
insert into public.entry_favorites
  (household_id, created_by, owner_user_id, area, label, ritual_definition_ids, is_shared, sort_order)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
       '22222222-2222-2222-2222-222222222222', 'nutrition', 'Ausgewogene Mahlzeit',
       array[(select id from public.ritual_definitions where key = 'balanced_vegan_meal'),
             (select id from public.ritual_definitions where key = 'vegetables')],
       false, 20
on conflict do nothing;

-- ============================================================================
-- Phase 4 · goals, rituals & check-in fixtures (household A only). Clearly test
-- data. Periods are inserted directly (the sync RPC needs an auth context);
-- reflections are fictional. Fixed ids let tests reference them.
--   lutz 1111… · rene 2222… · household A aaaa…
-- Date anchors use the household timezone so "today"/period math line up.
-- ============================================================================
do $$
declare
  v_hh uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_lutz uuid := '11111111-1111-1111-1111-111111111111';
  v_rene uuid := '22222222-2222-2222-2222-222222222222';
  v_today date := (now() at time zone 'Europe/Berlin')::date;
  v_week_start date := date_trunc('week', (now() at time zone 'Europe/Berlin'))::date; -- Monday
  v_month_start date := date_trunc('month', (now() at time zone 'Europe/Berlin'))::date;
  v_gid uuid;
begin
  -- 1) Personal weekly goal (Lutz): three movement sessions per week (active).
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status, template_key)
  values ('60000000-0000-0000-0000-000000000001', v_hh, v_lutz, 'personal', v_lutz,
    'Dreimal Bewegung pro Woche', 'movement', 'entry_count', 3, 'units', 'week', 'weekly',
    v_week_start, 'active', 'move_3x_week')
  on conflict (id) do nothing;
  insert into public.goal_periods (goal_id, household_id, period_index, period_start, period_end, target_value, status)
  values ('60000000-0000-0000-0000-000000000001', v_hh, 0, v_week_start, v_week_start + 6, 3, 'active')
  on conflict do nothing;

  -- 2) Personal weekly minutes goal (René): 150 movement minutes per week.
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status, template_key)
  values ('60000000-0000-0000-0000-000000000002', v_hh, v_rene, 'personal', v_rene,
    '150 Minuten Bewegung pro Woche', 'movement', 'duration_minutes', 150, 'minutes', 'week', 'weekly',
    v_week_start, 'active', 'move_minutes_week')
  on conflict (id) do nothing;
  insert into public.goal_periods (goal_id, household_id, period_index, period_start, period_end, target_value, status)
  values ('60000000-0000-0000-0000-000000000002', v_hh, 0, v_week_start, v_week_start + 6, 150, 'active')
  on conflict do nothing;

  -- 3) Shared monthly goal: four shared activities this month.
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status, template_key)
  values ('60000000-0000-0000-0000-000000000003', v_hh, v_lutz, 'shared', null,
    'Vier gemeinsame Aktivitäten im Monat', 'movement', 'shared_count', 4, 'shared_activities',
    'month', 'monthly', v_month_start, 'active', 'shared_activities_month')
  on conflict (id) do nothing;
  insert into public.goal_periods (goal_id, household_id, period_index, period_start, period_end, target_value, status)
  values ('60000000-0000-0000-0000-000000000003', v_hh, 0, v_month_start,
    (v_month_start + interval '1 month')::date - 1, 4, 'active')
  on conflict do nothing;

  -- 4) Recurring weekly goal WITH history (Lutz): two elapsed periods frozen + current active.
  v_gid := '60000000-0000-0000-0000-000000000004';
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status, template_key)
  values (v_gid, v_hh, v_lutz, 'personal', v_lutz, 'Zweimal Krafttraining pro Woche',
    'movement', 'entry_count', 2, 'units', 'week', 'weekly', v_week_start - 14, 'active', 'strength_2x_week')
  on conflict (id) do nothing;
  insert into public.goal_periods (goal_id, household_id, period_index, period_start, period_end, target_value, status, final_value, completed_at)
  values
    (v_gid, v_hh, 0, v_week_start - 14, v_week_start - 8, 2, 'completed', 2, now() - interval '9 days'),
    (v_gid, v_hh, 1, v_week_start - 7, v_week_start - 1, 2, 'expired', 1, null),
    (v_gid, v_hh, 2, v_week_start, v_week_start + 6, 2, 'active', null, null)
  on conflict do nothing;

  -- 5) Paused goal (René): monthly yoga, paused without penalty.
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status,
    activity_type_keys, paused_at, pause_reason)
  values ('60000000-0000-0000-0000-000000000005', v_hh, v_rene, 'personal', v_rene,
    'Acht Yoga-Einheiten im Monat', 'movement', 'entry_count', 8, 'units', 'month', 'monthly',
    v_month_start, 'paused', array['yoga','peloton_yoga'], now() - interval '3 days', 'Kurze Pause')
  on conflict (id) do nothing;
  insert into public.goal_periods (goal_id, household_id, period_index, period_start, period_end, target_value, status)
  values ('60000000-0000-0000-0000-000000000005', v_hh, 0, v_month_start,
    (v_month_start + interval '1 month')::date - 1, 8, 'active')
  on conflict do nothing;

  -- 6) Completed one-off goal (shared): a biodiversity project, done.
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status,
    manual_value, completed_at)
  values ('60000000-0000-0000-0000-000000000006', v_hh, v_lutz, 'shared', null,
    'Ein Biodiversitätsprojekt', 'animal_welfare', 'boolean', 1, 'actions', 'month', 'none',
    v_month_start, 'completed', 1, now() - interval '2 days')
  on conflict (id) do nothing;
  insert into public.goal_periods (goal_id, household_id, period_index, period_start, period_end, target_value, status, final_value, completed_at)
  values ('60000000-0000-0000-0000-000000000006', v_hh, 0, v_month_start,
    (v_month_start + interval '1 month')::date - 1, 1, 'completed', 1, now() - interval '2 days')
  on conflict do nothing;

  -- 7) Archived goal (Lutz): kept for history, out of active view.
  insert into public.goals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, measurement, target_value, unit, period_type, recurrence, start_date, status, archived_at)
  values ('60000000-0000-0000-0000-000000000007', v_hh, v_lutz, 'personal', v_lutz,
    'Fünf nachhaltige Wege pro Woche', 'sustainability', 'entry_count', 5, 'actions', 'week', 'weekly',
    v_week_start - 21, 'archived', now() - interval '5 days')
  on conflict (id) do nothing;

  -- ---- Rituals -------------------------------------------------------------
  -- Personal daily ritual (Lutz): a glass of water in the morning.
  insert into public.rituals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, ritual_type, recurrence, preferred_time, start_date, status, sort_order)
  values ('61000000-0000-0000-0000-000000000001', v_hh, v_lutz, 'personal', v_lutz,
    'Glas Wasser am Morgen', 'nutrition', 'check', 'daily', 'morning', v_today - 30, 'active', 10)
  on conflict (id) do nothing;

  -- Personal flexible ritual (René): short mobility.
  insert into public.rituals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, ritual_type, recurrence, preferred_time, start_date, status, sort_order)
  values ('61000000-0000-0000-0000-000000000002', v_hh, v_rene, 'personal', v_rene,
    'Kurze Mobility', 'movement', 'check', 'flexible', 'flexible', v_today - 20, 'active', 20)
  on conflict (id) do nothing;

  -- Shared daily ritual: care for the bird bath.
  insert into public.rituals (id, household_id, created_by, owner_type, owner_user_id, title,
    life_area, ritual_type, recurrence, preferred_time, start_date, status, sort_order)
  values ('61000000-0000-0000-0000-000000000003', v_hh, v_lutz, 'shared', null,
    'Vogeltränke prüfen', 'animal_welfare', 'shared_checkin', 'daily', 'day', v_today - 15, 'active', 30)
  on conflict (id) do nothing;

  -- Shared weekly ritual (Sunday): the joint weekly look-back.
  insert into public.rituals (id, household_id, created_by, owner_type, owner_user_id, title,
    ritual_type, recurrence, preferred_time, weekdays, start_date, status, sort_order)
  values ('61000000-0000-0000-0000-000000000004', v_hh, v_rene, 'shared', null,
    'Gemeinsamer Wochenblick', 'shared_checkin', 'weekly', 'evening', array[0]::smallint[],
    v_today - 40, 'active', 40)
  on conflict (id) do nothing;

  -- Ritual completions: today done (Lutz water), today skipped (René mobility),
  -- yesterday done (shared bird bath).
  insert into public.ritual_completions (ritual_id, household_id, user_id, occurred_on, status)
  values
    ('61000000-0000-0000-0000-000000000001', v_hh, v_lutz, v_today, 'done'),
    ('61000000-0000-0000-0000-000000000002', v_hh, v_rene, v_today, 'skipped'),
    ('61000000-0000-0000-0000-000000000003', v_hh, v_lutz, v_today - 1, 'done')
  on conflict (ritual_id, occurred_on) do nothing;

  -- ---- Check-ins (private) -------------------------------------------------
  -- Lutz morning today; René evening yesterday with a private reflection.
  insert into public.daily_check_ins (household_id, user_id, check_in_type, business_date, timezone,
    energy_level, available_time, intensity, focus, wish_text)
  values (v_hh, v_lutz, 'morning', v_today, 'Europe/Berlin', 4, 'half', 'balanced', 'movement',
    'Ruhig und aufmerksam durch den Tag.')
  on conflict (user_id, check_in_type, business_date) do nothing;

  insert into public.daily_check_ins (household_id, user_id, check_in_type, business_date, timezone,
    day_feeling, positive_moment, reflection_good, reflection_easier)
  values (v_hh, v_rene, 'evening', v_today - 1, 'Europe/Berlin', 4,
    'Schöner gemeinsamer Spaziergang.', 'Bewegung an der frischen Luft.', 'Etwas früher zur Ruhe kommen.')
  on conflict (user_id, check_in_type, business_date) do nothing;

  -- ---- Phase 5: derive rewards from the seeded entries ---------------------
  -- Rewards are NEVER seeded as raw ledger rows — they are reconciled from the
  -- real entries above so the ledgers stay the single source of truth
  -- (ADR-0035). This mirrors what the write-path RPCs do in production.
  for v_i in 0..14 loop
    perform app.reward_sync_movement(v_hh, v_today - v_i);
    perform app.reward_sync_ritual(v_hh, 'nutrition', v_today - v_i);
    perform app.reward_sync_ritual(v_hh, 'sustainability', v_today - v_i);
    perform app.reward_sync_ritual(v_hh, 'animal_welfare', v_today - v_i);
  end loop;
  perform app.reward_pending_goals(v_hh);

  -- Curated missions for the current periods (personal per member + shared).
  perform app.ensure_mission(v_hh, v_lutz, 'personal', 'day', v_today);
  perform app.ensure_mission(v_hh, v_rene, 'personal', 'day', v_today);
  perform app.ensure_mission(v_hh, null, 'shared', 'day', v_today);
  perform app.ensure_mission(v_hh, v_lutz, 'personal', 'week', v_today);
  perform app.ensure_mission(v_hh, v_rene, 'personal', 'week', v_today);
  perform app.ensure_mission(v_hh, null, 'shared', 'week', v_today);
end $$;

-- ============================================================================
-- Phase 6 · city fixtures (household A). The city row itself is created by the
-- migration backfill / first city_overview(); here we make development data
-- richer: a test city name, a city-XP boost so several regions are unlocked,
-- and two different per-user view preferences (one with an unseen unlock so the
-- calm unlock banner is visible). No real private names are used.
-- ============================================================================
do $$
declare
  v_hh   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_lutz uuid := '11111111-1111-1111-1111-111111111111';
  v_rene uuid := '22222222-2222-2222-2222-222222222222';
begin
  -- Ensure the city exists + re-derive the highest level (idempotent).
  perform app.city_ensure(v_hh);

  -- A boost of city XP so the seeded household sits around city level 3 and
  -- shows unlocked movement + nutrition quarters in development. Inserted as a
  -- single dedup-keyed ledger row so re-running the seed never double-counts.
  insert into public.experience_transactions
    (household_id, scope, amount, reason, source_kind, rule_version, business_date, dedup_key, meta)
  values
    (v_hh, 'city', 900, 'mission', 'mission', 1, current_date, 'seed:city-xp-boost:A',
     '{"note":"seed development boost"}'::jsonb)
  on conflict (dedup_key) where dedup_key is not null do nothing;

  perform app.city_ensure(v_hh);
  update public.city_states set name = 'Grünmühle' where household_id = v_hh;

  -- Lutz prefers the map and has seen every current unlock.
  insert into public.city_view_preferences (user_id, household_id, view_mode, seen_city_level)
  values (v_lutz, v_hh, 'map', app.city_current_level(v_hh))
  on conflict (user_id) do update
    set view_mode = excluded.view_mode, seen_city_level = excluded.seen_city_level;

  -- René prefers the list and has NOT yet seen the latest unlocks (banner shows).
  insert into public.city_view_preferences (user_id, household_id, view_mode, seen_city_level)
  values (v_rene, v_hh, 'list', 1)
  on conflict (user_id) do update
    set view_mode = excluded.view_mode, seen_city_level = excluded.seen_city_level;
end $$;
