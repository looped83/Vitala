-- ============================================================================
-- Vitala · Migration 0018 · RLS for the reward system (Phase 5)
-- ----------------------------------------------------------------------------
-- Every new table is deny-by-default. Reference tables (rule versions, level +
-- mission definitions) are globally readable, never client-writable. Ledgers
-- and balances are SELECT-only for household members — all writes go through
-- the SECURITY DEFINER RPCs, so ledger rows are immutable for normal users
-- (§46/§62). A member sees the shared household economy and their OWN personal
-- XP, but not the partner's individual XP rows (non-competitive, §46.1); the
-- partner's *level* is available via the status views (owner-privilege +
-- is_active_member guard).
-- ============================================================================

-- --- Base privileges (SELECT only; writes via RPC) -------------------------
grant select on public.reward_rule_versions       to anon, authenticated;
grant select on public.level_definitions           to anon, authenticated;
grant select on public.mission_definitions         to anon, authenticated;
grant select on public.experience_transactions     to authenticated;
grant select on public.resources                    to authenticated;
grant select on public.resource_transactions        to authenticated;
grant select on public.mission_assignments          to authenticated;
grant select on public.mission_completions          to authenticated;
grant select on public.mission_exchanges            to authenticated;
grant select on public.weekly_balance_snapshots     to authenticated;

-- --- Enable RLS (deny-by-default) ------------------------------------------
alter table public.reward_rule_versions       enable row level security;
alter table public.level_definitions           enable row level security;
alter table public.mission_definitions         enable row level security;
alter table public.experience_transactions     enable row level security;
alter table public.resources                    enable row level security;
alter table public.resource_transactions        enable row level security;
alter table public.mission_assignments          enable row level security;
alter table public.mission_completions          enable row level security;
alter table public.mission_exchanges            enable row level security;
alter table public.weekly_balance_snapshots     enable row level security;
alter table public.reward_processing_log        enable row level security;

-- --- Reference data: global read -------------------------------------------
create policy reward_rule_versions_select on public.reward_rule_versions
  for select to anon, authenticated using (true);

create policy level_definitions_select on public.level_definitions
  for select to anon, authenticated using (true);

create policy mission_definitions_select on public.mission_definitions
  for select to anon, authenticated using (is_active);

-- --- XP ledger: household + (own personal | city) --------------------------
create policy experience_transactions_select on public.experience_transactions
  for select to authenticated
  using (
    app.is_active_member(household_id)
    and (scope = 'city' or user_id = auth.uid())
  );

-- --- Resources: shared household pool + full history ------------------------
create policy resources_select on public.resources
  for select to authenticated
  using (app.is_active_member(household_id));

create policy resource_transactions_select on public.resource_transactions
  for select to authenticated
  using (app.is_active_member(household_id));

-- --- Missions: household shared + own personal ------------------------------
create policy mission_assignments_select on public.mission_assignments
  for select to authenticated
  using (
    app.is_active_member(household_id)
    and (scope = 'shared' or user_id = auth.uid())
  );

create policy mission_completions_select on public.mission_completions
  for select to authenticated
  using (app.is_active_member(household_id));

create policy mission_exchanges_select on public.mission_exchanges
  for select to authenticated
  using (
    app.is_active_member(household_id)
    and (scope = 'shared' or user_id = auth.uid())
  );

-- --- Balance snapshots: household read --------------------------------------
create policy weekly_balance_snapshots_select on public.weekly_balance_snapshots
  for select to authenticated
  using (app.is_active_member(household_id));

-- reward_processing_log: internal only — RLS on, no policy → no client access.
