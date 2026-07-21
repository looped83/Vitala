import { describe, expect, it } from 'vitest';
import { AppError, friendlyMessage, isAppError } from './app-error';
import { normalizeUnknownError } from './normalize';

describe('AppError', () => {
  it('is detectable via isAppError', () => {
    const error = new AppError({ kind: 'validation', message: 'x' });
    expect(isAppError(error)).toBe(true);
    expect(isAppError(new Error('x'))).toBe(false);
  });

  it('provides a friendly message per kind', () => {
    expect(friendlyMessage('network')).toMatch(/Verbindung/);
    expect(friendlyMessage('permission')).toMatch(/Household/);
  });
});

describe('normalizeUnknownError', () => {
  it('passes AppError through unchanged', () => {
    const original = new AppError({ kind: 'auth', message: 'x' });
    expect(normalizeUnknownError(original)).toBe(original);
  });

  it('maps fetch TypeErrors to a network error', () => {
    const result = normalizeUnknownError(new TypeError('Failed to fetch'));
    expect(result.kind).toBe('network');
  });

  it('falls back to unknown for opaque values', () => {
    const result = normalizeUnknownError({ weird: true });
    expect(result.kind).toBe('unknown');
  });
});
