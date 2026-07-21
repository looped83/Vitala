import { describe, expect, it } from 'vitest';
import { movementFormSchema, ritualFormSchema, favoriteFormSchema } from './schemas';
import { todayInZone } from '@/lib/dates/day';

const TYPE_ID = '11111111-1111-1111-1111-111111111111';
const PARTNER_ID = '22222222-2222-2222-2222-222222222222';
const DEF_ID = '33333333-3333-3333-3333-333333333333';
const today = todayInZone();

describe('movementFormSchema', () => {
  const base = {
    activity_type_id: TYPE_ID,
    occurred_on: today,
    duration_min: 30,
    is_shared: false,
  };

  it('accepts a minimal valid movement entry', () => {
    expect(movementFormSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a duration below the minimum', () => {
    const result = movementFormSchema.safeParse({ ...base, duration_min: 3 });
    expect(result.success).toBe(false);
  });

  it('rejects a duration above the maximum', () => {
    expect(movementFormSchema.safeParse({ ...base, duration_min: 500 }).success).toBe(false);
  });

  it('rejects a future date', () => {
    const result = movementFormSchema.safeParse({ ...base, occurred_on: '2999-01-01' });
    expect(result.success).toBe(false);
  });

  it('requires a partner when marked shared', () => {
    const result = movementFormSchema.safeParse({ ...base, is_shared: true });
    expect(result.success).toBe(false);
    const ok = movementFormSchema.safeParse({
      ...base,
      is_shared: true,
      partner_user_id: PARTNER_ID,
    });
    expect(ok.success).toBe(true);
  });

  it('rejects an invalid time and accepts a valid one', () => {
    expect(movementFormSchema.safeParse({ ...base, started_at_time: '25:00' }).success).toBe(false);
    expect(movementFormSchema.safeParse({ ...base, started_at_time: '07:30' }).success).toBe(true);
  });
});

describe('ritualFormSchema', () => {
  const base = {
    area: 'nutrition' as const,
    definition_ids: [DEF_ID],
    occurred_on: today,
    is_shared: false,
  };

  it('accepts a valid ritual check-in', () => {
    expect(ritualFormSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an empty selection (no double-count from nothing)', () => {
    expect(ritualFormSchema.safeParse({ ...base, definition_ids: [] }).success).toBe(false);
  });

  it('requires a partner when shared', () => {
    expect(ritualFormSchema.safeParse({ ...base, is_shared: true }).success).toBe(false);
  });
});

describe('favoriteFormSchema', () => {
  it('requires an activity type for a movement favourite', () => {
    expect(favoriteFormSchema.safeParse({ area: 'movement', label: 'Kraft' }).success).toBe(false);
    expect(
      favoriteFormSchema.safeParse({ area: 'movement', label: 'Kraft', activity_type_id: TYPE_ID })
        .success,
    ).toBe(true);
  });

  it('requires at least one definition for a ritual favourite', () => {
    expect(favoriteFormSchema.safeParse({ area: 'nutrition', label: 'Meal' }).success).toBe(false);
    expect(
      favoriteFormSchema.safeParse({
        area: 'nutrition',
        label: 'Meal',
        ritual_definition_ids: [DEF_ID],
      }).success,
    ).toBe(true);
  });
});
