import { describe, expect, it } from 'vitest';
import {
  calculateProgressPercent,
  isProjectComplete,
  canReceiveContribution,
  getRemainingBuildPoints,
  createContributionIdempotencyKey,
  validateContribution,
  sortContributionsByDate,
  getTotalContributedPoints,
} from './progress';
import type { ConstructionProject, ConstructionContribution } from './types';

const createMockProject = (
  overrides?: Partial<ConstructionProject>,
): ConstructionProject => ({
  id: 'proj-1',
  householdId: 'hh-1',
  buildingDefinitionId: 'gym',
  definitionVersion: 1,
  slotId: 'slot-1',
  regionId: 'movement_quarter',
  initiatedBy: 'user-1',
  status: 'in_progress',
  costSnapshot: {
    energy: 18,
    food: 2,
    nature: 3,
    community: 5,
    building_material: 16,
  },
  buildPointsRequired: 100,
  buildPointsEarned: 0,
  startedAt: '2026-07-27T10:00:00Z',
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-07-27T10:00:00Z',
  updatedAt: '2026-07-27T10:00:00Z',
  ...overrides,
});

const createMockContribution = (
  overrides?: Partial<ConstructionContribution>,
): ConstructionContribution => ({
  id: 'contrib-1',
  constructionProjectId: 'proj-1',
  householdId: 'hh-1',
  source: 'activity',
  sourceId: 'activity-1',
  points: 10,
  idempotencyKey: 'contrib:proj-1:activity-1',
  ruleVersion: 1,
  eventDate: '2026-07-27',
  createdAt: '2026-07-27T10:00:00Z',
  ...overrides,
});

