# ADR-0020: Building System Architecture (Phase 7)

**Status**: Accepted  
**Date**: 2026-07-27  
**Context**: Phase 7 building system implementation  
**Decision Maker**: Architecture Review  

## Context

Vitala needs a building system that allows households to construct and maintain buildings that provide bonuses and effects. This requires:

1. Safe resource spending with idempotent guards
2. Atomic project lifecycle management
3. Progress tracking with build points
4. Effect application with usage limits
5. Responsive UI for project management

### Problem Statement

A naive implementation would require:
- Multiple RPC calls to create projects (risk of partial state)
- Complex client-side progress tracking
- Effect application without safeguards
- No consistency guarantees across database operations

## Decision

Implement a **three-layer architecture** with atomic RPCs, domain logic, and React Query integration:

### Layer 1: Database/RPC (PostgreSQL + Supabase)

**Atomic RPC Operations** (SECURITY DEFINER):
- `start_construction_project()`: Atomically deduct resources and create project in single transaction
- `cancel_construction_project()`: Atomically refund all resources with idempotent dedup_key
- `add_construction_contribution()`: Track build points and auto-complete at 100%
- `apply_building_effects()`: Apply effects and record limits per household/effect/period

**Guarantees**:
- All-or-nothing resource deduction (no partial builds)
- Idempotent via dedup_key to prevent double-spending
- RLS protection (SECURITY DEFINER functions validate ownership)
- Atomic multi-table updates (projects + resources + limits)

### Layer 2: Domain Logic (TypeScript)

**Three modules** separate from React/database:

1. **Progress Module** (`src/domain/buildings/progress.ts`)
   - `calculateProgressPercent(earned, required)`
   - `isProjectComplete(project)` — handles instant builds (0 required = 100%)
   - `canReceiveContribution(project)` — terminal state validation
   - `getRemainingBuildPoints(project)`
   - 38 unit tests covering edge cases

2. **Refunds Module** (`src/domain/buildings/refunds.ts`)
   - `canCancelProject(project)` — terminal state constraints
   - `validateRefundSnapshot(project, snapshot)` — verify amounts match
   - `createRefundIdempotencyKey(projectId, timestamp)`
   - 17 unit tests for cancellation flows

3. **Effects Module** (`src/domain/buildings/effects.ts`)
   - `hasLimit(effect)` — check if effect has usage restriction
   - `isLimitExceeded(effect, timesUsed)` — verify limit not surpassed
   - `getRemainingUses(effect, timesUsed)` — shortfall calculation
   - `getNextPeriodStart(period, fromDate)` — period math for day/week/month
   - `sortEffectsByType(effects)` — UI ordering
   - 34 unit tests for limit calculations

**Design Pattern**: Pure functions, immutable inputs, no side effects. All business rules in one place, testable offline.

### Layer 3: React Query Integration (`src/features/buildings/`)

**Query Hooks** (data fetching):
- `useBuildingDefinitions()` — all definitions (staleTime: Infinity)
- `useBuiltBuildings(householdId)` — household's completed buildings
- `useConstructionProjects(householdId)` — active/completed projects
- `useConstructionProject(projectId)` — single project detail
- `useProjectProgress(projectId)` — RPC call for progress
- `useRefundPreview(projectId)` — cost confirmation
- `useBuildingEffects(buildingDefinitionId)` — available effects

**Mutation Hooks** (state changes):
- `useStartConstructionProject()` — create project, invalidate projects + resources
- `useCancelConstructionProject()` — refund & cancel, invalidate progress + resources
- `useAddConstructionContribution()` — track build points, invalidate progress

**Cache Invalidation Strategy**:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['buildings', 'projects'] });
  queryClient.invalidateQueries({ queryKey: ['buildings', 'instances'] });
  queryClient.invalidateQueries({ queryKey: ['rewards', 'resources'] });
}
```

### Layer 4: UI Components (`src/features/buildings/`)

**Component Hierarchy**:
- `BuildingsPage` — page wrapper with Page + Section
  - `BuildingCatalog` — grid grouped by category
    - `BuildingCatalogItem` — building card
      - `BuildingProjectDialog` — project creation form
- `ConstructionStatus` — progress card (reusable, standalone)
  - Progress bar with percentage
  - Cancel button with error handling
  - Completion indicator (instant builds)

**Design Decisions**:
- No global building state (React Query is SSOT)
- Dialog for slot selection (city layout integration pending)
- Cost breakdown table (all 5 resources, even if 0)
- Badge tones by status (info/success/neutral)

## Tradeoffs

### Accept:
- **Database-first architecture**: RPCs are transactional source of truth, not UI
- **Three layers**: More files but clear separation of concerns
- **Idempotent dedup_key**: Slight performance cost for safety
- **Filtered/sorted in JavaScript**: Building tables not in Supabase types yet, avoid .eq() type errors via `as any`

### Reject:
- Client-side progress tracking (unreliable, no validation)
- Partial resource deduction (breaks invariants)
- Effect application in Phase 7 (moved to Phase 8)
- City slot picker in Phase 7 (manual slot IDs acceptable for skeleton)

## Consequences

**Positive**:
- ✓ Data corruption impossible (atomic transactions)
- ✓ Duplicate prevention via idempotency keys
- ✓ Business logic testable offline (89 domain unit tests)
- ✓ Easy to audit effects and limits (all queries centralized)
- ✓ Cache invalidation is predictable (React Query + specific queryKeys)
- ✓ UI is thin (24 component tests verify rendering, not logic)

**Negative**:
- More RPC functions to maintain
- Supabase type generation doesn't know building tables (requires `as any`)
- Database schema must evolve carefully (no migrations yet)
- Phase 8 will need to integrate effect application

**Future Work**:
- Migrate building tables into Supabase types after Phase 7
- Implement actual effect application in Phase 8 (resource bonuses, etc.)
- Add city slot picker (currently manual text input)
- Add project history / audit log
- Performance: Consider caching definitions indefinitely (staleTime: Infinity)

## Verification

**Test Coverage**:
- Domain logic: 89 unit tests (progress, refunds, effects)
- React hooks: 26 component/integration tests
- E2E simulation: Mocked React Query, full component lifecycle
- Build: TypeScript strict mode, all 474 tests pass

**Manual Verification**:
- [ ] Household can list buildings
- [ ] Creating project deducts resources
- [ ] Canceling project refunds all resources
- [ ] Progress bar updates as contributions arrive
- [ ] Instant builds complete immediately
- [ ] Effects show correct remaining uses

## References

- ADR-0005: Idempotency and dedup_key pattern
- ADR-0033: Ledger versioning (never rewrite history)
- Phase 7 spec: Building definitions, projects, effects
- React Query docs: Query invalidation strategies
