import { describe, it, expect } from 'vitest';
import { getCostForStage, getTotalCost, canAfford, remainingAfterSpend, breakdownCost } from './costs';
import { BUILDING_DEFINITIONS_V1 } from './definitions';

describe('Building costs', () => {
  describe('getCostForStage', () => {
    it('returns base costs for stage 1', () => {
      const building = BUILDING_DEFINITIONS_V1[0]!;
      const cost = getCostForStage(building, 1);
      expect(cost).toEqual(building.baseCosts);
    });

    it('all buildings have non-negative base costs', () => {
      for (const building of BUILDING_DEFINITIONS_V1) {
        const cost = getCostForStage(building, 1);
        expect(cost.energy).toBeGreaterThanOrEqual(0);
        expect(cost.food).toBeGreaterThanOrEqual(0);
        expect(cost.nature).toBeGreaterThanOrEqual(0);
        expect(cost.community).toBeGreaterThanOrEqual(0);
        expect(cost.building_material).toBeGreaterThanOrEqual(0);
      }
    });

    it('all cost components are integers', () => {
      for (const building of BUILDING_DEFINITIONS_V1) {
        const cost = getCostForStage(building, 1);
        expect(Number.isInteger(cost.energy)).toBe(true);
        expect(Number.isInteger(cost.food)).toBe(true);
        expect(Number.isInteger(cost.nature)).toBe(true);
        expect(Number.isInteger(cost.community)).toBe(true);
        expect(Number.isInteger(cost.building_material)).toBe(true);
      }
    });
  });

  describe('getTotalCost', () => {
    it('sums all resource costs', () => {
      const cost = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      expect(getTotalCost(cost)).toBe(15);
    });

    it('handles zero costs', () => {
      const cost = { energy: 0, food: 0, nature: 0, community: 0, building_material: 0 };
      expect(getTotalCost(cost)).toBe(0);
    });
  });

  describe('canAfford', () => {
    it('returns true when resources exceed cost', () => {
      const cost = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      const resources = { energy: 10, food: 10, nature: 10, community: 10, building_material: 10 };
      expect(canAfford(cost, resources)).toBe(true);
    });

    it('returns true when resources exactly match cost', () => {
      const cost = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      const resources = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      expect(canAfford(cost, resources)).toBe(true);
    });

    it('returns false when any resource is insufficient', () => {
      const cost = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      const resources = { energy: 10, food: 2, nature: 10, community: 10, building_material: 10 };
      expect(canAfford(cost, resources)).toBe(false);
    });

    it('handles zero costs', () => {
      const cost = { energy: 0, food: 0, nature: 0, community: 0, building_material: 0 };
      const resources = { energy: 0, food: 0, nature: 0, community: 0, building_material: 0 };
      expect(canAfford(cost, resources)).toBe(true);
    });
  });

  describe('remainingAfterSpend', () => {
    it('calculates remaining resources correctly', () => {
      const cost = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      const resources = { energy: 10, food: 10, nature: 10, community: 10, building_material: 10 };
      const remaining = remainingAfterSpend(cost, resources);
      expect(remaining).toEqual({
        energy: 5,
        food: 7,
        nature: 8,
        community: 9,
        building_material: 6,
      });
    });

    it('clamps to zero if insufficient', () => {
      const cost = { energy: 10, food: 10, nature: 10, community: 10, building_material: 10 };
      const resources = { energy: 5, food: 5, nature: 5, community: 5, building_material: 5 };
      const remaining = remainingAfterSpend(cost, resources);
      expect(remaining).toEqual({
        energy: 0,
        food: 0,
        nature: 0,
        community: 0,
        building_material: 0,
      });
    });
  });

  describe('breakdownCost', () => {
    it('creates cost breakdown with category', () => {
      const cost = { energy: 5, food: 3, nature: 2, community: 1, building_material: 4 };
      const breakdown = breakdownCost(cost);
      expect(breakdown.total).toBe(15);
      expect(breakdown.byResource).toEqual({
        energy: 5,
        food: 3,
        nature: 2,
        community: 1,
        building_material: 4,
      });
      expect(breakdown.category).toBe('small');
    });

    it('categorizes small costs correctly', () => {
      const cost = { energy: 3, food: 3, nature: 3, community: 3, building_material: 3 };
      expect(breakdownCost(cost).category).toBe('small');
    });

    it('categorizes medium costs correctly', () => {
      const cost = { energy: 5, food: 5, nature: 5, community: 5, building_material: 5 };
      expect(breakdownCost(cost).category).toBe('medium');
    });

    it('categorizes large costs correctly', () => {
      const cost = { energy: 10, food: 10, nature: 10, community: 10, building_material: 10 };
      expect(breakdownCost(cost).category).toBe('large');
    });
  });

  describe('V1 building costs', () => {
    it('all buildings have realistic costs', () => {
      for (const building of BUILDING_DEFINITIONS_V1) {
        const total = getTotalCost(building.baseCosts as any);
        expect(total).toBeGreaterThan(0);
        expect(total).toBeLessThanOrEqual(65); // Max large category
      }
    });

    it('every building costs at most 65 total (balancing)', () => {
      for (const building of BUILDING_DEFINITIONS_V1) {
        const total = getTotalCost(building.baseCosts as any);
        expect(total).toBeLessThanOrEqual(65);
      }
    });
  });
});