describe('Build point progress tracking', () => {
  describe('calculateProgressPercent', () => {
    it('returns 100 for instant builds (0 required)', () => {
      expect(calculateProgressPercent(0, 0)).toBe(100);
    });

    it('returns 0 for new projects', () => {
      expect(calculateProgressPercent(0, 100)).toBe(0);
    });

    it('returns 50 for halfway projects', () => {
      expect(calculateProgressPercent(50, 100)).toBe(50);
    });

    it('returns 100 for completed projects', () => {
      expect(calculateProgressPercent(100, 100)).toBe(100);
    });

    it('returns 100+ if over-contributed (capped by completion)', () => {
      expect(calculateProgressPercent(150, 100)).toBe(150);
    });

    it('rounds to nearest integer', () => {
      expect(calculateProgressPercent(33, 100)).toBe(33);
      expect(calculateProgressPercent(34, 100)).toBe(34);
    });
  });

  describe('isProjectComplete', () => {
    it('returns true for completed status', () => {
      const project = createMockProject({ status: 'completed' });
      expect(isProjectComplete(project)).toBe(true);
    });

    it('returns false for in_progress with no points', () => {
      const project = createMockProject({
        status: 'in_progress',
        buildPointsEarned: 0,
        buildPointsRequired: 100,
      });
      expect(isProjectComplete(project)).toBe(false);
    });

    it('returns true when points >= required (instant build)', () => {
      const project = createMockProject({
        buildPointsEarned: 0,
        buildPointsRequired: 0,
      });
      expect(isProjectComplete(project)).toBe(true);
    });

    it('returns true when points >= required (normal build)', () => {
      const project = createMockProject({
        buildPointsEarned: 100,
        buildPointsRequired: 100,
      });
      expect(isProjectComplete(project)).toBe(true);
    });

    it('returns false when required > earned', () => {
      const project = createMockProject({
        buildPointsEarned: 50,
        buildPointsRequired: 100,
      });
      expect(isProjectComplete(project)).toBe(false);
    });
  });

  describe('canReceiveContribution', () => {
    it('returns true for prepared status', () => {
      const project = createMockProject({ status: 'prepared' });
      expect(canReceiveContribution(project)).toBe(true);
    });

    it('returns true for confirmed status', () => {
      const project = createMockProject({ status: 'confirmed' });
      expect(canReceiveContribution(project)).toBe(true);
    });

    it('returns true for in_progress status', () => {
      const project = createMockProject({ status: 'in_progress' });
      expect(canReceiveContribution(project)).toBe(true);
    });

    it('returns false for completed status', () => {
      const project = createMockProject({ status: 'completed' });
      expect(canReceiveContribution(project)).toBe(false);
    });

    it('returns false for cancelled status', () => {
      const project = createMockProject({ status: 'cancelled' });
      expect(canReceiveContribution(project)).toBe(false);
    });

    it('returns false for failed status', () => {
      const project = createMockProject({ status: 'failed' });
      expect(canReceiveContribution(project)).toBe(false);
    });
  });

  describe('getRemainingBuildPoints', () => {
    it('returns 0 for instant builds', () => {
      const project = createMockProject({
        buildPointsEarned: 0,
        buildPointsRequired: 0,
      });
      expect(getRemainingBuildPoints(project)).toBe(0);
    });

    it('returns full amount for new projects', () => {
      const project = createMockProject({
        buildPointsEarned: 0,
        buildPointsRequired: 100,
      });
      expect(getRemainingBuildPoints(project)).toBe(100);
    });

    it('returns partial amount for in-progress', () => {
      const project = createMockProject({
        buildPointsEarned: 30,
        buildPointsRequired: 100,
      });
      expect(getRemainingBuildPoints(project)).toBe(70);
    });

    it('returns 0 when points >= required', () => {
      const project = createMockProject({
        buildPointsEarned: 100,
        buildPointsRequired: 100,
      });
      expect(getRemainingBuildPoints(project)).toBe(0);
    });

    it('never returns negative', () => {
      const project = createMockProject({
        buildPointsEarned: 150,
        buildPointsRequired: 100,
      });
      expect(getRemainingBuildPoints(project)).toBe(0);
    });
  });

  describe('createContributionIdempotencyKey', () => {
    it('generates consistent keys', () => {
      const key1 = createContributionIdempotencyKey('proj-1', 'activity', 'act-1');
      const key2 = createContributionIdempotencyKey('proj-1', 'activity', 'act-1');
      expect(key1).toBe(key2);
    });

    it('includes project, source kind, and source id', () => {
      const key = createContributionIdempotencyKey('proj-1', 'activity', 'act-1');
      expect(key).toContain('proj-1');
      expect(key).toContain('activity');
      expect(key).toContain('act-1');
    });

    it('generates different keys for different inputs', () => {
      const key1 = createContributionIdempotencyKey('proj-1', 'activity', 'act-1');
      const key2 = createContributionIdempotencyKey('proj-1', 'activity', 'act-2');
      expect(key1).not.toBe(key2);
    });
  });

  describe('validateContribution', () => {
    it('rejects contributions to completed projects', () => {
      const project = createMockProject({ status: 'completed' });
      const result = validateContribution(project, 10);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('completed');
    });

    it('rejects zero or negative points', () => {
      const project = createMockProject();
      expect(validateContribution(project, 0).valid).toBe(false);
      expect(validateContribution(project, -1).valid).toBe(false);
    });

    it('rejects contributions exceeding remaining points', () => {
      const project = createMockProject({
        buildPointsEarned: 50,
        buildPointsRequired: 100,
      });
      const result = validateContribution(project, 100); // Only 50 remaining
      expect(result.valid).toBe(false);
    });

    it('accepts valid contributions', () => {
      const project = createMockProject({
        buildPointsEarned: 50,
        buildPointsRequired: 100,
      });
      const result = validateContribution(project, 25); // Within remaining 50
      expect(result.valid).toBe(true);
    });

    it('accepts exact completion contribution', () => {
      const project = createMockProject({
        buildPointsEarned: 90,
        buildPointsRequired: 100,
      });
      const result = validateContribution(project, 10);
      expect(result.valid).toBe(true);
    });
  });

  describe('sortContributionsByDate', () => {
    it('sorts by event date ascending', () => {
      const contrib1 = createMockContribution({ eventDate: '2026-07-29' });
      const contrib2 = createMockContribution({ eventDate: '2026-07-27' });
      const contrib3 = createMockContribution({ eventDate: '2026-07-28' });

      const sorted = sortContributionsByDate([contrib1, contrib2, contrib3]);
      expect(sorted).toHaveLength(3);
      expect(sorted[0]!.eventDate).toBe('2026-07-27');
      expect(sorted[1]!.eventDate).toBe('2026-07-28');
      expect(sorted[2]!.eventDate).toBe('2026-07-29');
    });

    it('does not mutate original array', () => {
      const contrib1 = createMockContribution({ eventDate: '2026-07-29' });
      const contrib2 = createMockContribution({ eventDate: '2026-07-27' });
      const original = [contrib1, contrib2];

      sortContributionsByDate(original);
      expect(original[0]!.eventDate).toBe('2026-07-29');
    });

    it('handles empty array', () => {
      const sorted = sortContributionsByDate([]);
      expect(sorted).toHaveLength(0);
    });

    it('handles single contribution', () => {
      const contrib = createMockContribution();
      const sorted = sortContributionsByDate([contrib]);
      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toBe(contrib);
    });
  });

  describe('getTotalContributedPoints', () => {
    it('returns 0 for empty contributions', () => {
      expect(getTotalContributedPoints([])).toBe(0);
    });

    it('sums single contribution', () => {
      const contrib = createMockContribution({ points: 10 });
      expect(getTotalContributedPoints([contrib])).toBe(10);
    });

    it('sums multiple contributions', () => {
      const contrib1 = createMockContribution({ points: 10 });
      const contrib2 = createMockContribution({ points: 20 });
      const contrib3 = createMockContribution({ points: 15 });
      expect(getTotalContributedPoints([contrib1, contrib2, contrib3])).toBe(45);
    });

    it('handles large amounts', () => {
      const contrib1 = createMockContribution({ points: 1000 });
      const contrib2 = createMockContribution({ points: 500 });
      expect(getTotalContributedPoints([contrib1, contrib2])).toBe(1500);
    });
  });
});
