import { describe, expect, it } from 'vitest';
import { goalFormSchema } from './schemas';

const OWNER = '11111111-1111-1111-1111-111111111111';

const base = {
  owner_type: 'personal' as const,
  owner_user_id: OWNER,
  title: 'Dreimal Bewegung pro Woche',
  life_area: 'movement' as const,
  measurement: 'entry_count' as const,
  target_value: 3,
  unit: 'units' as const,
  period_type: 'week' as const,
  recurrence: 'weekly' as const,
  activity_type_keys: [],
  ritual_definition_keys: [],
  start_date: '2026-03-18',
};

describe('goalFormSchema', () => {
  it('accepts a valid weekly movement goal', () => {
    expect(goalFormSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a non-positive target', () => {
    expect(goalFormSchema.safeParse({ ...base, target_value: 0 }).success).toBe(false);
  });

  it('requires minutes ↔ duration_minutes to match', () => {
    const bad = goalFormSchema.safeParse({
      ...base,
      measurement: 'duration_minutes',
      unit: 'units',
    });
    expect(bad.success).toBe(false);
  });

  it('accepts a valid minutes goal', () => {
    expect(
      goalFormSchema.safeParse({
        ...base,
        measurement: 'duration_minutes',
        unit: 'minutes',
        target_value: 150,
      }).success,
    ).toBe(true);
  });

  it('rejects boolean goals with a target other than 1', () => {
    expect(
      goalFormSchema.safeParse({
        ...base,
        measurement: 'boolean',
        unit: 'actions',
        life_area: 'animal_welfare',
        target_value: 2,
      }).success,
    ).toBe(false);
  });

  it('rejects mismatched recurrence/period', () => {
    expect(
      goalFormSchema.safeParse({ ...base, recurrence: 'monthly', period_type: 'week' }).success,
    ).toBe(false);
  });

  it('requires an end date for one-off custom periods', () => {
    expect(
      goalFormSchema.safeParse({
        ...base,
        period_type: 'custom',
        recurrence: 'none',
        end_date: undefined,
      }).success,
    ).toBe(false);
  });

  it('rejects ritual filters on movement goals', () => {
    expect(
      goalFormSchema.safeParse({ ...base, ritual_definition_keys: ['balanced_vegan_meal'] })
        .success,
    ).toBe(false);
  });

  it('rejects a personal goal without an owner', () => {
    expect(goalFormSchema.safeParse({ ...base, owner_user_id: undefined }).success).toBe(false);
  });

  it('accepts a shared goal without an owner', () => {
    expect(
      goalFormSchema.safeParse({
        ...base,
        owner_type: 'shared',
        owner_user_id: undefined,
        measurement: 'shared_count',
        unit: 'shared_activities',
        period_type: 'month',
        recurrence: 'monthly',
      }).success,
    ).toBe(true);
  });
});
