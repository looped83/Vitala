-- ============================================================================
-- Vitala · Migration 0021 · RLS for the city & world tables (Phase 6)
-- ----------------------------------------------------------------------------
-- Deny-by-default. Layout versions are globally readable reference data. City
-- state is SELECT-only for active household members; the per-user view
-- preference is SELECT-only for its owner. There are NO insert/update/delete
-- policies — every write goes through the SECURITY DEFINER RPCs (migration
-- 0020), so a client can never set the level, the highest level, an unlock, a
-- slot status or another household's data directly (§14/§47/§69).
--
-- References: docs/city-rls.md, docs/security-and-privacy.md, ADR-0006/0012.
-- ============================================================================

-- --- Base privileges (SELECT only; writes via RPC) -------------------------
grant select on public.city_layout_versions   to anon, authenticated;
grant select on public.city_states             to authenticated;
grant select on public.city_view_preferences   to authenticated;

-- --- Enable RLS (deny-by-default) ------------------------------------------
alter table public.city_layout_versions   enable row level security;
alter table public.city_states             enable row level security;
alter table public.city_view_preferences   enable row level security;

-- --- Reference data: global read -------------------------------------------
create policy city_layout_versions_select on public.city_layout_versions
  for select to anon, authenticated using (true);

-- --- City state: active household members only ------------------------------
create policy city_states_select on public.city_states
  for select to authenticated
  using (app.is_active_member(household_id));

-- --- View preference: own row only ------------------------------------------
create policy city_view_preferences_select on public.city_view_preferences
  for select to authenticated
  using (user_id = auth.uid());
