import { describe, expect, it } from 'vitest';
import {
  canCancelProject,
  getTotalRefund,
  validateRefundSnapshot,
  createRefundIdempotencyKey,
} from './refunds';
import type { ConstructionProject } from './types';

const createMockProject = (
  overrides?: Partial<ConstructionProject>,
): ConstructionProject => ({
  id: 'proj-1',
  householdId: 'hh-1',
  buildingDefinitionId: 'training_room',
  definitionVersion: 1,
  slotId: 'slot-1',
  regionId: 'movement_quarter',
  initiatedBy: 'user-1',
  status: 'confirmed',
  costSnapshot: {
    energy: 12,
    food: 0,
    nature: 2,
    community: 3,
    building_material: 8,
  },
  buildPointsRequired: 0,
  buildPointsEarned: 0,
  startedAt: '2026-07-27T10:00:00Z',
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-07-27T10:00:00Z',
  updatedAt: '2026-07-27T10:00:00Z',
  ...overrides,
});

describe('Refund logic', () => {
  describe('canCancelProject', () => {
    it('returns true for prepared projects', () => {
      const project = createMockProject({ status: 'prepared' });
      expect(canCancelProject(project)).toBe(true);
    });

    it('returns true for confirmed projects', () => {
      const project = createMockProject({ status: 'confirmed' });
      expect(canCancelProject(project)).toBe(true);
    });

    it('returns true for in_progress projects', () => {
      const project = createMockProject({ status: 'in_progress' });
      expect(canCancelProject(project)).toBe(true);
    });

    it('returns false for completed projects', () => {
      const project = createMockProject({ status: 'completed' });
      expect(canCancelProject(project)).toBe(false);
    });

    it('returns false for already cancelled projects', () => {
      const project = createMockProject({ status: 'cancelled' });
      expect(canCancelProject(project)).toBe(false);
    });

    it('returns false for failed projects', () => {
      const project = createMockProject({ status: 'failed' });
      expect(canCancelProject(project)).toBe(false);
    });
  });

  describe('getTotalRefund', () => {
    it('sums all resource amounts', () => {
      const resources = {
        energy: 12,
        food: 0,
        nature: 2,
        community: 3,
        building_material: 8,
      };
      expect(getTotalRefund(resources)).toBe(25);
    });

    it('handles zero amounts', () => {
      const resources = {
        energy: 0,
        food: 0,
        nature: 0,
        community: 0,
        building_material: 0,
      };
      expect(getTotalRefund(resources)).toBe(0);
    });

    it('handles large amounts', () => {
      const resources = {
        energy: 50,
        food: 45,
        nature: 40,
        community: 35,
        building_material: 60,
      };
      expect(getTotalRefund(resources)).toBe(230);
    });
  });

  describe('validateRefundSnapshot', () => {
    it('returns true when refund matches project costs', () => {
      const project = createMockProject();
      const refund = project.costSnapshot;
      expect(validateRefundSnapshot(project, refund)).toBe(true);
    });

    it('returns false when energy differs', () => {
      const project = createMockProject();
      const refund = { ...project.costSnapshot, energy: 10 };
      expect(validateRefundSnapshot(project, refund)).toBe(false);
    });

    it('returns false when any resource differs', () => {
      const project = createMockProject();
      const refund = { ...project.costSnapshot, community: 5 };
      expect(validateRefundSnapshot(project, refund)).toBe(false);
    });

    it('returns true when all zero (no refund needed)', () => {
      const project = createMockProject({
        costSnapshot: {
          energy: 0,
          food: 0,
          nature: 0,
          community: 0,
          building_material: 0,
        },
      });
      const refund = project.costSnapshot;
      expect(validateRefundSnapshot(project, refund)).toBe(true);
    });
  });

  describe('createRefundIdempotencyKey', () => {
    it('generates consistent keys for same inputs', () => {
      const projectId = 'proj-123';
      const timestamp = '2026-07-27T10:00:00Z';
      const key1 = createRefundIdempotencyKey(projectId, timestamp);
      const key2 = createRefundIdempotencyKey(projectId, timestamp);
      expect(key1).toBe(key2);
    });

    it('includes project ID and timestamp', () => {
      const key = createRefundIdempotencyKey('proj-abc', '2026-07-27T10:00:00Z');
      expect(key).toContain('proj-abc');
      expect(key).toContain('2026-07-27T10:00:00Z');
    });

    it('generates different keys for different project IDs', () => {
      const timestamp = '2026-07-27T10:00:00Z';
      const key1 = createRefundIdempotencyKey('proj-1', timestamp);
      const key2 = createRefundIdempotencyKey('proj-2', timestamp);
      expect(key1).not.toBe(key2);
    });

    it('generates different keys for different timestamps', () => {
      const projectId = 'proj-1';
      const key1 = createRefundIdempotencyKey(projectId, '2026-07-27T10:00:00Z');
      const key2 = createRefundIdempotencyKey(projectId, '2026-07-27T11:00:00Z');
      expect(key1).not.toBe(key2);
    });
  });
});
