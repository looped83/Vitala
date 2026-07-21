import { describe, expect, it } from 'vitest';
import { absoluteAppUrl, DEFAULT_REDIRECT, isSafeRedirectPath, sanitizeRedirect } from './redirect';

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

describe('absoluteAppUrl', () => {
  it('prefixes the sub-path base (GitHub Pages project site)', () => {
    expect(absoluteAppUrl('/auth/update-password', 'https://looped83.github.io', '/Vitala/')).toBe(
      'https://looped83.github.io/Vitala/auth/update-password',
    );
  });

  it('works at the root base', () => {
    expect(absoluteAppUrl('/auth/update-password', 'https://app.example', '/')).toBe(
      'https://app.example/auth/update-password',
    );
  });

  it('tolerates a base without a trailing slash and a path without a leading slash', () => {
    expect(absoluteAppUrl('today', 'https://x.test', '/Vitala')).toBe(
      'https://x.test/Vitala/today',
    );
  });
});
