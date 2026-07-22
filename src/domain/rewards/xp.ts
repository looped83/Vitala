import type { LifeArea } from '@/domain/activity/areas';
import {
  AREA_PRIMARY_RESOURCE,
  CITY_XP_COUPLING,
  DAILY_XP_CAP,
  INTENSITY_FACTOR,
  MOVEMENT_DURATION_BUCKETS,
  REGENERATION_XP,
  RESOURCE_YIELD,
  RITUAL_BLOCK_XP,
  SPECIAL_ACTION_DAILY_BONUS_CAP,
  SPECIAL_ACTION_XP,
  roundHalfAwayFromZero,
  type MovementIntensity,
  type ResourceKey,
} from './constants';

/**
 * Pure XP + resource math (resources-and-xp §2/§5). Every function is
 * deterministic and side-effect-free so the client preview and the server RPC
 * compute byte-identical values from the same inputs (ADR-0005).
 */

/** Base movement XP for a duration, before type weight and intensity (§2). */
export function movementBaseXp(durationMin: number): number {
  const d = Math.max(0, Math.floor(durationMin));
  for (const bucket of MOVEMENT_DURATION_BUCKETS) {
    if (d <= bucket.maxMinutes) return bucket.base;
  }
  return MOVEMENT_DURATION_BUCKETS[MOVEMENT_DURATION_BUCKETS.length - 1]?.base ?? 0;
}

export interface MovementXpInput {
  durationMin: number;
  /** Reward weight of the activity type (strength/endurance 1.1, class 1.05, …). */
  weight: number;
  intensity: MovementIntensity | null;
  /** Regeneration is a fixed-value movement type, independent of duration. */
  isRegeneration: boolean;
}

/**
 * Raw movement XP for one entry (§2). Regeneration is a flat value; otherwise
 * `round(base × weight × intensity)`. Intensity is a small factor and can never
 * outweigh the duration bucket by construction (max 1.1×).
 */
export function movementXp(input: MovementXpInput): number {
  if (input.isRegeneration) return REGENERATION_XP;
  const base = movementBaseXp(input.durationMin);
  const intensityFactor = input.intensity ? INTENSITY_FACTOR[input.intensity] : 1;
  return roundHalfAwayFromZero(base * input.weight * intensityFactor);
}

/** Raw XP of a ritual check-in split into daily-block and special-action parts,
 *  so each can be capped against its own daily budget (§2/§9). */
export interface RitualRawXp {
  dailyXp: number;
  specialXp: number;
}

export function ritualCheckinRawXp(
  kinds: readonly ('daily_block' | 'special_action')[],
): RitualRawXp {
  let dailyXp = 0;
  let specialXp = 0;
  for (const kind of kinds) {
    if (kind === 'special_action') specialXp += SPECIAL_ACTION_XP;
    else dailyXp += RITUAL_BLOCK_XP;
  }
  return { dailyXp, specialXp };
}

/** Extra above-cap headroom a special action may use, per area (§2). */
export function specialCapForArea(area: LifeArea): number {
  return area === 'sustainability' || area === 'animal_welfare'
    ? SPECIAL_ACTION_DAILY_BONUS_CAP
    : 0;
}

export interface AreaCapInput {
  area: LifeArea;
  /** Raw daily-block / movement / nutrition XP produced by this entry. */
  rawDailyXp: number;
  /** Raw special-action XP produced by this entry (0 for movement/nutrition). */
  rawSpecialXp: number;
  /** Personal daily-block XP already awarded for (user, area, local day). */
  priorDailyXp: number;
  /** Personal special-action XP already awarded for (user, area, local day). */
  priorSpecialXp: number;
}

export interface AreaCapResult {
  dailyAwarded: number;
  specialAwarded: number;
  /** Total personal XP this entry may actually grant after caps. */
  awarded: number;
  /** True when a daily cap trimmed the raw amount (drives the neutral UI note). */
  capped: boolean;
}

/**
 * Apply per-area daily caps (§8). The entry stays fully valid regardless; only
 * XP is limited — never removed retroactively (Prinzip 2.5). Daily-block and
 * special-action budgets are independent so a special action can still add its
 * small bonus on a day whose ordinary cap is already reached.
 */
export function applyAreaCap(input: AreaCapInput): AreaCapResult {
  const dailyCap = DAILY_XP_CAP[input.area];
  const specialCap = specialCapForArea(input.area);
  const dailyRemaining = Math.max(0, dailyCap - Math.max(0, input.priorDailyXp));
  const specialRemaining = Math.max(0, specialCap - Math.max(0, input.priorSpecialXp));
  const dailyAwarded = Math.min(input.rawDailyXp, dailyRemaining);
  const specialAwarded = Math.min(input.rawSpecialXp, specialRemaining);
  const rawTotal = input.rawDailyXp + input.rawSpecialXp;
  const awarded = dailyAwarded + specialAwarded;
  return { dailyAwarded, specialAwarded, awarded, capped: awarded < rawTotal };
}

/** City XP fed by an entry's *awarded* personal XP (`round(0,5 × xp)`, §1). For
 *  shared entries the city grant is counted once for the household, not once per
 *  person — the caller dedups by group; this only does the coupling math. */
export function cityXpFor(awardedPersonalXp: number): number {
  return roundHalfAwayFromZero(CITY_XP_COUPLING * awardedPersonalXp);
}

export interface ResourceGrant {
  key: ResourceKey;
  amount: number;
}

/** Primary-resource grant for an entry (`round(xp × 0,4)`, §5.1). */
export function primaryResourceGrant(area: LifeArea, awardedPersonalXp: number): ResourceGrant {
  return {
    key: AREA_PRIMARY_RESOURCE[area],
    amount: roundHalfAwayFromZero(RESOURCE_YIELD * awardedPersonalXp),
  };
}
