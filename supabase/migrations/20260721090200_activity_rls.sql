-- ============================================================================
-- Vitala · Migration 0006 · RLS for activity & ritual capture
-- ----------------------------------------------------------------------------
-- Reference catalogs are globally readable, never client-writable. Household
-- entries are readable by active members of the SAME household only; all writes
-- go exclusively through the SECURITY DEFINER RPCs in the next migration
-- (ADR-0020) — so no INSERT/UPDATE/DELETE grant or policy is given to clients.
--
-- References: docs/activity-rls.md, ADR-0012, data-model §16.10.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Base privileges. Read-only for household entry tables (writes via RPC).
-- Reference catalogs: SELECT to anon+authenticated (public config, no PII).
-- ---------------------------------------------------------------------------
grant select on public.activity_types      to anon, authenticated;
grant select on public.ritual_definitions  to anon, authenticated;
grant select on public.activities          to authenticated;
grant select on public.ritual_entries      to authenticated;
grant select on public.entry_participants  to authenticated;
grant select on public.entry_favorites     to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS (deny-by-default).
-- ---------------------------------------------------------------------------
alter table public.activity_types      enable row level security;
alter table public.ritual_definitions  enable row level security;
alter table public.activities          enable row level security;
alter table public.ritual_entries      enable row level security;
alter table public.entry_participants  enable row level security;
alter table public.entry_favorites     enable row level security;

-- ---------------------------------------------------------------------------
-- Reference catalogs: readable by everyone (incl. anon for the login/offline
-- shell); only active rows are exposed to clients. No write policy.
-- ---------------------------------------------------------------------------
create policy activity_types_select on public.activity_types
  for select to anon, authenticated
  using (is_active);

create policy ritual_definitions_select on public.ritual_definitions
  for select to anon, authenticated
  using (is_active);

-- ---------------------------------------------------------------------------
-- activities: active members read their own household's LIVE entries.
-- Soft-deleted rows are hidden here (extra safety on top of query filters).
-- ---------------------------------------------------------------------------
create policy activities_select on public.activities
  for select to authenticated
  using (deleted_at is null and app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- ritual_entries: same household read rule.
-- ---------------------------------------------------------------------------
create policy ritual_entries_select on public.ritual_entries
  for select to authenticated
  using (deleted_at is null and app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- entry_participants: readable by active members of the participant's household.
-- ---------------------------------------------------------------------------
create policy entry_participants_select on public.entry_participants
  for select to authenticated
  using (app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- entry_favorites: household members read shared favourites + their own.
-- ---------------------------------------------------------------------------
create policy entry_favorites_select on public.entry_favorites
  for select to authenticated
  using (
    app.is_active_member(household_id)
    and (owner_user_id is null or owner_user_id = auth.uid())
  );
