import type { BuildingDefinition, BuildingStage } from './types';
import type { ResourceKey } from '@/domain/rewards/constants';
import { BUILDING_BY_ID } from './definitions';

/**
 * Building cost calculations (Phase 7). All costs are non-negative integers.
 * Costs are frozen at the moment a project starts (cost snapshot), so later
 * balancing changes don't invalidate active projects (ADR-TBD).
 *
 * References: docs/building-costs.md, building-balancing.md.
 */

export interface CostSnapshot {
  readonly energy: number;
  readonly food: number;
  readonly nature: number;
  readonly community: number;
  readonly building_material: number;
}

/**
 * Get the total cost for building a specific stage.
 */
export function getCostForStage(building: BuildingDefinition, stage: BuildingStage): CostSnapshot {
  if (stage === 1) {
    return building.baseCosts as CostSnapshot;
  }

  // Stages 2 and 3 (for future upgrade support)
  const upgradeCosts = building.upgradeCosts[stage];
  if (!upgradeCosts || Object.keys(upgradeCosts).length === 0) {
    // No upgrade defined; return empty (should not happen in practice)
    return { energy: 0, food: 0, nature: 0, community: 0, building_material: 0 };
  }

  return {
    energy: upgradeCosts.energy ?? 0,
    food: upgradeCosts.food ?? 0,
    nature: upgradeCosts.nature ?? 0,
    community: upgradeCosts.community ?? 0,
    building_material: upgradeCosts.building_material ?? 0,
  };
}

/**
 * Calculate total cost across all resources.
 */
export function getTotalCost(cost: CostSnapshot): number {
  return cost.energy + cost.food + cost.nature + cost.community + cost.building_material;
}

/**
 * Check if a household can afford the cost with current resources.
 */
export function canAfford(
  cost: CostSnapshot,
  resources: Readonly<Record<ResourceKey, number>>,
): boolean {
  return (
    resources.energy >= cost.energy &&
    resources.food >= cost.food &&
    resources.nature >= cost.nature &&
    resources.community >= cost.community &&
    resources.building_material >= cost.building_material
  );
}

/**
 * Calculate remaining resources after spending.
 */
export function remainingAfterSpend(
  cost: CostSnapshot,
  resources: Readonly<Record<ResourceKey, number>>,
): Record<ResourceKey, number> {
  return {
    energy: Math.max(0, resources.energy - cost.energy),
    food: Math.max(0, resources.food - cost.food),
    nature: Math.max(0, resources.nature - cost.nature),
    community: Math.max(0, resources.community - cost.community),
    building_material: Math.max(0, resources.building_material - cost.building_material),
  };
}

/**
 * Cost categories for UI grouping (informational).
 */
export enum CostCategory {
  SMALL = 'small', // ~10–18 total
  MEDIUM = 'medium', // ~20–35 total
  LARGE = 'large', // ~40–65 total
}

export function categorizeCost(total: number): CostCategory {
  if (total <= 18) return CostCategory.SMALL;
  if (total <= 35) return CostCategory.MEDIUM;
  return CostCategory.LARGE;
}

/**
 * For UI: breakdown of costs by resource.
 */
export interface CostBreakdown {
  total: number;
  byResource: Record<ResourceKey, number>;
  category: CostCategory;
}

export function breakdownCost(cost: CostSnapshot): CostBreakdown {
  const total = getTotalCost(cost);
  return {
    total,
    byResource: {
      energy: cost.energy,
      food: cost.food,
      nature: cost.nature,
      community: cost.community,
      building_material: cost.building_material,
    },
    category: categorizeCost(total),
  };
}

/**
 * Validate that all cost amounts are non-negative integers.
 */
export function validateCostSnapshot(cost: unknown): cost is CostSnapshot {
  if (!cost || typeof cost !== 'object') return false;
  const c = cost as Record<string, unknown>;
  return (
    typeof c.energy === 'number' &&
    c.energy >= 0 &&
    Number.isInteger(c.energy) &&
    typeof c.food === 'number' &&
    c.food >= 0 &&
    Number.isInteger(c.food) &&
    typeof c.nature === 'number' &&
    c.nature >= 0 &&
    Number.isInteger(c.nature) &&
    typeof c.community === 'number' &&
    c.community >= 0 &&
    Number.isInteger(c.community) &&
    typeof c.building_material === 'number' &&
    c.building_material >= 0 &&
    Number.isInteger(c.building_material)
  );
}

/**
 * For balancing: get cost statistics across all V1 buildings.
 */
export function getCostStatistics(): {
  byCategory: Record<string, { min: number; max: number; avg: number }>;
  overall: { min: number; max: number; avg: number };
} {
  const costsByCategory = new Map<string, number[]>();
  let allCosts: number[] = [];

  for (const building of Array.from(BUILDING_BY_ID.values())) {
    const cost = getTotalCost(building.baseCosts as CostSnapshot);
    allCosts.push(cost);

    const category = building.primaryCategory;
    const list = costsByCategory.get(category) ?? [];
    list.push(cost);
    costsByCategory.set(category, list);
  }

  const stats: Record<string, { min: number; max: number; avg: number }> = {};
  for (const [cat, categoryCosts] of costsByCategory) {
    stats[cat] = {
      min: Math.min(...categoryCosts),
      max: Math.max(...categoryCosts),
      avg: Math.round(categoryCosts.reduce((a, b) => a + b, 0) / categoryCosts.length),
    };
  }

  return {
    byCategory: stats,
    overall: {
      min: Math.min(...allCosts),
      max: Math.max(...allCosts),
      avg: Math.round(allCosts.reduce((a, b) => a + b, 0) / allCosts.length),
    },
  };
}
