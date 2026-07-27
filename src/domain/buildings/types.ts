import type { ResourceKey } from '@/domain/rewards/constants';
import type { RegionId } from '@/domain/city/types';

/**
 * Building domain types (Phase 7). Framework-free — no React, no Supabase.
 * Buildings are the tangible, durable expression of urban development.
 * All building definitions are static and versioned; instances reference
 * both the definition and the version under which they were built (ADR-TBD).
 *
 * References: docs/building-system.md, docs/building-definitions.md,
 * building-catalog.md, building-costs.md, building-effects.md.
 */

/** Stable building category — the primary lens for urban organization. */
export type BuildingCategory =
  | 'movement'
  | 'nutrition'
  | 'sustainability'
  | 'animal_welfare'
  | 'community';

/** Building size for slot compatibility (phase 6). Same as SlotSize from city/types. */
export type BuildingSize = 'small' | 'medium' | 'large';

/** Building stage — v1 supports base + up to 2 upgrades, but only base is active. */
export type BuildingStage = 1 | 2 | 3;

/** Construction project status lifecycle. */
export type ConstructionProjectStatus =
  | 'prepared' // Costs reserved, not yet committed
  | 'confirmed' // User confirmed; now actively building
  | 'in_progress' // Consuming build points
  | 'completed' // Finished; building instance created
  | 'cancelled' // User cancelled; refund pending
  | 'failed'; // Technical error (rare, admin recovery only)

/** A static building definition (versioned by BUILDING_DEFINITIONS_VERSION). */
export interface BuildingDefinition {
  id: string;
  /** Display title (DE). */
  title: string;
  /** Short functional description. */
  description: string;
  /** Longer narrative description. */
  longDescription: string;
  primaryCategory: BuildingCategory;
  /** Secondary themes (for future filtering). */
  secondaryAreas: readonly BuildingCategory[];
  /** Which slot sizes this building can occupy (v1: all buildings fit any compatible slot). */
  compatibleSizes: readonly BuildingSize[];
  /** Which regions allow this building (all, or specific subset). */
  allowedRegions: readonly RegionId[] | null; // null = all compatible slots
  /** City level at which this becomes available. */
  unlockLevel: number;
  /** Optional prerequisite building (e.g., vegetable_bed before community_garden). */
  prerequisiteBuilding: string | null;
  /** Costs to build the base stage. */
  baseCosts: Readonly<Record<ResourceKey, number>>;
  /** Optional upgrade costs (stage 2, stage 3). Only stage 1 is active in v1. */
  upgradeCosts: Readonly<Record<BuildingStage, Record<ResourceKey, number>>>;
  /** Building effects (passive, not realtime production). */
  effects: readonly BuildingEffect[];
  /** SVG asset identifier (e.g., 'building_community_garden'). */
  assetId: string;
  /** For accessibility: plain text description of the building. */
  a11yDescription: string;
  /** Sorting order within category (for UI). */
  sortOrder: number;
  /** Rule version under which this definition was created. */
  ruleVersion: number;
}

/** A passive building effect (no realtime production; limited by day/week). */
export interface BuildingEffect {
  id: string;
  type:
    | 'mission_pool_add' // Add mission to pool
    | 'goal_template_unlock' // Unlock new goal template
    | 'ritual_template_unlock' // Unlock new ritual template
    | 'resource_bonus' // Small bonus on qualified events (capped)
    | 'city_xp_bonus' // Weekly city XP bonus
    | 'community_bonus' // Weekly community bonus
    | 'slot_unlock'; // Unlock new building slot (Phase 8+)

  /** Effect parameters (mission_id, goal_template_id, resource_type, etc.). */
  parameters: Readonly<Record<string, string | number>>;

  /** Daily, weekly, or monthly limit (0 = unlimited). */
  limit: number;
  limitPeriod: 'day' | 'week' | 'month' | 'none';

  /** Display text for the effect. */
  label: string;
}

/** A constructed building instance (persisted after completion). */
export interface BuildingInstance {
  id: string;
  householdId: string;
  buildingDefinitionId: string;
  /** Version of the building definition under which this was built. */
  definitionVersion: number;
  slotId: string;
  regionId: RegionId;
  currentStage: BuildingStage;
  status: 'active' | 'upgraded' | 'max_upgraded';
  builtBy: string; // User ID who initiated (for transparency; no leaderboard)
  constructionProjectId: string;
  completedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

/** An active or completed construction project. */
export interface ConstructionProject {
  id: string;
  householdId: string;
  buildingDefinitionId: string;
  /** Version of the definition's costs at the time of project start. */
  definitionVersion: number;
  slotId: string;
  regionId: RegionId;
  initiatedBy: string; // User ID
  status: ConstructionProjectStatus;
  /** Costs snapshot: what was required when project started. */
  costSnapshot: Readonly<Record<ResourceKey, number>>;
  /** Building points required for completion (0 = instant). */
  buildPointsRequired: number;
  /** Current build points accumulated. */
  buildPointsEarned: number;
  /** When the project was started. */
  startedAt: string; // ISO timestamp
  /** When the project was completed (if status = completed). */
  completedAt: string | null;
  /** When the project was cancelled (if status = cancelled). */
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A contribution to a construction project (build points from an event). */
export interface ConstructionContribution {
  id: string;
  constructionProjectId: string;
  householdId: string;
  /** Source of the build points (e.g., 'shared_activity', 'shared_goal'). */
  source: string;
  sourceId: string;
  /** Number of build points awarded. */
  points: number;
  /** Idempotency key: `${source}:${sourceId}` (prevents double-counting). */
  idempotencyKey: string;
  ruleVersion: number;
  eventDate: string; // ISO date (not timestamp)
  createdAt: string;
}

/** Building definition version record (for auditing + safe migrations). */
export interface BuildingDefinitionVersion {
  id: string;
  version: number;
  isCurrent: boolean;
  notes: string | null;
  createdAt: string;
}

/** Presentation model: definition + instance state (or just definition if not built). */
export interface BuildingView {
  definition: BuildingDefinition;
  instance: BuildingInstance | null; // null = not yet built
  activeProject: ConstructionProject | null; // null = no active project
  canBuild: boolean;
  canUpgrade: boolean;
  unlockReason: string | null; // Why it's locked (if locked)
}

/** Presentation model for building in catalog. */
export interface BuildingCatalogItem {
  definition: BuildingDefinition;
  status: 'available' | 'locked' | 'built' | 'upgrade_available';
  instance: BuildingInstance | null;
  activeProject: ConstructionProject | null;
  compatibleSlots: Array<{
    slotId: string;
    regionId: RegionId;
    regionTitle: string;
  }>;
  unlockReasonText: string | null;
}
