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
