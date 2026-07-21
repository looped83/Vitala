import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { AppError, friendlyMessage } from '@/lib/errors/app-error';
import type { AppErrorKind } from '@/lib/errors/app-error';
import { normalizeUnknownError } from '@/lib/errors/normalize';
import { logger } from '@/lib/logging/logger';

/**
 * Maps Supabase (Auth + PostgREST/RPC) errors to the app's normalized
 * {@link AppError}. Raw Supabase messages never reach the UI (security §23);
 * a friendly German message is chosen from a stable code. The technical detail
 * is logged (without personal data).
 */

/** Business errors raised by our RPCs (raise exception '<code>'). */
const RPC_MESSAGE: Record<string, { kind: AppErrorKind; message: string }> = {
  not_authenticated: { kind: 'auth', message: 'Bitte melde dich zuerst an.' },
  not_owner: {
    kind: 'permission',
    message: 'Nur die verwaltende Person kann diese Aktion ausführen.',
  },
  household_full: {
    kind: 'conflict',
    message: 'Der Household ist bereits vollständig (zwei Personen).',
  },
  already_in_household: { kind: 'conflict', message: 'Du bist bereits Teil eines Households.' },
  invalid_invite: { kind: 'validation', message: 'Der Code ist ungültig oder abgelaufen.' },
  invalid_name: {
    kind: 'validation',
    message: 'Bitte einen Household-Namen mit 1–80 Zeichen angeben.',
  },
  cannot_deactivate_self: { kind: 'validation', message: 'Du kannst dich nicht selbst entfernen.' },
  not_found: { kind: 'not_found', message: friendlyMessage('not_found') },
  // Phase 3 · activity capture
  not_in_household: {
    kind: 'permission',
    message: 'Du gehörst zu keinem aktiven Household.',
  },
  invalid_type: { kind: 'validation', message: 'Diese Auswahl ist für den Bereich ungültig.' },
  invalid_duration: {
    kind: 'validation',
    message: 'Die Dauer muss zwischen 5 und 300 Minuten liegen.',
  },
  invalid_date: { kind: 'validation', message: 'Das Datum darf nicht in der Zukunft liegen.' },
  invalid_participant: {
    kind: 'validation',
    message: 'Die zweite Person muss zu eurem Household gehören.',
  },
  empty_selection: { kind: 'validation', message: 'Bitte mindestens einen Eintrag auswählen.' },
  duplicate_ritual: {
    kind: 'conflict',
    message: 'Diesen Baustein hast du an diesem Tag bereits erfasst.',
  },
  not_allowed: {
    kind: 'permission',
    message: 'Nur die erfassende Person kann diesen Eintrag bearbeiten.',
  },
};

function mapAuthError(error: AuthError): AppError {
  const status = error.status ?? 0;
  // Supabase returns 400 for invalid credentials.
  if (status === 400 || /invalid login credentials/i.test(error.message)) {
    return new AppError({
      kind: 'auth',
      code: 'invalid_credentials',
      message: 'E-Mail oder Passwort ist nicht korrekt.',
      cause: error,
    });
  }
  if (status === 429) {
    return new AppError({
      kind: 'rate_limited',
      code: 'rate_limited',
      message: friendlyMessage('rate_limited'),
      cause: error,
    });
  }
  if (status === 422 || /signups? not allowed|disabled/i.test(error.message)) {
    return new AppError({
      kind: 'permission',
      code: 'signup_disabled',
      message:
        'Neue Registrierungen sind nicht möglich. Bitte wende dich an die verwaltende Person.',
      cause: error,
    });
  }
  return new AppError({ kind: 'auth', message: friendlyMessage('auth'), cause: error });
}

function mapPostgrestError(error: PostgrestError): AppError {
  // Our RPCs raise exceptions whose message is a stable code.
  const known = RPC_MESSAGE[error.message];
  if (known) {
    return new AppError({
      kind: known.kind,
      code: error.message,
      message: known.message,
      cause: error,
    });
  }
  // RLS violations surface as 42501 (insufficient privilege) or empty results.
  if (error.code === '42501' || error.code === 'PGRST301') {
    return new AppError({
      kind: 'permission',
      message: friendlyMessage('permission'),
      cause: error,
    });
  }
  if (error.code === '23505') {
    return new AppError({ kind: 'conflict', message: friendlyMessage('conflict'), cause: error });
  }
  if (error.code === 'PGRST116') {
    return new AppError({ kind: 'not_found', message: friendlyMessage('not_found'), cause: error });
  }
  return new AppError({ kind: 'server', message: friendlyMessage('server'), cause: error });
}

export function normalizeSupabaseError(value: unknown): AppError {
  let appError: AppError;
  if (value instanceof AuthError) {
    appError = mapAuthError(value);
  } else if (value instanceof PostgrestError) {
    appError = mapPostgrestError(value);
  } else if (
    value !== null &&
    typeof value === 'object' &&
    'message' in value &&
    'code' in value &&
    typeof (value as { message: unknown }).message === 'string'
  ) {
    // Duck-typed PostgrestError-like object (defensive).
    appError = mapPostgrestError(value as PostgrestError);
  } else {
    appError = normalizeUnknownError(value);
  }

  // Log the technical detail only — never rendered to the user.
  logger.error('supabase_error', { kind: appError.kind, code: appError.code ?? 'unknown' });
  return appError;
}
