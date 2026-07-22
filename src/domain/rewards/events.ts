import type { LifeArea } from '@/domain/activity/areas';
import { AREA_PRIMARY_RESOURCE } from './constants';
import type { ResourceGrant } from './xp';

/**
 * Fixed reward values for milestone events — goals, rituals, check-ins and
 * missions (§34, §39, §40). These are grants layered on top of the per-entry
 * XP economy; the underlying entries still earn their own XP once (§8.6 — no
 * double counting in the XP sense, only an additional defined bonus).
 */

export interface MilestoneReward {
  personalXp: number;
  cityXp: number;
  resources: ResourceGrant[];
}

function primary(area: LifeArea, amount: number): ResourceGrant {
  return { key: AREA_PRIMARY_RESOURCE[area], amount };
}

// --- Missions (§34) --------------------------------------------------------

export type MissionScope = 'personal' | 'shared';
export type MissionPeriod = 'day' | 'week';

/** Reward for completing a mission, per participant (§34). Shared missions add
 *  community; the caller grants city XP + resources once for the household. */
export function missionReward(
  scope: MissionScope,
  period: MissionPeriod,
  area: LifeArea,
): MilestoneReward {
  if (period === 'week') {
    return scope === 'shared'
      ? { personalXp: 15, cityXp: 30, resources: [primary(area, 3), { key: 'community', amount: 2 }] }
      : { personalXp: 20, cityXp: 10, resources: [primary(area, 2)] };
  }
  return scope === 'shared'
    ? { personalXp: 6, cityXp: 10, resources: [primary(area, 1), { key: 'community', amount: 1 }] }
    : { personalXp: 8, cityXp: 4, resources: [primary(area, 1)] };
}

/** Daily / weekly ceilings on personal mission-bonus XP per user (§34). */
export const MISSION_PERSONAL_XP_DAILY_CAP = 12;
export const MISSION_PERSONAL_XP_WEEKLY_CAP = 30;

// --- Goals (§39) -----------------------------------------------------------

/** Reward for completing a goal period, per participant. Shared goals add
 *  community; recurring goals reward once per completed period (§39). */
export function goalReward(scope: MissionScope, area: LifeArea): MilestoneReward {
  return scope === 'shared'
    ? { personalXp: 10, cityXp: 20, resources: [primary(area, 2), { key: 'community', amount: 2 }] }
    : { personalXp: 15, cityXp: 8, resources: [primary(area, 2)] };
}

// --- Rituals & check-ins (§40) ---------------------------------------------

/** Personal XP for a ritual completion given how many were already rewarded
 *  today (first 2 XP, further 1 XP, capped at 6/day). */
export function ritualCompletionXp(alreadyRewardedToday: number, alreadyXpToday: number): number {
  if (alreadyXpToday >= 6) return 0;
  const base = alreadyRewardedToday === 0 ? 2 : 1;
  return Math.min(base, 6 - alreadyXpToday);
}

/** Check-in XP: 1 each, capped 2/day (a gentle nudge, never a strong driver). */
export function checkinXp(alreadyXpToday: number): number {
  return Math.min(1, Math.max(0, 2 - alreadyXpToday));
}
