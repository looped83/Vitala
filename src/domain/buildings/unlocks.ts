import type { BuildingDefinition } from './types';
import { BUILDING_BY_ID, BUILDING_DEFINITIONS_V1 } from './definitions';

/**
 * Building unlock logic (Phase 7). Determines whether a building is available,
 * locked, or in a transitional state.
 *
 * A building is unlocked when ALL of:
 * 1. City level ≥ building.unlockLevel
 * 2. Prerequisite building (if any) is built
 * 3. Building slot exists and is compatible
 *
 * References: docs/building-system.md §12, building-unlocks.md.
 */

export interface UnlockCheckInput {
  buildingId: string;
  currentCityLevel: number;
  builtBuildingIds: readonly string[];
  availableSlotCount: number;
}

export interface UnlockResult {
  isUnlocked: boolean;
  reason: 'level' | 'prerequisite' | 'no_slots' | 'unlocked' | null;
  levelRequired: number;
  levelAway: number;
  prerequisiteBuilding: BuildingDefinition | null;
  messageKey: string; // For i18n/display
}

/**
 * Check if a specific building is unlocked for the household.
 * Returns the unlock status + reason for UI messaging.
 */
export function checkBuildingUnlock(input: UnlockCheckInput): UnlockResult {
  const building = BUILDING_BY_ID.get(input.buildingId);
  if (!building) {
    return {
      isUnlocked: false,
      reason: null,
      levelRequired: 0,
      levelAway: 0,
      prerequisiteBuilding: null,
      messageKey: 'building_not_found',
    };
  }

  // Check city level
  if (input.currentCityLevel < building.unlockLevel) {
    return {
      isUnlocked: false,
      reason: 'level',
      levelRequired: building.unlockLevel,
      levelAway: building.unlockLevel - input.currentCityLevel,
      prerequisiteBuilding: building.prerequisiteBuilding
        ? BUILDING_BY_ID.get(building.prerequisiteBuilding) ?? null
        : null,
      messageKey: 'unlock_requires_city_level',
    };
  }

  // Check prerequisite building
  if (building.prerequisiteBuilding) {
    if (!input.builtBuildingIds.includes(building.prerequisiteBuilding)) {
      const prereq = BUILDING_BY_ID.get(building.prerequisiteBuilding);
      return {
        isUnlocked: false,
        reason: 'prerequisite',
        levelRequired: building.unlockLevel,
        levelAway: 0,
        prerequisiteBuilding: prereq ?? null,
        messageKey: 'unlock_requires_prerequisite',
      };
    }
  }

  // Check slot availability (Phase 7 has many slots; this is mostly informational)
  if (input.availableSlotCount <= 0) {
    return {
      isUnlocked: false,
      reason: 'no_slots',
      levelRequired: building.unlockLevel,
      levelAway: 0,
      prerequisiteBuilding: null,
      messageKey: 'no_compatible_slots',
    };
  }

  return {
    isUnlocked: true,
    reason: 'unlocked',
    levelRequired: building.unlockLevel,
    levelAway: 0,
    prerequisiteBuilding: null,
    messageKey: 'building_available',
  };
}

/**
 * Categorize all V1 buildings by unlock status.
 */
export function categorizeBuildings(input: UnlockCheckInput): {
  available: BuildingDefinition[];
  locked: Array<{
    building: BuildingDefinition;
    reason: 'level' | 'prerequisite' | 'no_slots';
    levelAway?: number;
    prerequisiteBuilding?: BuildingDefinition;
  }>;
} {
  const available: BuildingDefinition[] = [];
  const locked: Array<{
    building: BuildingDefinition;
    reason: 'level' | 'prerequisite' | 'no_slots';
    levelAway?: number;
    prerequisiteBuilding?: BuildingDefinition;
  }> = [];

  for (const building of BUILDING_DEFINITIONS_V1) {
    const result = checkBuildingUnlock({ ...input, buildingId: building.id });
    if (result.isUnlocked) {
      available.push(building);
    } else if (result.reason && result.reason !== 'unlocked') {
      locked.push({
        building,
        reason: result.reason,
        levelAway: result.levelAway,
        prerequisiteBuilding: result.prerequisiteBuilding ?? undefined,
      });
    }
  }

  return { available, locked };
}

/**
 * Get all buildings that still need to be built (for progress tracking).
 */
export function getUnbuiltBuildings(builtBuildingIds: readonly string[]): BuildingDefinition[] {
  return BUILDING_DEFINITIONS_V1.filter((b) => !builtBuildingIds.includes(b.id));
}

/**
 * Check if a prerequisite chain can be satisfied.
 * Used to validate that a building's entire chain is buildable.
 */
export function validatePrerequisiteChain(
  buildingId: string,
  visited = new Set<string>(),
): { valid: boolean; chain: string[] } {
  if (visited.has(buildingId)) {
    return { valid: false, chain: Array.from(visited) }; // Circular dependency
  }

  const building = BUILDING_BY_ID.get(buildingId);
  if (!building) {
    return { valid: false, chain: [buildingId] };
  }

  visited.add(buildingId);

  if (building.prerequisiteBuilding) {
    const result = validatePrerequisiteChain(building.prerequisiteBuilding, visited);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true, chain: Array.from(visited) };
}
