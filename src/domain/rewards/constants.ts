import type { LifeArea } from '@/domain/activity/areas';

/**
 * Reward-system constants — the single, framework-free source of truth for the
 * optimistic client preview. The **server** re-computes the same values with the
 * identical formulas (ADR-0005); on any divergence the server wins. Every value
 * here traces back to the binding Phase-1 spec (docs/resources-and-xp.md).
 *
 * All monetary-style values (XP, resources) are non-negative integers; rounding
 * is "half away from zero" to match PostgreSQL `round()` (docs/reward-rules.md).
 */

/** Current reward rule version. Past ledger rows keep the version they were
 *  written with; a new version never rewrites history (§16, ADR-0033). */
export const CURRENT_RULE_VERSION = 1;

/** The five actively-earned resources + the derived building material
 *  (ADR-0002 / resources-and-xp §5). Building material is produced only at the
 *  weekly close, never farmed directly — so it is not part of per-entry grants. */
export const RESOURCE_KEYS = [
  'energy',
  'food',
  'nature',
  'community',
  'building_material',
] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

/** Resources a single captured entry can grant directly (§5.1). */
export const GRANTABLE_RESOURCE_KEYS = ['energy', 'food', 'nature', 'community'] as const;

/** Primary resource produced by each life area (ADR-0002 — nature is shared by
 *  sustainability + animal welfare, while the four *balance* counters stay
 *  separate). */
export const AREA_PRIMARY_RESOURCE: Record<LifeArea, ResourceKey> = {
  movement: 'energy',
  nutrition: 'food',
  sustainability: 'nature',
  animal_welfare: 'nature',
};

/** Personal XP earned per point of the source XP that flows into the city
 *  (`stadt_xp = round(0,5 × persönliche_xp) + Boni`, ADR-0003). */
export const CITY_XP_COUPLING = 0.5;

/** Fraction of an entry's *awarded* personal XP converted to its primary
 *  resource (`resource = round(xp × 0,4)`, resources-and-xp §5.1). */
export const RESOURCE_YIELD = 0.4;

/** Per-area personal-XP daily caps (resources-and-xp §2, in household-local
 *  days). Special one-off actions may add a small amount *above* the cap. */
export const DAILY_XP_CAP: Record<LifeArea, number> = {
  movement: 30,
  nutrition: 12,
  sustainability: 10,
  animal_welfare: 10,
};

/** Extra headroom above the area cap that a single special action per day may
 *  use (sustainability / animal welfare only — §2). */
export const SPECIAL_ACTION_DAILY_BONUS_CAP = 5;

/** XP for one nutrition / sustainability / animal-welfare building block (§2). */
export const RITUAL_BLOCK_XP = 2;

/** XP for one larger, one-off special action (§2, max one per day per area). */
export const SPECIAL_ACTION_XP = 5;

/** Fixed XP for a regeneration movement entry (§2 — regeneration is a movement
 *  *type*, not an intensity; max one rewarded per day). */
export const REGENERATION_XP = 6;

/** Check-in XP: a gentle nudge only. 1 XP each, capped at 2/day total (§2). */
export const CHECKIN_XP = 1;
export const CHECKIN_DAILY_XP_CAP = 2;

/** Phase-4 ritual completions: first rewarded completion of the day 2 XP, each
 *  further 1 XP, capped at 6/day (task §40 — Phase-1 is silent, documented in
 *  docs/reward-rules.md). */
export const RITUAL_FIRST_XP = 2;
export const RITUAL_FURTHER_XP = 1;
export const RITUAL_DAILY_XP_CAP = 6;

/** Community granted per person for a qualifying shared entry (§5.1), and the
 *  daily ceiling on community earned from shared entries (§38). */
export const SHARED_COMMUNITY_PER_PERSON = 2;
export const SHARED_COMMUNITY_DAILY_CAP = 3;
export const CHECKIN_COMMUNITY = 1;
export const RITUAL_SHARED_COMMUNITY = 1;
export const RITUAL_SHARED_COMMUNITY_DAILY_CAP = 2;

/** Movement base XP by duration bucket (resources-and-xp §2). Diminishing
 *  returns are baked in: beyond ~2 h the base no longer rises. */
export interface DurationBucket {
  readonly maxMinutes: number;
  readonly base: number;
}
export const MOVEMENT_DURATION_BUCKETS: readonly DurationBucket[] = [
  { maxMinutes: 10, base: 4 },
  { maxMinutes: 20, base: 6 },
  { maxMinutes: 35, base: 9 },
  { maxMinutes: 55, base: 12 },
  { maxMinutes: 80, base: 14 },
  { maxMinutes: 120, base: 15 },
  { maxMinutes: Infinity, base: 15 },
];

/** Movement intensity multipliers (§2). Intentionally a *small* influence —
 *  intensity must never outweigh the duration bucket. */
export const INTENSITY_FACTOR = {
  light: 0.95,
  medium: 1.0,
  intense: 1.1,
} as const;
export type MovementIntensity = keyof typeof INTENSITY_FACTOR;

/** Reason codes recorded on every experience/resource ledger row (data-model
 *  §16.3). Stable — used for filtering the transaction history. */
export const XP_REASONS = [
  'activity',
  'ritual',
  'checkin',
  'goal',
  'mission',
  'balance_bonus',
  'week_bonus',
  'correction',
] as const;
export type XpReason = (typeof XP_REASONS)[number];

export const RESOURCE_REASONS = [
  'grant',
  'balance_bonus',
  'week_material',
  'mission',
  'goal',
  'refund',
  'spend_build',
  'correction',
] as const;
export type ResourceReason = (typeof RESOURCE_REASONS)[number];

/** Round half away from zero — matches PostgreSQL `round(numeric)`. JS
 *  `Math.round` rounds half toward +∞, which differs for negative .5 values. */
export function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}
