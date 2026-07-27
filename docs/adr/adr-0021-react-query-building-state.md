# ADR-0021: React Query Strategy for Building System State

**Status**: Accepted  
**Date**: 2026-07-27  
**Context**: Building system state management approach  
**Decision Maker**: Architecture Review  

## Problem

Building state involves:
- Multiple entities (definitions, projects, instances, effects, limits)
- Mutations that affect multiple entities (create project → deduct resources)
- Temporal consistency (instant builds must show immediately)
- Household isolation (one household can't see another's buildings)

How do we ensure state consistency without a global store?

## Decision

**React Query as SSOT** with explicit cache invalidation patterns.

### Query Organization

All building queries use compound queryKeys with household/project scope:

```typescript
['buildings', 'definitions']                    // All definitions (never changes)
['buildings', 'instances', householdId]         // Built buildings for this household
['buildings', 'projects', householdId]          // Active/completed projects for household
['buildings', 'project', projectId]             // Single project detail
['buildings', 'progress', projectId]            // Progress via RPC
['buildings', 'refund_preview', projectId]      // Refund preview via RPC
['buildings', 'effects', buildingDefinitionId]  // Effects for building
```

### Invalidation Strategy

**On Project Creation**:
```typescript
queryClient.invalidateQueries({ queryKey: ['buildings', 'projects'] });      // Projects list
queryClient.invalidateQueries({ queryKey: ['buildings', 'instances'] });     // Built count
queryClient.invalidateQueries({ queryKey: ['rewards', 'resources'] });       // Balance changed
```

**On Project Cancellation**:
```typescript
queryClient.invalidateQueries({ queryKey: ['buildings', 'projects'] });      // Status changed
queryClient.invalidateQueries({ queryKey: ['buildings', 'progress'] });      // No longer needed
queryClient.invalidateQueries({ queryKey: ['rewards', 'resources'] });       // Refunded
```

**On Build Point Addition**:
```typescript
queryClient.invalidateQueries({
  queryKey: ['buildings', 'progress', data.project_id],  // Just this project
});
queryClient.invalidateQueries({
  queryKey: ['buildings', 'project', data.project_id],   // Just this project
});
```

### Why This Approach?

**Explicit over implicit**:
- Each mutation knows exactly what changed
- Easy to audit cache behavior
- No silent stale states

**Scoped invalidation**:
- `['buildings', 'projects', householdId]` only invalidates this household's list
- `['buildings', 'progress', projectId]` only affects this project's progress
- Other households' queries never invalidated

**Household isolation**:
- Server enforces RLS (no cross-household queries)
- Client-side queryKey structure reinforces isolation
- Every query includes `householdId` or equivalent

### Queries by Stale Time

```typescript
useBuildingDefinitions()
  → staleTime: Infinity       // Definitions never change in Phase 7
  → Manual refetch only when definitions uploaded

useBuiltBuildings(householdId)
  → staleTime: 0 (default)    // Fetched fresh on mount, cached after
  → Invalidated on project creation/completion
  → Revalidated in background (user sees new count immediately)

useConstructionProjects(householdId)
  → staleTime: 0              // Always fresh on mount
  → Invalidated on create/cancel
  → Shows list as mutations complete

useProjectProgress(projectId)
  → staleTime: 0              // Always fresh on mount
  → Invalidated on contribution
  → Polling would be added in Phase 8 (every 30s if incomplete)

useBuildingEffects(buildingDefinitionId)
  → staleTime: 0              // Fetch fresh per building
  → Invalidated if effects uploaded
  → No invalidation from project mutations
```

## Optimization Considerations

**For Phase 7 (Skeleton)**:
- Simple refresh strategy is acceptable
- RPC calls are lightweight
- No polling (instant completion in Phase 7)

**For Phase 8+ (Real Time)**:
- Add `setInterval` to poll `useProjectProgress` if project not complete
- Debounce progress updates (don't refetch every 100ms)
- Consider WebSocket for real-time progress (future)

## Avoiding Common Pitfalls

### ❌ Don't: Invalidate entire cache
```typescript
// WRONG: Too broad
queryClient.invalidateQueries()  // Clears everything
queryClient.clear()              // Nuclear option
```

### ✓ Do: Target specific queries
```typescript
// RIGHT: Specific scope
queryClient.invalidateQueries({ queryKey: ['buildings', 'projects', householdId] });
```

### ❌ Don't: Mix household isolation
```typescript
// WRONG: Same project across households visible
['buildings', 'project', projectId]  // No householdId!
```

### ✓ Do: Include household when needed
```typescript
// RIGHT for multi-household contexts
['buildings', 'project', householdId, projectId]
```

### ❌ Don't: Cache user-specific progress
```typescript
// WRONG: Stale after mutation
staleTime: 60000  // Never invalidated, user sees old %
```

### ✓ Do: Invalidate on mutations
```typescript
// RIGHT: Always fresh after mutation
staleTime: 0      // Plus explicit invalidateQueries on success
```

## Verification Checklist

- [ ] No cross-household leakage in queryKeys
- [ ] All mutations invalidate affected queries
- [ ] Definitions have Infinity stale time (don't change)
- [ ] Household-scoped queries include householdId
- [ ] Test: Create project → list updates
- [ ] Test: Cancel project → refund appears in balance
- [ ] Test: Progress arrives → card updates
- [ ] Test: Effects loaded → correct remaining count

## References

- TanStack Query docs: Query Invalidation
- React Query Examples: useQueryClient, invalidateQueries
- ADR-0020: Building System Architecture (RPC layer)
- ADR-0005: Idempotency Pattern (prevents duplicate mutations)
