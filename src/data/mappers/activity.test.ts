import { describe, expect, it } from 'vitest';
import { mapActivityType, mapFeedRow, mapRitualDefinition } from './activity';
import type { MapFeedContext } from './activity';
import { entrySummary } from '@/domain/activity/summary';
import type { ActivityType, RitualDefinition } from '@/domain/activity/types';
import type { Database } from '@/data/supabase/database.types';

type FeedRow = Database['public']['Views']['entry_feed']['Row'];

const strength: ActivityType = {
  id: 't1',
  key: 'strength',
  name: 'Krafttraining',
  category: 'strength',
  icon: 'movement',
  sortOrder: 10,
};
const veg: RitualDefinition = {
  id: 'd1',
  key: 'vegetables',
  area: 'nutrition',
  kind: 'daily_block',
  name: 'Gemüse',
  icon: 'nutrition',
  sortOrder: 30,
};
const meal: RitualDefinition = {
  id: 'd2',
  key: 'balanced_vegan_meal',
  area: 'nutrition',
  kind: 'daily_block',
  name: 'Ausgewogene vegane Hauptmahlzeit',
  icon: 'nutrition',
  sortOrder: 10,
};

function ctx(participants: Record<string, string[]> = {}): MapFeedContext {
  return {
    typeById: new Map([[strength.id, strength]]),
    defById: new Map([
      [veg.id, veg],
      [meal.id, meal],
    ]),
    participantsByKey: new Map(Object.entries(participants)),
  };
}

const activityRow: FeedRow = {
  kind: 'activity',
  entry_id: 'a1',
  household_id: 'h1',
  area: 'movement',
  occurred_on: '2024-06-15',
  primary_user_id: 'u1',
  created_by: 'u1',
  is_shared: true,
  note: 'gut',
  custom_label: null,
  created_at: '2024-06-15T10:00:00Z',
  updated_at: '2024-06-15T10:00:00Z',
  activity_type_id: 't1',
  duration_min: 45,
  intensity: 'intense',
  location: 'Peloton',
  started_at_time: '07:30:00',
  definition_ids: null,
  meal_label: null,
  is_special: false,
};

const ritualRow: FeedRow = {
  ...activityRow,
  kind: 'ritual',
  entry_id: 'g1',
  area: 'nutrition',
  is_shared: false,
  activity_type_id: null,
  duration_min: null,
  intensity: null,
  location: null,
  started_at_time: null,
  definition_ids: ['d2', 'd1'],
  meal_label: 'Mittag',
};

describe('reference mappers', () => {
  it('maps activity types and ritual definitions', () => {
    expect(
      mapActivityType({
        id: 't1',
        key: 'strength',
        area: 'movement',
        name: 'Krafttraining',
        category: 'strength',
        icon: 'movement',
        sort_order: 10,
        is_active: true,
        created_at: 'x',
      }).key,
    ).toBe('strength');
    expect(
      mapRitualDefinition({
        id: 'd1',
        key: 'vegetables',
        area: 'nutrition',
        kind: 'daily_block',
        name: 'Gemüse',
        icon: 'nutrition',
        sort_order: 30,
        is_active: true,
        created_at: 'x',
      }).area,
    ).toBe('nutrition');
  });
});

describe('mapFeedRow', () => {
  it('maps a shared movement activity with resolved participants', () => {
    const entry = mapFeedRow(activityRow, ctx({ 'activity:a1': ['u1', 'u2'] }));
    expect(entry.kind).toBe('activity');
    expect(entry.title).toBe('Krafttraining');
    expect(entry.durationMin).toBe(45);
    expect(entry.isShared).toBe(true);
    expect(entry.participantIds).toEqual(['u1', 'u2']);
    expect(entrySummary(entry)).toBe('45 Min · Intensiv · Peloton');
  });

  it('maps a nutrition check-in with a stable title + block labels', () => {
    const entry = mapFeedRow(ritualRow, ctx());
    expect(entry.title).toBe('Ernährungs-Check-in');
    expect(entry.definitionKeys).toEqual(['balanced_vegan_meal', 'vegetables']);
    expect(entry.mealLabel).toBe('Mittag');
    expect(entrySummary(entry)).toBe('Ausgewogene vegane Hauptmahlzeit · Gemüse');
  });

  it('names a single non-nutrition action by its definition', () => {
    const entry = mapFeedRow(
      { ...ritualRow, area: 'animal_welfare', definition_ids: ['d1'] },
      {
        ...ctx(),
        defById: new Map([
          ['d1', { ...veg, area: 'animal_welfare', name: 'Vogeltränke gepflegt' }],
        ]),
      },
    );
    expect(entry.title).toBe('Vogeltränke gepflegt');
  });
});
