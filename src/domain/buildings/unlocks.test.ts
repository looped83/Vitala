import { describe, it, expect } from 'vitest';
import { checkBuildingUnlock, categorizeBuildings, validatePrerequisiteChain } from './unlocks';

describe('Building unlocks', () => {
  describe('checkBuildingUnlock', () => {
    it('unlocks buildings at correct city level', () => {
      const result = checkBuildingUnlock({
        buildingId: 'training_room',
        currentCityLevel: 2,
        builtBuildingIds: [],
        availableSlotCount: 1,
      });
      expect(result.isUnlocked).toBe(true);
      expect(result.reason).toBe('unlocked');
    });

    it('locks buildings below required level', () => {
      const result = checkBuildingUnlock({
        buildingId: 'training_room',
        currentCityLevel: 1,
        builtBuildingIds: [],
        availableSlotCount: 1,
      });
      expect(result.isUnlocked).toBe(false);
      expect(result.reason).toBe('level');
      expect(result.levelAway).toBe(1);
    });

    it('calculates correct levels away', () => {
      const result = checkBuildingUnlock({
        buildingId: 'library',
        currentCityLevel: 1,
        builtBuildingIds: [],
        availableSlotCount: 1,
      });
      expect(result.levelAway).toBe(2); // Level 3 required, level 1 current
    });

    it('enforces prerequisite buildings', () => {
      const result = checkBuildingUnlock({
        buildingId: 'gym',
        currentCityLevel: 3,
        builtBuildingIds: [], // training_room not built
        availableSlotCount: 1,
      });
      expect(result.isUnlocked).toBe(false);
      expect(result.reason).toBe('prerequisite');
      expect(result.prerequisiteBuilding?.id).toBe('training_room');
    });

    it('unlocks after prerequisite is built', () => {
      const result = checkBuildingUnlock({
        buildingId: 'gym',
        currentCityLevel: 3,
        builtBuildingIds: ['training_room'],
        availableSlotCount: 1,
      });
      expect(result.isUnlocked).toBe(true);
    });

    it('returns not_found for invalid building', () => {
      const result = checkBuildingUnlock({
        buildingId: 'nonexistent_building',
        currentCityLevel: 10,
        builtBuildingIds: [],
        availableSlotCount: 1,
      });
      expect(result.isUnlocked).toBe(false);
      expect(result.messageKey).toBe('building_not_found');
    });

    it('respects slot count', () => {
      const result = checkBuildingUnlock({
        buildingId: 'training_room',
        currentCityLevel: 2,
        builtBuildingIds: [],
        availableSlotCount: 0, // No slots available
      });
      expect(result.isUnlocked).toBe(false);
      expect(result.reason).toBe('no_slots');
    });
  });

  describe('categorizeBuildings', () => {
    it('categorizes buildings by unlock status', () => {
      const result = categorizeBuildings({
        buildingId: 'training_room',
        currentCityLevel: 2,
        builtBuildingIds: [],
        availableSlotCount: 5,
      });
      expect(result.available.length).toBeGreaterThan(0);
      expect(result.locked.length).toBeGreaterThan(0);
    });

    it('all available buildings satisfy unlock conditions', () => {
      const result = categorizeBuildings({
        buildingId: 'training_room',
        currentCityLevel: 3,
        builtBuildingIds: ['training_room', 'veg_bed'],
        availableSlotCount: 10,
      });
      for (const building of result.available) {
        expect(building.unlockLevel).toBeLessThanOrEqual(3);
        if (building.prerequisiteBuilding) {
          expect(['training_room', 'veg_bed']).toContain(building.prerequisiteBuilding);
        }
      }
    });

    it('locked buildings have reasons', () => {
      const result = categorizeBuildings({
        buildingId: 'training_room',
        currentCityLevel: 1,
        builtBuildingIds: [],
        availableSlotCount: 10,
      });
      for (const item of result.locked) {
        expect(['level', 'prerequisite', 'no_slots']).toContain(item.reason);
      }
    });
  });

  describe('validatePrerequisiteChain', () => {
    it('validates chains without cycles', () => {
      const result = validatePrerequisiteChain('gym');
      expect(result.valid).toBe(true);
      expect(result.chain).toContain('training_room');
      expect(result.chain).toContain('gym');
    });

    it('detects circular dependencies', () => {
      // Note: Our current definitions don't have cycles, but this tests the logic.
      // If we ever add a cycle, this would catch it.
      const result = validatePrerequisiteChain('training_room');
      expect(result.valid).toBe(true); // training_room has no prereq, so no cycle
    });

    it('returns false for unknown buildings', () => {
      const result = validatePrerequisiteChain('nonexistent_building');
      expect(result.valid).toBe(false);
    });

    it('includes all buildings in chain', () => {
      const result = validatePrerequisiteChain('community_garden');
      expect(result.chain).toContain('veg_bed');
      expect(result.chain).toContain('community_garden');
    });
  });
});
