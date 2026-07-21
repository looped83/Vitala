import { describe, expect, it } from 'vitest';
import { eveningCheckInSchema, morningCheckInSchema } from './schemas';

describe('morningCheckInSchema', () => {
  it('accepts an empty check-in (one-tap, all optional)', () => {
    expect(morningCheckInSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a full morning check-in', () => {
    const parsed = morningCheckInSchema.safeParse({
      energy_level: 3,
      available_time: 'half',
      intensity: 'balanced',
      focus: 'movement',
      wish_text: 'Ruhig starten',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an out-of-range energy level', () => {
    expect(morningCheckInSchema.safeParse({ energy_level: 6 }).success).toBe(false);
  });

  it('rejects overly long free text', () => {
    expect(morningCheckInSchema.safeParse({ wish_text: 'x'.repeat(281) }).success).toBe(false);
  });

  it('drops empty free text to undefined', () => {
    const parsed = morningCheckInSchema.parse({ wish_text: '   ' });
    expect(parsed.wish_text).toBeUndefined();
  });
});

describe('eveningCheckInSchema', () => {
  it('accepts an empty evening check-in', () => {
    expect(eveningCheckInSchema.safeParse({}).success).toBe(true);
  });

  it('validates the day feeling range', () => {
    expect(eveningCheckInSchema.safeParse({ day_feeling: 5 }).success).toBe(true);
    expect(eveningCheckInSchema.safeParse({ day_feeling: 0 }).success).toBe(false);
  });
});
