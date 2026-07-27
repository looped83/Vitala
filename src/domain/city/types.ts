import type { LifeArea } from '@/domain/activity/areas';
import type { ResourceKey } from '@/domain/rewards/constants';

/**
 * City & world domain types (Phase 6). Framework-free — no React, no Supabase.
 * The visual city is *reconstructed* from these static, versioned definitions
 * plus the household's current city level (ADR-0038/0041). Nothing here renders;
 * mappers turn definitions + state into presentation models the UI consumes.
 */

/** Stable region identifiers. Names follow the Phase-1 world (city-and-world-concept §9.2). */
export type RegionId =
  | 'city_center'
  | 'residential'
  | 'movement_quarter'
  | 'nutrition_quarter'
  | 'sustainability_infra'
  | 'nature_reserve'
  | 'culture_quarter'
  | 'water_forest'
  | 'expansion';

/** Visual theme key → drives colour tokens + decoration; not the sole info carrier. */
export type RegionTheme =
  | 'center'
  | 'residential'
  | 'movement'
  | 'nutrition'
  | 'sustainability'
  | 'nature'
  | 'community'
  | 'water'
  | 'expansion';

/** Slot size / purpose category. Prepares Phase-7 building requirements (§16). */
export type SlotSize =
  'small' | 'medium' | 'large' | 'nature_project' | 'infrastructure' | 'community';

/** Building categories a slot will accept in Phase 7 (docs/building-system §10). */
export type BuildingCategory =
  'movement' | 'nutrition' | 'sustainability' | 'animal_welfare' | 'community';

/** A rectangle in the fixed city coordinate space (viewBox units). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A point in the fixed city coordinate space (viewBox units). */
export interface Point {
  x: number;
  y: number;
}

/**
 * Static region definition (versioned by LAYOUT_VERSION). Positions are
 * deterministic viewBox coordinates so the layout is testable and stable (§45).
 */
export interface RegionDefinition {
  id: RegionId;
  /** Internal, stable name. */
  name: string;
  /** Display title (DE). */
  title: string;
  /** Short calm description shown in details + list. */
  description: string;
  /** One narrative sentence about later development. */
  outlook: string;
  theme: RegionTheme;
  /** Life areas this region represents (may be empty for central/expansion). */
  areas: readonly LifeArea[];
  /** Primary resource linked to this region (resource-flow, §64). */
  primaryResource: ResourceKey;
  /** City level at which this region becomes available (≥ 1). */
  unlockLevel: number;
  /** Deterministic order for the list view + z-stacking. */
  order: number;
  /** Region footprint on the map. */
  rect: Rect;
  /** Whether this region is the expansion outlook (visible, never enterable in V1). */
  isExpansion: boolean;
}

/** Static building-slot definition (versioned by LAYOUT_VERSION). */
export interface SlotDefinition {
  id: string;
  regionId: RegionId;
  /** Centre point of the slot marker on the map. */
  position: Point;
  size: SlotSize;
  /** City level at which the slot becomes available (≥ region.unlockLevel). */
  unlockLevel: number;
  /** Building categories permitted here in Phase 7. */
  allowedCategories: readonly BuildingCategory[];
  /** Deterministic order within the region. */
  order: number;
  /** True once Phase 7 can build here; false = reserved outlook only in V1. */
  buildableInV1: boolean;
}

/** Derived, level-dependent status of a region for a given city level. */
export type RegionStatus = 'available' | 'newly_unlocked' | 'locked';

/** Derived, level-dependent status of a slot. No buildings exist in V1. */
export type SlotStatus = 'available' | 'locked' | 'reserved';

/** Presentation model for a region (definition + derived state). */
export interface RegionView {
  definition: RegionDefinition;
  status: RegionStatus;
  /** Slots belonging to this region with their derived status. */
  slots: SlotView[];
  /** Count of slots currently available to prepare in Phase 7. */
  availableSlots: number;
}

/** Presentation model for a slot (definition + derived state). */
export interface SlotView {
  definition: SlotDefinition;
  status: SlotStatus;
}

/** The next element the household will unlock, for the progress hint (§35/§62). */
export interface NextUnlock {
  regionId: RegionId;
  title: string;
  unlockLevel: number;
  /** City levels still to go (≥ 1). */
  levelsAway: number;
}

/** Authoritative city state read from the server (household-scoped). */
export interface CityState {
  householdId: string;
  name: string;
  layoutVersion: number;
  /** Current city level (derived from city XP, never falls). */
  currentLevel: number;
  /** Highest level ever reached (server-guarded monotone, §14). */
  highestLevel: number;
  /** City XP total, for the sober "still needed" hint (§35). */
  cityXp: number;
  /** XP still needed for the next city level. */
  xpToNext: number;
}
