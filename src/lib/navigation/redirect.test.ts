import { describe, expect, it } from 'vitest';
import { DEFAULT_REDIRECT, isSafeRedirectPath, sanitizeRedirect } from './redirect';

describe('isSafeRedirectPath', () => {
  it('accepts absolute in-app paths', () => {
    expect(isSafeRedirectPath('/today')).toBe(true);
    expect(isSafeRedirectPath('/settings?tab=appearance')).toBe(true);
  });

  it('rejects non-string / empty values', () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath('')).toBe(false);
    expect(isSafeRedirectPath(42)).toBe(false);
  });

  it('rejects protocol-relative and absolute URLs (open redirect)', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false);
    expect(isSafeRedirectPath('https://evil.com')).toBe(false);
    expect(isSafeRedirectPath('http://evil.com')).toBe(false);
    expect(isSafeRedirectPath('/\\evil.com')).toBe(false);
  });

  it('rejects paths containing a scheme separator or control chars', () => {
    expect(isSafeRedirectPath('/foo:bar')).toBe(false);
    expect(isSafeRedirectPath('/foo\nbar')).toBe(false);
    expect(isSafeRedirectPath('javascript:alert(1)')).toBe(false);
  });
});

describe('sanitizeRedirect', () => {
  it('returns the candidate when safe', () => {
    expect(sanitizeRedirect('/city')).toBe('/city');
  });

  it('falls back to the default for unsafe input', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe(DEFAULT_REDIRECT);
    expect(sanitizeRedirect(null)).toBe(DEFAULT_REDIRECT);
  });

  it('honours a custom fallback', () => {
    expect(sanitizeRedirect('//evil', '/login')).toBe('/login');
  });
});
