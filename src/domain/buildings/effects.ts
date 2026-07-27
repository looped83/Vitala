/**
 * Building effects system (Phase 7, AP5).
 * Framework-free implementations for passive building bonuses and unlocks.
 */

import type { BuildingEffect } from './types';

/** Result of applying building effects. */
export interface ApplyEffectsResult {
  buildingId: string;
  effectsApplied: number;
  effectsSkipped: number;
}

/** Status of an effect's limit for today/week. */
export interface EffectLimitStatus {
  canApply: boolean;
  reason: string;
  timesUsed: number;
  timesRemaining: number;
}

/** Building effect with current limit status (for UI). */
export interface BuildingEffectWithStatus extends BuildingEffect {
  canApply: boolean;
  timesUsed: number;
  timesRemaining: number;
}

/** Effect type constants. */
export const EFFECT_TYPES = {
  MISSION_POOL_ADD: 'mission_pool_add',
  GOAL_TEMPLATE_UNLOCK: 'goal_template_unlock',
  RITUAL_TEMPLATE_UNLOCK: 'ritual_template_unlock',
  RESOURCE_BONUS: 'resource_bonus',
  CITY_XP_BONUS: 'city_xp_bonus',
  COMMUNITY_BONUS: 'community_bonus',
  SLOT_UNLOCK: 'slot_unlock',
} as const;

export type EffectType = (typeof EFFECT_TYPES)[keyof typeof EFFECT_TYPES];

/** Limit period types. */
export const LIMIT_PERIODS = {
  NONE: 'none',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export type LimitPeriod = (typeof LIMIT_PERIODS)[keyof typeof LIMIT_PERIODS];

/**
 * Check if an effect has a usage limit (daily/weekly/monthly).
 */
export function hasLimit(effect: BuildingEffect): boolean {
  return effect.limitPeriod !== 'none' && effect.limit > 0;
}

/**
 * Check if an effect's limit has been exceeded.
 */
export function isLimitExceeded(
  effect: BuildingEffect,
  timesUsed: number,
): boolean {
  if (!hasLimit(effect)) {
    return false;
  }
  return timesUsed >= effect.limit;
}

/**
 * Get remaining uses for an effect in the current period.
 */
export function getRemainingUses(
  effect: BuildingEffect,
  timesUsed: number,
): number {
  if (!hasLimit(effect)) {
    return 999; // Unlimited
  }
  return Math.max(0, effect.limit - timesUsed);
}

/**
 * Get next period start date for a limit period.
 */
export function getNextPeriodStart(
  period: LimitPeriod,
  fromDate: Date = new Date(),
): Date {
  const date = new Date(fromDate);
  switch (period) {
    case 'day':
      date.setDate(date.getDate() + 1);
      date.setHours(0, 0, 0, 0);
      return date;

    case 'week':
      // Next Sunday
      const dayOfWeek = date.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
      date.setDate(date.getDate() + daysUntilSunday + 1);
      date.setHours(0, 0, 0, 0);
      return date;

    case 'month':
      // First day of next month
      date.setMonth(date.getMonth() + 1);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date;

    default:
      return date;
  }
}

/**
 * Get period end date for a limit period.
 */
export function getPeriodEnd(
  period: LimitPeriod,
  periodStart: Date,
): Date {
  const end = new Date(periodStart);
  switch (period) {
    case 'day':
      end.setHours(23, 59, 59, 999);
      return end;

    case 'week':
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return end;

    case 'month':
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      return end;

    default:
      return end;
  }
}

/**
 * Check if a date is within a period.
 */
export function isDateInPeriod(
  date: Date,
  periodStart: Date,
  periodEnd: Date,
): boolean {
  return date >= periodStart && date <= periodEnd;
}

/**
 * Get display label for an effect type.
 */
export function getEffectTypeLabel(effectType: EffectType): string {
  const labels: Record<EffectType, string> = {
    mission_pool_add: 'Mission Unlock',
    goal_template_unlock: 'Goal Template Unlock',
    ritual_template_unlock: 'Ritual Template Unlock',
    resource_bonus: 'Resource Bonus',
    city_xp_bonus: 'City XP Bonus',
    community_bonus: 'Community Bonus',
    slot_unlock: 'Building Slot Unlock',
  };
  return labels[effectType] || effectType;
}

/**
 * Sort effects by type (for consistent UI ordering).
 */
export function sortEffectsByType(
  effects: readonly BuildingEffect[],
): BuildingEffect[] {
  const typeOrder = [
    'mission_pool_add',
    'goal_template_unlock',
    'ritual_template_unlock',
    'resource_bonus',
    'city_xp_bonus',
    'community_bonus',
    'slot_unlock',
  ];

  return [...effects].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.type);
    const bIndex = typeOrder.indexOf(b.type);
    return aIndex - bIndex;
  });
}

/**
 * Group effects by type for display.
 */
export function groupEffectsByType(
  effects: readonly BuildingEffect[],
): Map<EffectType, BuildingEffect[]> {
  const grouped = new Map<EffectType, BuildingEffect[]>();

  for (const effect of effects) {
    if (!grouped.has(effect.type as EffectType)) {
      grouped.set(effect.type as EffectType, []);
    }
    grouped.get(effect.type as EffectType)!.push(effect);
  }

  return grouped;
}
