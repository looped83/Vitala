import { dayBucket, dayGroupLabel, HOUSEHOLD_TIMEZONE } from '@/lib/dates/day';
import type { DayBucket } from '@/lib/dates/day';
import type { ActivityIntensity, HistoryEntry } from './types';
import type { LifeArea } from './areas';

/** Filter state for the history list (spec §22). */
export interface HistoryFilter {
  areas: LifeArea[];
  /** '' = any participant; else a user id (primary or participant). */
  userId: string;
  /** 'all' | 'shared' | 'personal'. */
  participation: 'all' | 'shared' | 'personal';
  intensity: ActivityIntensity | '';
  /** Inclusive `yyyy-MM-dd` bounds; '' = open. */
  from: string;
  to: string;
  /** Free-text query. */
  query: string;
}

export const EMPTY_FILTER: HistoryFilter = {
  areas: [],
  userId: '',
  participation: 'all',
  intensity: '',
  from: '',
  to: '',
  query: '',
};

/** Is any narrowing filter active (used to pick the right empty state)? */
export function isFilterActive(filter: HistoryFilter): boolean {
  return (
    filter.areas.length > 0 ||
    filter.userId !== '' ||
    filter.participation !== 'all' ||
    filter.intensity !== '' ||
    filter.from !== '' ||
    filter.to !== '' ||
    filter.query.trim() !== ''
  );
}

function involvesUser(entry: HistoryEntry, userId: string): boolean {
  return entry.primaryUserId === userId || entry.participantIds.includes(userId);
}

/** Does the entry's searchable text contain the (already lowercased) query? */
export function matchesQuery(entry: HistoryEntry, queryLower: string): boolean {
  if (queryLower === '') return true;
  const haystack = [
    entry.title,
    entry.customLabel ?? '',
    entry.mealLabel ?? '',
    entry.note ?? '',
    ...(entry.definitionLabels ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(queryLower);
}

/** Apply the full filter set to a list of entries (pure). */
export function filterEntries(entries: HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  const queryLower = filter.query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (filter.areas.length > 0 && !filter.areas.includes(entry.area)) return false;
    if (filter.userId && !involvesUser(entry, filter.userId)) return false;
    if (filter.participation === 'shared' && !entry.isShared) return false;
    if (filter.participation === 'personal' && entry.isShared) return false;
    if (filter.intensity && entry.intensity !== filter.intensity) return false;
    if (filter.from && entry.occurredOn < filter.from) return false;
    if (filter.to && entry.occurredOn > filter.to) return false;
    if (!matchesQuery(entry, queryLower)) return false;
    return true;
  });
}

export interface HistoryGroup {
  /** `yyyy-MM-dd`. */
  key: string;
  label: string;
  bucket: DayBucket;
  entries: HistoryEntry[];
}

/**
 * Group entries by household-local day, newest first, with within-day entries
 * ordered by creation time (newest first). Stable and duplicate-free.
 */
export function groupByDay(
  entries: HistoryEntry[],
  timeZone: string = HOUSEHOLD_TIMEZONE,
  now: Date = new Date(),
): HistoryGroup[] {
  const byDay = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const list = byDay.get(entry.occurredOn);
    if (list) list.push(entry);
    else byDay.set(entry.occurredOn, [entry]);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([key, dayEntries]) => ({
      key,
      label: dayGroupLabel(key, timeZone, now),
      bucket: dayBucket(key, timeZone, now),
      entries: dayEntries
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)),
    }));
}

/**
 * Gentle duplicate hint (spec §5): warn — but never block — when a very similar
 * entry already exists for the same day, area and person. "Similar" = same area
 * + same movement type (movement) or an overlapping definition set (ritual),
 * on the same day, involving the drafting user.
 */
export interface DuplicateDraft {
  area: LifeArea;
  occurredOn: string;
  userId: string;
  typeKey?: string;
  definitionKeys?: string[];
  /** When editing, the entry id to ignore. */
  ignoreId?: string;
}

export function findDuplicateHint(
  entries: HistoryEntry[],
  draft: DuplicateDraft,
): HistoryEntry | null {
  for (const entry of entries) {
    if (draft.ignoreId && entry.id === draft.ignoreId) continue;
    if (entry.area !== draft.area) continue;
    if (entry.occurredOn !== draft.occurredOn) continue;
    if (!involvesUser(entry, draft.userId)) continue;
    if (entry.kind === 'activity' && draft.typeKey) {
      if (entry.typeKey === draft.typeKey) return entry;
    } else if (entry.kind === 'ritual' && draft.definitionKeys?.length) {
      const draftKeys = draft.definitionKeys;
      const overlap = (entry.definitionKeys ?? []).some((key) => draftKeys.includes(key));
      if (overlap) return entry;
    }
  }
  return null;
}
