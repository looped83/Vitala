/**
 * Normalized application error model.
 *
 * Every failure that reaches the UI is mapped to an {@link AppError}. This keeps
 * user-facing messages friendly and non-technical (product-principles §2.2) and
 * keeps raw Supabase / network details out of the interface and out of logs that
 * users can see. Technical details live in {@link AppError.cause} for developer
 * logging only. See docs/authentication.md and information-architecture §13.5.
 */
export type AppErrorKind =
  | 'auth'
  | 'permission'
  | 'not_found'
  | 'validation'
  | 'network'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'unknown';

export interface AppErrorOptions {
  kind: AppErrorKind;
  /** Friendly, non-technical message shown to the user (German). */
  message: string;
  /** Stable code for tests / conditional handling (not shown to users). */
  code?: string;
  /** Original error for developer logging only – never rendered. */
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code: string | undefined;

  constructor(options: AppErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.kind = options.kind;
    this.code = options.code;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** Friendly fallbacks per kind – used when a specific message is not provided. */
const FRIENDLY_MESSAGE: Record<AppErrorKind, string> = {
  auth: 'Anmeldung nicht möglich. Bitte prüfe deine Eingaben und versuche es erneut.',
  permission: 'Diese Ansicht gehört zu einem anderen Household.',
  not_found: 'Der gesuchte Inhalt wurde nicht gefunden.',
  validation: 'Bitte prüfe die markierten Felder.',
  network: 'Verbindung unterbrochen. Bitte versuche es erneut, sobald du wieder online bist.',
  conflict: 'Diese Aktion wurde bereits ausgeführt.',
  rate_limited: 'Bitte warte einen Moment und versuche es dann erneut.',
  server: 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.',
  unknown: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
};

export function friendlyMessage(kind: AppErrorKind): string {
  return FRIENDLY_MESSAGE[kind];
}

/**
 * Friendly user-facing message for any caught error. AppErrors carry their own
 * message; anything else falls back to a neutral, non-technical string so raw
 * details never reach the UI (security §23).
 */
export function getAppErrorMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  return friendlyMessage('unknown');
}
