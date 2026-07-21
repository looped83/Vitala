import { AppError, friendlyMessage, isAppError } from './app-error';

/**
 * Generic fallback normalization for non-domain errors (thrown values, DOM
 * errors, network failures). Supabase-specific mapping lives in
 * `src/data/supabase/errors.ts` and is applied before this fallback.
 */
export function normalizeUnknownError(value: unknown): AppError {
  if (isAppError(value)) {
    return value;
  }

  // Browsers throw a TypeError "Failed to fetch" on offline / DNS failures.
  if (value instanceof TypeError && /fetch|network/i.test(value.message)) {
    return new AppError({ kind: 'network', message: friendlyMessage('network'), cause: value });
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new AppError({ kind: 'network', message: friendlyMessage('network'), cause: value });
  }

  return new AppError({ kind: 'unknown', message: friendlyMessage('unknown'), cause: value });
}
