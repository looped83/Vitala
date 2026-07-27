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

  /** Reference catalogs (activity types + ritual definitions). Long-lived. */
  catalog: {
    all: ['catalog'] as const,
    activityTypes: () => ['catalog', 'activity-types'] as const,
    ritualDefinitions: () => ['catalog', 'ritual-definitions'] as const,
  },

  /** Captured entries, scoped by household so switching never leaks. */
  entries: {
    all: ['entries'] as const,
    history: (householdId: string) => ['entries', householdId, 'history'] as const,
    recent: (householdId: string) => ['entries', householdId, 'recent'] as const,
    detail: (householdId: string, kind: string, id: string) =>
      ['entries', householdId, 'detail', kind, id] as const,
  },

  favorites: {
    all: ['favorites'] as const,
    list: (householdId: string) => ['favorites', householdId] as const,
  },

  /** Goals, scoped by household (spec §43). Precise subtrees for invalidation. */
  goals: {
    all: ['goals'] as const,
    templates: () => ['goals', 'templates'] as const,
    overview: (householdId: string) => ['goals', householdId, 'overview'] as const,
    detail: (householdId: string, goalId: string) =>
      ['goals', householdId, 'detail', goalId] as const,
    periods: (householdId: string, goalId: string) =>
      ['goals', householdId, 'periods', goalId] as const,
  },

  /** Rituals + completions, scoped by household. */
  rituals: {
    all: ['rituals'] as const,
    list: (householdId: string) => ['rituals', householdId, 'list'] as const,
    day: (householdId: string, date: string) => ['rituals', householdId, 'day', date] as const,
    completions: (householdId: string, from: string, to: string) =>
      ['rituals', householdId, 'completions', from, to] as const,
  },

  /** Private per-user daily check-ins (never shared across the household). */
  checkins: {
    all: ['checkins'] as const,
    day: (userId: string, date: string) => ['checkins', userId, 'day', date] as const,
    range: (userId: string, from: string, to: string) =>
      ['checkins', userId, 'range', from, to] as const,
  },

  /** Today overview + factual reviews, keyed by stable local-date windows. */
  today: {
    all: ['today'] as const,
    overview: (householdId: string, date: string) => ['today', householdId, date] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    window: (householdId: string, scope: string, from: string, to: string) =>
      ['reviews', householdId, scope, from, to] as const,
  },

  /**
   * Reward system (Phase 5), scoped by household. Precise subtrees so a capture
   * mutation invalidates only what changed (performance §64) — never the whole
   * cache. `personalStatus` is per user; the rest are household-shared.
   */
  rewards: {
    all: ['rewards'] as const,
    personalStatus: (householdId: string, userId: string) =>
      ['rewards', householdId, 'personal-status', userId] as const,
    cityStatus: (householdId: string) => ['rewards', householdId, 'city-status'] as const,
    resources: (householdId: string) => ['rewards', householdId, 'resources'] as const,
    xpHistory: (householdId: string) => ['rewards', householdId, 'xp-history'] as const,
    resourceHistory: (householdId: string) => ['rewards', householdId, 'resource-history'] as const,
    balance: (householdId: string, weekStart: string) =>
      ['rewards', householdId, 'balance', weekStart] as const,
  },

  /** Curated missions, scoped by household. The board carries live progress. */
  missions: {
    all: ['missions'] as const,
    board: (householdId: string) => ['missions', householdId, 'board'] as const,
  },

  /**
   * City & world (Phase 6). The overview carries household state (name, level,
   * highest level) + the caller's view preference. Static layout definitions
   * live in TypeScript (ADR-0039) and need no query. Invalidated precisely when
   * the city level or a preference changes (performance §52).
   */
  city: {
    all: ['city'] as const,
    overview: (householdId: string) => ['city', householdId, 'overview'] as const,
  },
} as const;
