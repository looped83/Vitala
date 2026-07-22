import type { LifeArea } from '@/domain/activity/areas';

/** Mission scope and period. Monthly/seasonal are reserved for later phases and
 *  intentionally not part of the Phase-5 pool (task §23). */
export type MissionScope = 'personal' | 'shared';
export type MissionPeriod = 'day' | 'week';

/** Difficulty labels (§27): calm, never performance-aggressive. */
export type MissionDifficulty = 'leicht' | 'normal' | 'gemeinschaftlich';

/** How a mission's progress is measured from real entries (§27/§32). */
export type MissionMeasurement =
  | 'activity_count'
  | 'duration_minutes'
  | 'active_days'
  | 'ritual_count'
  | 'shared_count'
  | 'distinct_areas';

/** A curated mission template. Definitions are reference data, versioned in a
 *  migration; assignments reference them by key (§27). */
export interface MissionDefinition {
  key: string;
  title: string;
  description: string;
  area: LifeArea | null; // null = cross-area (e.g. distinct_areas)
  scope: MissionScope;
  period: MissionPeriod;
  measurement: MissionMeasurement;
  targetValue: number;
  difficulty: MissionDifficulty;
  /** Only offered when the day's available time is at least this (minutes). */
  minMinutes?: number;
  /** True for demanding movement missions skipped under exhaustion protection. */
  demanding?: boolean;
  isActive: boolean;
}

/** Morning check-in signals allowed to influence selection — never medically
 *  interpreted, never derived from free text (§29, ADR-0028). */
export interface DayForm {
  energy: 'low' | 'medium' | 'high' | null;
  timeBudget: 'little' | 'some' | 'plenty' | null;
  focusArea: LifeArea | null;
  wantsRegeneration: boolean;
}

export interface MissionSelectionContext {
  scope: MissionScope;
  period: MissionPeriod;
  /** Qualifying entries per area within the current week (balance steering). */
  weeklyByArea: Record<LifeArea, number>;
  /** Areas of the household's active goals (mild preference). */
  activeGoalAreas: LifeArea[];
  /** Mission keys assigned in the recent cooldown window (repetition guard). */
  recentKeys: string[];
  /** Yesterday's movement hit its daily XP cap → exhaustion protection. */
  movementExhausted: boolean;
  dayForm: DayForm | null;
  /** Deterministic tie-breaker seed (e.g. day ordinal) — keeps selection stable
   *  for a given day without randomness. */
  seed: number;
}
