import { describe, expect, it } from 'vitest';
import {
  hasLimit,
  isLimitExceeded,
  getRemainingUses,
  getNextPeriodStart,
  getPeriodEnd,
  isDateInPeriod,
  getEffectTypeLabel,
  sortEffectsByType,
  groupEffectsByType,
} from './effects';
import type { BuildingEffect } from './types';

const createMockEffect = (
  overrides?: Partial<BuildingEffect>,
): BuildingEffect => ({
  id: 'effect-1',
  type: 'mission_pool_add',
  parameters: { mission_type: 'movement_focus' },
  limit: 0,
  limitPeriod: 'none',
  label: 'Test Effect',
  ...overrides,
});

describe('Building effects system', () => {
  describe('hasLimit', () => {
    it('returns false for unlimited effects', () => {
      const effect = createMockEffect({ limit: 0, limitPeriod: 'none' });
      expect(hasLimit(effect)).toBe(false);
    });

    it('returns false when limit period is none', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'none' });
      expect(hasLimit(effect)).toBe(false);
    });

    it('returns true for daily limited effects', () => {
      const effect = createMockEffect({ limit: 1, limitPeriod: 'day' });
      expect(hasLimit(effect)).toBe(true);
    });

    it('returns true for weekly limited effects', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'week' });
      expect(hasLimit(effect)).toBe(true);
    });

    it('returns true for monthly limited effects', () => {
      const effect = createMockEffect({ limit: 5, limitPeriod: 'month' });
      expect(hasLimit(effect)).toBe(true);
    });
  });

  describe('isLimitExceeded', () => {
    it('returns false for unlimited effects', () => {
      const effect = createMockEffect({ limit: 0, limitPeriod: 'none' });
      expect(isLimitExceeded(effect, 100)).toBe(false);
    });

    it('returns false when under limit', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'week' });
      expect(isLimitExceeded(effect, 0)).toBe(false);
      expect(isLimitExceeded(effect, 1)).toBe(false);
    });

    it('returns true when at limit', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'week' });
      expect(isLimitExceeded(effect, 2)).toBe(true);
    });

    it('returns true when over limit', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'week' });
      expect(isLimitExceeded(effect, 3)).toBe(true);
    });
  });

  describe('getRemainingUses', () => {
    it('returns unlimited for effects without limits', () => {
      const effect = createMockEffect({ limit: 0, limitPeriod: 'none' });
      expect(getRemainingUses(effect, 100)).toBe(999);
    });

    it('returns full limit for new effects', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'week' });
      expect(getRemainingUses(effect, 0)).toBe(2);
    });

    it('returns partial limit for used effects', () => {
      const effect = createMockEffect({ limit: 3, limitPeriod: 'week' });
      expect(getRemainingUses(effect, 1)).toBe(2);
    });

    it('returns 0 when at or over limit', () => {
      const effect = createMockEffect({ limit: 2, limitPeriod: 'week' });
      expect(getRemainingUses(effect, 2)).toBe(0);
      expect(getRemainingUses(effect, 3)).toBe(0);
    });
  });

  describe('getNextPeriodStart', () => {
    it('returns next day for daily limit', () => {
      const today = new Date('2026-07-27');
      const next = getNextPeriodStart('day', today);
      expect(next.toISOString().split('T')[0]).toBe('2026-07-28');
    });

    it('returns next week start for weekly limit', () => {
      // Monday July 27, 2026
      const monday = new Date('2026-07-27');
      const next = getNextPeriodStart('week', monday);
      // Should be next Monday (Aug 3)
      expect(next.toISOString().split('T')[0]).toBe('2026-08-03');
    });

    it('returns first of next month for monthly limit', () => {
      const date = new Date('2026-07-27');
      const next = getNextPeriodStart('month', date);
      expect(next.toISOString().split('T')[0]).toBe('2026-08-01');
    });
  });

  describe('getPeriodEnd', () => {
    it('returns end of day for daily period', () => {
      const start = new Date('2026-07-27');
      const end = getPeriodEnd('day', start);
      expect(end.toISOString().split('T')[0]).toBe('2026-07-27');
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
    });

    it('returns end of week for weekly period', () => {
      const start = new Date('2026-07-27'); // Monday
      const end = getPeriodEnd('week', start);
      expect(end.toISOString().split('T')[0]).toBe('2026-08-02'); // Sunday
    });

    it('returns end of month for monthly period', () => {
      const start = new Date('2026-07-01');
      const end = getPeriodEnd('month', start);
      // July 31, 2026
      expect(end.toISOString().split('T')[0]).toBe('2026-07-31');
    });
  });

  describe('isDateInPeriod', () => {
    it('returns true for dates in period', () => {
      const start = new Date('2026-07-27');
      const end = new Date('2026-08-03');
      const date = new Date('2026-07-30');
      expect(isDateInPeriod(date, start, end)).toBe(true);
    });

    it('returns true for start date', () => {
      const start = new Date('2026-07-27');
      const end = new Date('2026-08-03');
      expect(isDateInPeriod(start, start, end)).toBe(true);
    });

    it('returns true for end date', () => {
      const start = new Date('2026-07-27');
      const end = new Date('2026-08-03');
      expect(isDateInPeriod(end, start, end)).toBe(true);
    });

    it('returns false for dates before period', () => {
      const start = new Date('2026-07-27');
      const end = new Date('2026-08-03');
      const date = new Date('2026-07-26');
      expect(isDateInPeriod(date, start, end)).toBe(false);
    });

    it('returns false for dates after period', () => {
      const start = new Date('2026-07-27');
      const end = new Date('2026-08-03');
      const date = new Date('2026-08-04');
      expect(isDateInPeriod(date, start, end)).toBe(false);
    });
  });

  describe('getEffectTypeLabel', () => {
    it('returns label for mission_pool_add', () => {
      expect(getEffectTypeLabel('mission_pool_add')).toBe('Mission Unlock');
    });

    it('returns label for goal_template_unlock', () => {
      expect(getEffectTypeLabel('goal_template_unlock')).toBe(
        'Goal Template Unlock',
      );
    });

    it('returns label for resource_bonus', () => {
      expect(getEffectTypeLabel('resource_bonus')).toBe('Resource Bonus');
    });

    it('returns type as fallback for unknown types', () => {
      expect(getEffectTypeLabel('unknown_type' as any)).toBe('unknown_type');
    });
  });

  describe('sortEffectsByType', () => {
    it('sorts by type precedence', () => {
      const effects = [
        createMockEffect({ id: 'e1', type: 'slot_unlock' }),
        createMockEffect({ id: 'e2', type: 'mission_pool_add' }),
        createMockEffect({ id: 'e3', type: 'resource_bonus' }),
      ];

      const sorted = sortEffectsByType(effects);
      expect(sorted[0]!.type).toBe('mission_pool_add');
      expect(sorted[1]!.type).toBe('resource_bonus');
      expect(sorted[2]!.type).toBe('slot_unlock');
    });

    it('does not mutate original array', () => {
      const effects = [
        createMockEffect({ id: 'e1', type: 'slot_unlock' }),
        createMockEffect({ id: 'e2', type: 'mission_pool_add' }),
      ];

      sortEffectsByType(effects);
      expect(effects[0]!.type).toBe('slot_unlock');
    });

    it('handles empty array', () => {
      expect(sortEffectsByType([])).toHaveLength(0);
    });
  });

  describe('groupEffectsByType', () => {
    it('groups effects by type', () => {
      const effects = [
        createMockEffect({ id: 'e1', type: 'mission_pool_add' }),
        createMockEffect({ id: 'e2', type: 'resource_bonus' }),
        createMockEffect({ id: 'e3', type: 'mission_pool_add' }),
      ];

      const grouped = groupEffectsByType(effects);
      expect(grouped.get('mission_pool_add')).toHaveLength(2);
      expect(grouped.get('resource_bonus')).toHaveLength(1);
    });

    it('returns separate groups for each type', () => {
      const effects = [
        createMockEffect({ id: 'e1', type: 'mission_pool_add' }),
        createMockEffect({ id: 'e2', type: 'resource_bonus' }),
        createMockEffect({ id: 'e3', type: 'city_xp_bonus' }),
      ];

      const grouped = groupEffectsByType(effects);
      expect(grouped.size).toBe(3);
    });

    it('handles empty array', () => {
      const grouped = groupEffectsByType([]);
      expect(grouped.size).toBe(0);
    });
  });
});
