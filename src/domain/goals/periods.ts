import type { GoalPeriodType } from './types';

/**
 * Deterministic period-boundary math on local calendar dates (`yyyy-MM-dd`),
 * mirroring the SQL helpers in migration 0011 (spec §7/§45). All arithmetic is
 * done in UTC so it never drifts with the runtime timezone — a period boundary
 * is a calendar fact, not an instant. `weekStart`: 0=Sunday … 6=Saturday
 * (household_settings.week_start; default Monday = 1).
 */

function toUtc(date: string): Date {
  const parts = date.split('-');
  return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
}

function fromUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: string, days: number): string {
  const dt = toUtc(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromUtc(dt);
}

function addMonths(date: string, months: number): string {
  const dt = toUtc(date);
  dt.setUTCMonth(dt.getUTCMonth() + months);
  return fromUtc(dt);
}

/** Start date of the period of `type` that contains `anchor`. */
export function periodStart(type: GoalPeriodType, anchor: string, weekStart = 1): string {
  const dt = toUtc(anchor);
  switch (type) {
    case 'day':
      return anchor;
    case 'week': {
      const dow = dt.getUTCDay(); // 0=Sun..6=Sat
      const offset = (dow - weekStart + 7) % 7;
      return addDays(anchor, -offset);
    }
    case 'month':
      return fromUtc(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1)));
    case 'quarter': {
      const q = Math.floor(dt.getUTCMonth() / 3) * 3;
      return fromUtc(new Date(Date.UTC(dt.getUTCFullYear(), q, 1)));
    }
    default:
      return anchor;
  }
}

/** Inclusive end date of a period given its aligned start. */
export function periodEndFromStart(type: GoalPeriodType, start: string): string {
  switch (type) {
    case 'day':
      return start;
    case 'week':
      return addDays(start, 6);
    case 'month':
      return addDays(addMonths(start, 1), -1);
    case 'quarter':
      return addDays(addMonths(start, 3), -1);
    default:
      return start;
  }
}

/** Start date of the 0-based period `index` of a series anchored at `seriesStart`. */
export function periodStartForIndex(
  type: GoalPeriodType,
  seriesStart: string,
  index: number,
): string {
  switch (type) {
    case 'day':
      return addDays(seriesStart, index);
    case 'week':
      return addDays(seriesStart, index * 7);
    case 'month':
      return addMonths(seriesStart, index);
    case 'quarter':
      return addMonths(seriesStart, index * 3);
    default:
      return seriesStart;
  }
}

/** 0-based index of the period containing `today`, relative to `seriesStart`. */
export function currentPeriodIndex(
  type: GoalPeriodType,
  seriesStart: string,
  today: string,
): number {
  const a = toUtc(seriesStart);
  const b = toUtc(today);
  let idx: number;
  switch (type) {
    case 'day':
      idx = Math.round((b.getTime() - a.getTime()) / 86_400_000);
      break;
    case 'week':
      idx = Math.floor((b.getTime() - a.getTime()) / 86_400_000 / 7);
      break;
    case 'month':
      idx = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
      break;
    case 'quarter':
      idx = Math.floor(
        ((b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())) / 3,
      );
      break;
    default:
      idx = 0;
  }
  return Math.max(0, idx);
}

export interface PeriodBounds {
  start: string;
  end: string;
}

/**
 * The current period bounds for a goal, given its period type, series start
 * date and today. Used for display (e.g. "diese Woche") and tests; the server
 * is authoritative for persisted periods.
 */
export function currentPeriodBounds(
  type: GoalPeriodType,
  startDate: string,
  today: string,
  weekStart = 1,
  endDate?: string | null,
): PeriodBounds {
  if (type === 'custom') {
    return { start: startDate, end: endDate ?? startDate };
  }
  const seriesStart = periodStart(type, startDate, weekStart);
  const idx = currentPeriodIndex(type, seriesStart, today);
  const start = periodStartForIndex(type, seriesStart, idx);
  return { start, end: periodEndFromStart(type, start) };
}
