import { env } from '@/lib/config/env';

/**
 * Minimal, privacy-first logger.
 *
 * Rules (see docs/privacy-data-inventory.md §Logging):
 *  - No external tracking / telemetry SDKs.
 *  - Never log auth tokens, e-mail addresses, full user objects, form values,
 *    or (in later phases) activity / nutrition data.
 *  - In production only `warn` / `error` reach the console by default.
 *
 * Callers pass a short technical message plus an optional structured context
 * that MUST already be free of personal data.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export type LogContext = Record<string, string | number | boolean | null | undefined>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

function shouldLog(level: LogLevel, min: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[min];
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level, env.logLevel)) return;
  const label = `[vitala] ${message}`;
  const args: [string, LogContext?] = context ? [label, context] : [label];
  /* eslint-disable no-console */
  if (level === 'debug') console.debug(...args);
  else if (level === 'info') console.info(...args);
  else if (level === 'warn') console.warn(...args);
  else console.error(...args);
  /* eslint-enable no-console */
}

export const logger: Logger = {
  debug: (message, context) => write('debug', message, context),
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
  error: (message, context) => write('error', message, context),
};
