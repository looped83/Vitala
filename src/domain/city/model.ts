import { mapSummary } from './a11y';
import { REGION_DEFINITIONS } from './layout';
import {
  availableSlotCount,
  developmentStageForLevel,
  newlyUnlockedRegions,
  nextUnlock,
  regionViews,
  unlockedRegionCount,
} from './stages';
import type { DevelopmentStage } from './stages';
import type { CityState, NextUnlock, RegionDefinition, RegionView } from './types';

/**
 * The single presentation model the city UI consumes (§51). Combines the
 * authoritative city state with the static, versioned layout definitions into
 * a framework-free view model — no Supabase rows and no layout math leak into
 * React components.
 */
export interface CityModel {
  state: CityState;
  stage: DevelopmentStage;
  regions: RegionView[];
  nextUnlock: NextUnlock | null;
  newlyUnlocked: RegionDefinition[];
  unlockedRegions: number;
  totalRegions: number;
  availableSlots: number;
  /** Screen-reader summary of the whole map (§56.1). */
  summary: string;
}

/** Build the full city view model from the current + acknowledged levels. */
export function buildCityModel(state: CityState, seenLevel: number): CityModel {
  const level = state.currentLevel;
  const stage = developmentStageForLevel(level);
  const regions = regionViews(level, seenLevel);
  const unlockedRegions = unlockedRegionCount(level);
  const totalRegions = REGION_DEFINITIONS.length;
  const availableSlots = availableSlotCount(level);

  return {
    state,
    stage,
    regions,
    nextUnlock: nextUnlock(level),
    newlyUnlocked: newlyUnlockedRegions(level, seenLevel),
    unlockedRegions,
    totalRegions,
    availableSlots,
    summary: mapSummary({
      cityName: state.name,
      currentLevel: level,
      stageTitle: stage.title,
      unlockedRegions,
      totalRegions,
      availableSlots,
    }),
  };
}
