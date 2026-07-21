import type { LifeArea } from '@/domain/activity/areas';
import type { OwnerType } from '@/domain/goals/types';

/** Canonical ritual domain enums (framework-free; mirrored by database.types). */
export type { OwnerType };
export type RitualRecurrence = 'daily' | 'weekly' | 'monthly' | 'flexible';
export type RitualTime = 'morning' | 'day' | 'evening' | 'flexible';
export type RitualType =
  'check' | 'choice' | 'scale' | 'reflection' | 'activity_link' | 'shared_checkin';
type RitualTypeDb = RitualType;
export type RitualStatus = 'active' | 'paused' | 'archived';
export type RitualCompletionStatus = 'done' | 'skipped' | 'not_relevant';

export const RITUAL_TITLE_MAX = 80;
export const RITUAL_DESCRIPTION_MAX = 300;
export const RITUAL_NOTE_MAX = 300;

/** A ritual definition as the UI renders it. Framework-free. */
export interface Ritual {
  id: string;
  householdId: string;
  createdBy: string;
  ownerType: OwnerType;
  ownerUserId: string | null;
  title: string;
  description: string | null;
  lifeArea: LifeArea | null;
  ritualType: RitualTypeDb;
  recurrence: RitualRecurrence;
  preferredTime: RitualTime;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  status: RitualStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  pausedAt: string | null;
  archivedAt: string | null;
}

/** One recorded outcome for a ritual instance (ritual + local day). */
export interface RitualCompletion {
  id: string;
  ritualId: string;
  householdId: string;
  userId: string;
  occurredOn: string;
  status: RitualCompletionStatus;
  valueNum: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A ritual paired with today's instance status (for the Today page). */
export interface RitualInstance {
  ritual: Ritual;
  /** 'open' when no completion exists yet. */
  status: RitualCompletionStatus | 'open';
  completion: RitualCompletion | null;
}

export const RITUAL_TIME_LABEL: Record<RitualTime, string> = {
  morning: 'Morgens',
  day: 'Tagsüber',
  evening: 'Abends',
  flexible: 'Flexibel',
};

export const RITUAL_TYPE_LABEL: Record<RitualTypeDb, string> = {
  check: 'Bestätigung',
  choice: 'Auswahl',
  scale: 'Einschätzung',
  reflection: 'Reflexion',
  activity_link: 'Aktivität',
  shared_checkin: 'Gemeinsamer Check-in',
};

export const RITUAL_RECURRENCE_LABEL: Record<RitualRecurrence, string> = {
  daily: 'Täglich',
  weekly: 'Wöchentlich',
  monthly: 'Monatlich',
  flexible: 'Flexibel',
};

export const RITUAL_STATUS_LABEL: Record<RitualStatus, string> = {
  active: 'Aktiv',
  paused: 'Pausiert',
  archived: 'Archiviert',
};

export const COMPLETION_STATUS_LABEL: Record<RitualCompletionStatus | 'open', string> = {
  open: 'Offen',
  done: 'Erledigt',
  skipped: 'Übersprungen',
  not_relevant: 'Nicht relevant',
};

/** German weekday short labels, ISO index 0=Sun … 6=Sat (household week uses these). */
export const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;
