import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { de } from 'date-fns/locale';
import { differenceInCalendarDays, isValid, parseISO } from 'date-fns';

/**
 * Household day-boundary helpers. The *activity day* (`occurred_on`) is a local
 * calendar date in the household timezone — never a UTC date (spec §30). All
 * persisted timestamps stay UTC; only day grouping and "today" are local.
 *
 * `date-fns-tz` handles DST correctly: a 23:30 local instant near a spring/
 * autumn switch still resolves to the intended local calendar day.
 */
export const HOUSEHOLD_TIMEZONE = 'Europe/Berlin';

/** ISO calendar date (`yyyy-MM-dd`) of an instant in the given timezone. */
export function isoDateInZone(
  instant: Date | string | number,
  timeZone: string = HOUSEHOLD_TIMEZONE,
): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
}

/** Today's local calendar date (`yyyy-MM-dd`) in the household timezone. */
export function todayInZone(timeZone: string = HOUSEHOLD_TIMEZONE, now: Date = new Date()): string {
  return isoDateInZone(now, timeZone);
}

/** Parse a `yyyy-MM-dd` string into a Date at local midnight (display use). */
export function parseIsoDate(value: string): Date {
  return parseISO(value);
}

/** True when `value` is a syntactically valid `yyyy-MM-dd` date. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && isoDateInZone(parsed, 'UTC') === value;
}

/** Is `occurred_on` (a local date string) in the future relative to zone today? */
export function isFutureDay(
  occurredOn: string,
  timeZone: string = HOUSEHOLD_TIMEZONE,
  now: Date = new Date(),
): boolean {
  return occurredOn > todayInZone(timeZone, now);
}

export type DayBucket = 'today' | 'yesterday' | 'older';

/** Which relative bucket a local date falls into (history grouping §21.4). */
export function dayBucket(
  occurredOn: string,
  timeZone: string = HOUSEHOLD_TIMEZONE,
  now: Date = new Date(),
): DayBucket {
  const today = todayInZone(timeZone, now);
  if (occurredOn === today) return 'today';
  const diff = differenceInCalendarDays(
    toZonedTime(parseISO(`${today}T00:00:00`), 'UTC'),
    toZonedTime(parseISO(`${occurredOn}T00:00:00`), 'UTC'),
  );
  return diff === 1 ? 'yesterday' : 'older';
}

/** Human date-group heading for the history (German). */
export function dayGroupLabel(
  occurredOn: string,
  timeZone: string = HOUSEHOLD_TIMEZONE,
  now: Date = new Date(),
): string {
  const bucket = dayBucket(occurredOn, timeZone, now);
  if (bucket === 'today') return 'Heute';
  if (bucket === 'yesterday') return 'Gestern';
  return formatInTimeZone(parseISO(`${occurredOn}T12:00:00Z`), 'UTC', 'EEEE, d. MMMM yyyy', {
    locale: de,
  });
}
