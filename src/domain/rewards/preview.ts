import type { LifeArea } from '@/domain/activity/areas';
import { SHARED_COMMUNITY_PER_PERSON, type MovementIntensity, type ResourceKey } from './constants';
import {
  applyAreaCap,
  cityXpFor,
  movementXp,
  primaryResourceGrant,
  ritualCheckinRawXp,
  type ResourceGrant,
} from './xp';

/**
 * Optimistic reward preview (§54/§57). Composes the per-entry breakdown a user
 * can *expect* — clearly a preview; the server value is authoritative (ADR-0005).
 * The same math backs the "Erhalten"-Anzeige after saving.
 */

export interface RewardBreakdown {
  area: LifeArea;
  /** This person's personal XP after daily caps. */
  personalXp: number;
  /** City XP for the household (counted once for a shared entry). */
  cityXp: number;
  resources: ResourceGrant[];
  /** A daily cap trimmed the XP — surfaced as a neutral note. */
  capped: boolean;
  /** A shared entry added the community bonus. */
  sharedBonus: boolean;
}

/** Merge grants of the same resource, dropping zero amounts. */
export function mergeResources(grants: ResourceGrant[]): ResourceGrant[] {
  const totals = new Map<ResourceKey, number>();
  for (const g of grants) {
    if (g.amount === 0) continue;
    totals.set(g.key, (totals.get(g.key) ?? 0) + g.amount);
  }
  return [...totals.entries()].map(([key, amount]) => ({ key, amount }));
}

export interface MovementPreviewInput {
  durationMin: number;
  weight: number;
  intensity: MovementIntensity | null;
  isRegeneration: boolean;
  isShared: boolean;
  priorDailyXp: number;
  sharedCommunityRemaining?: number;
}

export function previewMovementReward(input: MovementPreviewInput): RewardBreakdown {
  const raw = movementXp({
    durationMin: input.durationMin,
    weight: input.weight,
    intensity: input.intensity,
    isRegeneration: input.isRegeneration,
  });
  const cap = applyAreaCap({
    area: 'movement',
    rawDailyXp: raw,
    rawSpecialXp: 0,
    priorDailyXp: input.priorDailyXp,
    priorSpecialXp: 0,
  });
  return composeEntryReward('movement', cap.awarded, cap.capped, input.isShared, input.sharedCommunityRemaining);
}

export interface RitualPreviewInput {
  area: Exclude<LifeArea, 'movement'>;
  kinds: readonly ('daily_block' | 'special_action')[];
  isShared: boolean;
  priorDailyXp: number;
  priorSpecialXp: number;
  sharedCommunityRemaining?: number;
}

export function previewRitualReward(input: RitualPreviewInput): RewardBreakdown {
  const raw = ritualCheckinRawXp(input.kinds);
  const cap = applyAreaCap({
    area: input.area,
    rawDailyXp: raw.dailyXp,
    rawSpecialXp: raw.specialXp,
    priorDailyXp: input.priorDailyXp,
    priorSpecialXp: input.priorSpecialXp,
  });
  return composeEntryReward(input.area, cap.awarded, cap.capped, input.isShared, input.sharedCommunityRemaining);
}

function composeEntryReward(
  area: LifeArea,
  awardedXp: number,
  capped: boolean,
  isShared: boolean,
  sharedCommunityRemaining = SHARED_COMMUNITY_PER_PERSON,
): RewardBreakdown {
  const resources: ResourceGrant[] = [primaryResourceGrant(area, awardedXp)];
  let sharedBonus = false;
  if (isShared) {
    const community = Math.max(0, Math.min(SHARED_COMMUNITY_PER_PERSON, sharedCommunityRemaining));
    if (community > 0) {
      resources.push({ key: 'community', amount: community });
      sharedBonus = true;
    }
  }
  return {
    area,
    personalXp: awardedXp,
    cityXp: cityXpFor(awardedXp),
    resources: mergeResources(resources),
    capped,
    sharedBonus,
  };
}

/** A breakdown that grants nothing — the target of a deletion correction (§42). */
export function zeroReward(area: LifeArea): RewardBreakdown {
  return { area, personalXp: 0, cityXp: 0, resources: [], capped: false, sharedBonus: false };
}

/** Diff two breakdowns into the signed correction applied after an edit (§41).
 *  Deletion is `rewardDelta(previous, zeroReward(area))`. */
export function rewardDelta(previous: RewardBreakdown, next: RewardBreakdown): {
  personalXp: number;
  cityXp: number;
  resources: ResourceGrant[];
} {
  const byKey = new Map<ResourceKey, number>();
  for (const g of next.resources) byKey.set(g.key, (byKey.get(g.key) ?? 0) + g.amount);
  for (const g of previous.resources) byKey.set(g.key, (byKey.get(g.key) ?? 0) - g.amount);
  return {
    personalXp: next.personalXp - previous.personalXp,
    cityXp: next.cityXp - previous.cityXp,
    resources: [...byKey.entries()]
      .filter(([, amount]) => amount !== 0)
      .map(([key, amount]) => ({ key, amount })),
  };
}
