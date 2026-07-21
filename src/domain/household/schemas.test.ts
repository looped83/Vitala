import { describe, expect, it } from 'vitest';
import { householdNameSchema, inviteCodeSchema } from './schemas';

describe('householdNameSchema', () => {
  it('accepts a normal name and trims it', () => {
    expect(householdNameSchema.parse('  Unser Haus  ')).toBe('Unser Haus');
  });

  it('rejects empty and overly long names', () => {
    expect(householdNameSchema.safeParse('').success).toBe(false);
    expect(householdNameSchema.safeParse('x'.repeat(81)).success).toBe(false);
  });
});

describe('inviteCodeSchema', () => {
  it('normalizes case and whitespace', () => {
    expect(inviteCodeSchema.parse(' ab12cd34ef ')).toBe('AB12CD34EF');
  });

  it('accepts exactly 10 hex characters', () => {
    expect(inviteCodeSchema.safeParse('0123456789').success).toBe(true);
    expect(inviteCodeSchema.safeParse('ABCDEF0123').success).toBe(true);
  });

  it('rejects wrong length or non-hex characters', () => {
    expect(inviteCodeSchema.safeParse('ABCDE').success).toBe(false);
    expect(inviteCodeSchema.safeParse('GGGGGGGGGG').success).toBe(false);
    expect(inviteCodeSchema.safeParse('ABCDEF01234').success).toBe(false);
  });
});
