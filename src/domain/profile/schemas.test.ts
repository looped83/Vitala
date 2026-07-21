import { describe, expect, it } from 'vitest';
import { displayNameSchema, profileSchema } from './schemas';

describe('displayNameSchema', () => {
  it('trims and accepts a valid name', () => {
    expect(displayNameSchema.parse('  Lutz ')).toBe('Lutz');
  });

  it('rejects empty and too-long names', () => {
    expect(displayNameSchema.safeParse('').success).toBe(false);
    expect(displayNameSchema.safeParse('n'.repeat(61)).success).toBe(false);
  });
});

describe('profileSchema', () => {
  it('accepts a full valid profile', () => {
    const result = profileSchema.safeParse({
      display_name: 'René',
      accent_color: 'nutrition',
      avatar_motif: 'Wald',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid accent colour', () => {
    const result = profileSchema.safeParse({ display_name: 'X', accent_color: 'pink' });
    expect(result.success).toBe(false);
  });

  it('allows an empty avatar motif', () => {
    const result = profileSchema.safeParse({
      display_name: 'X',
      accent_color: 'movement',
      avatar_motif: '',
    });
    expect(result.success).toBe(true);
  });
});
