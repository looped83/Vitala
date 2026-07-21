/**
 * Safe redirect handling.
 *
 * After login we return the user to the page they originally requested. To
 * avoid open-redirect vulnerabilities (security §30) we only ever accept
 * *same-origin, path-only* targets. Anything with a scheme, host, or
 * protocol-relative prefix is rejected and falls back to a safe default.
 */
export const DEFAULT_REDIRECT = '/today';

// Matches space and any C0 control character (code points <= 0x20) without
// embedding literal control characters in the source.
// eslint-disable-next-line no-control-regex
const CONTROL_OR_SPACE = new RegExp('[\\u0000-\\u0020]');

export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  // Must be an absolute in-app path.
  if (!value.startsWith('/')) return false;
  // Reject protocol-relative ("//evil.com") and backslash tricks ("/\evil").
  if (value.startsWith('//') || value.startsWith('/\\')) return false;
  // Reject whitespace / control characters that could smuggle a scheme.
  if (CONTROL_OR_SPACE.test(value)) return false;
  // A path never legitimately contains a scheme separator.
  if (value.includes(':')) return false;
  return true;
}

/** Return `candidate` when it is a safe in-app path, otherwise the fallback. */
export function sanitizeRedirect(candidate: unknown, fallback: string = DEFAULT_REDIRECT): string {
  return isSafeRedirectPath(candidate) ? candidate : fallback;
}

/**
 * Build an absolute URL for an in-app path that respects the deployment base
 * path (e.g. `/Vitala/`). Used for auth redirect targets that must match the
 * Supabase "Redirect URLs" allow list. `base` defaults to Vite's BASE_URL.
 */
export function absoluteAppUrl(path: string, origin: string, base: string): string {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  const normalizedBase = base.replace(/\/+$/, ''); // drop trailing slash
  return `${origin}${normalizedBase}${safePath}`;
}
