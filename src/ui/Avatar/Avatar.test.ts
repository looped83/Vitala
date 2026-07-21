import { describe, expect, it } from 'vitest';
import { deriveInitials } from './Avatar';

describe('deriveInitials', () => {
  it('takes the first two letters of a single name', () => {
    expect(deriveInitials('Lutz')).toBe('LU');
  });

  it('combines first and last initials', () => {
    expect(deriveInitials('René Müller')).toBe('RM');
    expect(deriveInitials('Anna Maria Beispiel')).toBe('AB');
  });

  it('handles empty input gracefully', () => {
    expect(deriveInitials('')).toBe('?');
    expect(deriveInitials('   ')).toBe('?');
  });
});
