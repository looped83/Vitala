import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Display-only date helpers. All persisted timestamps are UTC (`timestamptz`);
 * day/week boundaries are computed server-side in the household timezone
 * (technical-architecture §15.1). These helpers format for display only.
 */
export const DEFAULT_TIMEZONE = 'Europe/Berlin';

/** Format an instant as a date in the given IANA timezone (German locale). */
export function formatDateInZone(
  instant: Date | string | number,
  timeZone: string = DEFAULT_TIMEZONE,
  pattern = 'PPP',
): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  return formatInTimeZone(date, timeZone, pattern, { locale: de });
}

/** Format an instant as a localized date + time (for audit / detail views). */
export function formatDateTime(instant: Date | string | number): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  return format(date, 'PPp', { locale: de });
}
