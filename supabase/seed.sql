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
