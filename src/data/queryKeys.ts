/**
 * Central, hierarchical TanStack Query key factory (technical-architecture
 * §15.1). Keys are hierarchical so mutations can invalidate precise subtrees
 * instead of the whole cache (performance §21). Only Phase-2 keys exist here;
 * later features extend the tree.
 */
export const queryKeys = {
  session: ['session'] as const,

  profile: {
    all: ['profile'] as const,
    me: () => ['profile', 'me'] as const,
    byId: (userId: string) => ['profile', 'by-id', userId] as const,
  },

  preferences: {
    all: ['preferences'] as const,
    me: () => ['preferences', 'me'] as const,
  },

  household: {
    all: ['household'] as const,
    current: () => ['household', 'current'] as const,
    members: (householdId: string) => ['household', householdId, 'members'] as const,
    settings: (householdId: string) => ['household', householdId, 'settings'] as const,
    invites: (householdId: string) => ['household', householdId, 'invites'] as const,
  },

  onboarding: {
    state: () => ['onboarding', 'state'] as const,
  },
} as const;
