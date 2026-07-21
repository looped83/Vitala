import type { LifeArea } from './areas';

/** Movement intensity — three levels only (data-model §16.8; not medical). */
export const INTENSITIES = ['light', 'medium', 'intense'] as const;
export type ActivityIntensity = (typeof INTENSITIES)[number];

export const INTENSITY_LABEL: Record<ActivityIntensity, string> = {
  light: 'Leicht',
  medium: 'Moderat',
  intense: 'Intensiv',
};

export type EntrySource = 'manual' | 'quick_action' | 'import';
export type RitualKind = 'daily_block' | 'special_action';
export type EntryKind = 'activity' | 'ritual';

/** Duration bounds (life-areas §4.1; enforced in DB check + Zod + server). */
export const DURATION_MIN = 5;
export const DURATION_MAX = 300;
export const NOTE_MAX = 500;
export const LABEL_MAX = 80;
export const LOCATION_MAX = 120;

/** Reference catalog entry for a movement type. */
export interface ActivityType {
  id: string;
  key: string;
  name: string;
  category: string;
  icon: string | null;
  sortOrder: number;
}

/** Reference catalog entry for a nutrition/sustainability/animal ritual. */
export interface RitualDefinition {
  id: string;
  key: string;
  area: LifeArea;
  kind: RitualKind;
  name: string;
  icon: string | null;
  sortOrder: number;
}

/** A person shown on an entry. */
export interface EntryPerson {
  userId: string;
  displayName: string;
  accentColor: string;
}

/**
 * A normalized history item: either one movement activity or one ritual
 * check-in (a group of chosen definitions). This is the single shape the UI
 * renders — Supabase rows never reach components directly (spec §15).
 */
export interface HistoryEntry {
  kind: EntryKind;
  /** activity id (movement) OR entry_group_id (ritual). Stable across edits. */
  id: string;
  area: LifeArea;
  /** Local calendar date `yyyy-MM-dd` in the household timezone. */
  occurredOn: string;
  title: string;
  createdBy: string;
  primaryUserId: string;
  isShared: boolean;
  participantIds: string[];
  note: string | null;
  customLabel: string | null;
  createdAt: string;
  updatedAt: string;
  // Movement-only
  typeKey?: string;
  durationMin?: number;
  intensity?: ActivityIntensity | null;
  location?: string | null;
  startedAtTime?: string | null;
  // Ritual-only
  definitionKeys?: string[];
  definitionLabels?: string[];
  mealLabel?: string | null;
  ritualKind?: RitualKind;
}

/** A quick-action template. */
export interface Favorite {
  id: string;
  area: LifeArea;
  label: string;
  ownerUserId: string | null; // null = shared across the household
  activityTypeId: string | null;
  durationMin: number | null;
  intensity: ActivityIntensity | null;
  ritualDefinitionIds: string[];
  isShared: boolean;
  sortOrder: number;
}
