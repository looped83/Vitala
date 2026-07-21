-- ============================================================================
-- Vitala · Migration 0012 · RLS for goals, rituals & check-ins (Phase 4)
-- ----------------------------------------------------------------------------
-- Deny-by-default on every new table. Household items (goals, periods, rituals,
-- completions) are readable by active members of the SAME household; all writes
-- go exclusively through the SECURITY DEFINER RPCs (ADR-0020) — no client
-- INSERT/UPDATE/DELETE grant or policy.
--
-- Check-ins are the exception: strictly PRIVATE to the owning user (ADR-0028),
-- so the partner can never read another person's energy / mood / free text
-- (spec §39.5, §49). Goal templates are global read-only reference data.
--
-- References: docs/goals-and-rituals-rls.md, docs/security-and-privacy.md.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Base privileges: read-only for clients (writes via RPC). Check-ins get no
-- extra grant here — the RLS policy is the gate; SELECT grant is added below.
-- ---------------------------------------------------------------------------
grant select on public.goals               to authenticated;
grant select on public.goal_periods        to authenticated;
grant select on public.rituals             to authenticated;
grant select on public.ritual_completions  to authenticated;
grant select on public.daily_check_ins     to authenticated;
grant select on public.goal_templates      to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere (no policy == no access).
-- ---------------------------------------------------------------------------
alter table public.goals              enable row level security;
alter table public.goal_periods       enable row level security;
alter table public.rituals            enable row level security;
alter table public.ritual_completions enable row level security;
alter table public.daily_check_ins    enable row level security;
alter table public.goal_templates     enable row level security;

-- ---------------------------------------------------------------------------
-- goals: both active members read all household goals (personal + shared) —
-- cooperative two-person product (spec §9/§10). Writes via RPC only.
-- ---------------------------------------------------------------------------
create policy goals_select on public.goals
  for select to authenticated
  using (deleted_at is null and app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- goal_periods: same household read rule (history + current period).
-- ---------------------------------------------------------------------------
create policy goal_periods_select on public.goal_periods
  for select to authenticated
  using (app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- rituals: household members read all household rituals.
-- ---------------------------------------------------------------------------
create policy rituals_select on public.rituals
  for select to authenticated
  using (deleted_at is null and app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- ritual_completions: household members read completions (shared rituals show
-- who completed, spec §28). Writes via RPC.
-- ---------------------------------------------------------------------------
create policy ritual_completions_select on public.ritual_completions
  for select to authenticated
  using (app.is_active_member(household_id));

-- ---------------------------------------------------------------------------
-- daily_check_ins: STRICTLY PRIVATE — a user reads only their own check-ins.
-- The partner never sees energy, mood or free text (ADR-0028, spec §39.5).
-- ---------------------------------------------------------------------------
create policy daily_check_ins_select on public.daily_check_ins
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- goal_templates: global read-only reference data (active rows only).
-- ---------------------------------------------------------------------------
create policy goal_templates_select on public.goal_templates
  for select to anon, authenticated
  using (is_active);
