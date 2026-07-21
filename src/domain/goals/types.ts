import type { LifeArea } from '@/domain/activity/areas';

/**
 * Canonical domain enums (framework-free). The generated `database.types.ts`
 * mirrors these string unions so DB rows map without a cast — the domain never
 * imports from the data layer.
 */
export type OwnerType = 'personal' | 'shared';
export type GoalPeriodType = 'day' | 'week' | 'month' | 'quarter' | 'custom';
export type GoalRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type GoalMeasurement =
  | 'entry_count'
  | 'duration_minutes'
  | 'active_days'
  | 'shared_count'
  | 'distinct_types'
  | 'manual'
  | 'boolean';
export type GoalUnit = 'units' | 'minutes' | 'days' | 'meals' | 'actions' | 'shared_activities';
export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired' | 'archived';
export type GoalPeriodStatus = 'active' | 'completed' | 'expired';

/** Text length bounds (mirrored by DB check constraints + server RPC). */
export const GOAL_TITLE_MAX = 80;
export const GOAL_DESCRIPTION_MAX = 500;
export const GOAL_TARGET_MAX = 100000;

/** A goal as the UI renders it (from the `goal_overview` view). Framework-free. */
export interface Goal {
  id: string;
  householdId: string;
  createdBy: string;
  ownerType: OwnerType;
  ownerUserId: string | null;
  title: string;
  description: string | null;
  lifeArea: LifeArea;
  measurement: GoalMeasurement;
  targetValue: number;
  unit: GoalUnit;
  periodType: GoalPeriodType;
  recurrence: GoalRecurrence;
  activityTypeKeys: string[];
  ritualDefinitionKeys: string[];
  startDate: string;
  endDate: string | null;
  status: GoalStatus;
  manualValue: number | null;
  templateKey: string | null;
  pauseReason: string | null;
  resumeOn: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  pausedAt: string | null;
  archivedAt: string | null;
  // Current-period snapshot (null when no active period, e.g. archived goals).
  periodId: string | null;
  periodIndex: number | null;
  periodStart: string | null;
  periodEnd: string | null;
  periodTarget: number;
  currentValue: number;
}

/** One historic/current evaluation window of a goal. */
export interface GoalPeriod {
  id: string;
  goalId: string;
  householdId: string;
  periodIndex: number;
  periodStart: string;
  periodEnd: string;
  targetValue: number;
  status: GoalPeriodStatus;
  finalValue: number | null;
  completedAt: string | null;
}

/** A curated starter goal (reference data). */
export interface GoalTemplate {
  key: string;
  ownerType: OwnerType;
  lifeArea: LifeArea;
  title: string;
  description: string | null;
  measurement: GoalMeasurement;
  targetValue: number;
  unit: GoalUnit;
  periodType: GoalPeriodType;
  recurrence: GoalRecurrence;
  activityTypeKeys: string[];
  ritualDefinitionKeys: string[];
  sortOrder: number;
}

// --- Display labels (German, neutral tone) --------------------------------

export const OWNER_TYPE_LABEL: Record<OwnerType, string> = {
  personal: 'Persönlich',
  shared: 'Gemeinsam',
};

export const PERIOD_TYPE_LABEL: Record<GoalPeriodType, string> = {
  day: 'Tag',
  week: 'Woche',
  month: 'Monat',
  quarter: 'Quartal',
  custom: 'Eigener Zeitraum',
};

export const RECURRENCE_LABEL: Record<GoalRecurrence, string> = {
  none: 'Einmalig',
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  quarterly: 'Quartalsweise',
};

export const MEASUREMENT_LABEL: Record<GoalMeasurement, string> = {
  entry_count: 'Anzahl Einträge',
  duration_minutes: 'Bewegungsminuten',
  active_days: 'Aktive Tage',
  shared_count: 'Gemeinsame Einträge',
  distinct_types: 'Verschiedene Arten',
  manual: 'Manuell bestätigt',
  boolean: 'Erledigt / offen',
};

export const UNIT_LABEL: Record<GoalUnit, string> = {
  units: 'Einheiten',
  minutes: 'Minuten',
  days: 'Tage',
  meals: 'Mahlzeiten',
  actions: 'Aktionen',
  shared_activities: 'gemeinsame Aktivitäten',
};

/** Singular/plural aware unit label for progress lines. */
export function unitLabel(unit: GoalUnit, value: number): string {
  const one: Record<GoalUnit, string> = {
    units: 'Einheit',
    minutes: 'Minute',
    days: 'Tag',
    meals: 'Mahlzeit',
    actions: 'Aktion',
    shared_activities: 'gemeinsame Aktivität',
  };
  return value === 1 ? one[unit] : UNIT_LABEL[unit];
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  draft: 'Entwurf',
  active: 'Aktiv',
  paused: 'Pausiert',
  completed: 'Abgeschlossen',
  expired: 'Abgelaufen',
  archived: 'Archiviert',
};

/** Which measurements read live from Phase-3 entries (vs. manual confirmation). */
export function isAutoMeasurement(measurement: GoalMeasurement): boolean {
  return measurement !== 'manual' && measurement !== 'boolean';
}
