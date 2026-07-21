import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTER,
  filterEntries,
  findDuplicateHint,
  groupByDay,
  isFilterActive,
  matchesQuery,
} from './history';
import type { HistoryEntry } from './types';

function activity(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    kind: 'activity',
    id: overrides.id ?? 'a1',
    area: 'movement',
    occurredOn: '2024-06-15',
    title: 'Krafttraining',
    createdBy: 'u1',
    primaryUserId: 'u1',
    isShared: false,
    participantIds: [],
    note: null,
    customLabel: null,
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
    typeKey: 'strength',
    durationMin: 45,
    intensity: 'intense',
    ...overrides,
  };
}

function ritual(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    kind: 'ritual',
    id: overrides.id ?? 'r1',
    area: 'nutrition',
    occurredOn: '2024-06-15',
    title: 'Ernährungs-Check-in',
    createdBy: 'u2',
    primaryUserId: 'u2',
    isShared: false,
    participantIds: [],
    note: null,
    customLabel: null,
    createdAt: '2024-06-15T09:00:00Z',
    updatedAt: '2024-06-15T09:00:00Z',
    definitionKeys: ['vegetables'],
    definitionLabels: ['Gemüse'],
    ...overrides,
  };
}

describe('filterEntries', () => {
  const entries = [
    activity({ id: 'a1', occurredOn: '2024-06-15', area: 'movement', primaryUserId: 'u1' }),
    ritual({ id: 'r1', occurredOn: '2024-06-14', area: 'nutrition', primaryUserId: 'u2' }),
    activity({
      id: 'a2',
      occurredOn: '2024-06-10',
      area: 'movement',
      isShared: true,
      participantIds: ['u1', 'u2'],
    }),
  ];

  it('filters by area', () => {
    const result = filterEntries(entries, { ...EMPTY_FILTER, areas: ['nutrition'] });
    expect(result.map((e) => e.id)).toEqual(['r1']);
  });

  it('filters by participation = shared / personal', () => {
    expect(
      filterEntries(entries, { ...EMPTY_FILTER, participation: 'shared' }).map((e) => e.id),
    ).toEqual(['a2']);
    expect(
      filterEntries(entries, { ...EMPTY_FILTER, participation: 'personal' }).map((e) => e.id),
    ).toEqual(['a1', 'r1']);
  });

  it('filters by user across primary + participants', () => {
    expect(filterEntries(entries, { ...EMPTY_FILTER, userId: 'u2' }).map((e) => e.id)).toEqual([
      'r1',
      'a2',
    ]);
  });

  it('filters by a date range (inclusive)', () => {
    const result = filterEntries(entries, {
      ...EMPTY_FILTER,
      from: '2024-06-14',
      to: '2024-06-15',
    });
    expect(result.map((e) => e.id)).toEqual(['a1', 'r1']);
  });

  it('filters by intensity', () => {
    expect(
      filterEntries(entries, { ...EMPTY_FILTER, intensity: 'intense' }).every(
        (e) => e.kind === 'activity',
      ),
    ).toBe(true);
  });
});

describe('matchesQuery', () => {
  it('searches title, note and definition labels', () => {
    const e = ritual({ note: 'Reste verwertet', definitionLabels: ['Gemüse', 'Vollkorn'] });
    expect(matchesQuery(e, 'vollkorn')).toBe(true);
    expect(matchesQuery(e, 'reste')).toBe(true);
    expect(matchesQuery(e, 'joggen')).toBe(false);
  });
});

describe('groupByDay', () => {
  it('groups by local day, newest first, newest-within-day first', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const groups = groupByDay(
      [
        activity({ id: 'a1', occurredOn: '2024-06-15', createdAt: '2024-06-15T08:00:00Z' }),
        activity({ id: 'a2', occurredOn: '2024-06-15', createdAt: '2024-06-15T11:00:00Z' }),
        ritual({ id: 'r1', occurredOn: '2024-06-14' }),
      ],
      'Europe/Berlin',
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(['Heute', 'Gestern']);
    expect(groups[0]?.entries.map((e) => e.id)).toEqual(['a2', 'a1']);
  });
});

describe('findDuplicateHint (anti double-entry §5)', () => {
  const existing = [
    activity({ id: 'a1', occurredOn: '2024-06-15', typeKey: 'strength', primaryUserId: 'u1' }),
    ritual({
      id: 'r1',
      occurredOn: '2024-06-15',
      definitionKeys: ['vegetables'],
      primaryUserId: 'u1',
    }),
  ];

  it('warns about a same-day same-type movement by the same person', () => {
    const hit = findDuplicateHint(existing, {
      area: 'movement',
      occurredOn: '2024-06-15',
      userId: 'u1',
      typeKey: 'strength',
    });
    expect(hit?.id).toBe('a1');
  });

  it('warns about an overlapping ritual selection', () => {
    const hit = findDuplicateHint(existing, {
      area: 'nutrition',
      occurredOn: '2024-06-15',
      userId: 'u1',
      definitionKeys: ['vegetables', 'fruit'],
    });
    expect(hit?.id).toBe('r1');
  });

  it('does not warn on a different day or person, and ignores the edited entry', () => {
    expect(
      findDuplicateHint(existing, {
        area: 'movement',
        occurredOn: '2024-06-14',
        userId: 'u1',
        typeKey: 'strength',
      }),
    ).toBeNull();
    expect(
      findDuplicateHint(existing, {
        area: 'movement',
        occurredOn: '2024-06-15',
        userId: 'u9',
        typeKey: 'strength',
      }),
    ).toBeNull();
    expect(
      findDuplicateHint(existing, {
        area: 'movement',
        occurredOn: '2024-06-15',
        userId: 'u1',
        typeKey: 'strength',
        ignoreId: 'a1',
      }),
    ).toBeNull();
  });
});

describe('isFilterActive', () => {
  it('detects any narrowing filter', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(isFilterActive({ ...EMPTY_FILTER, query: 'x' })).toBe(true);
    expect(isFilterActive({ ...EMPTY_FILTER, areas: ['movement'] })).toBe(true);
  });
});
