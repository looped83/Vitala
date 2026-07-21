import type { Ritual } from './types';

/**
 * Ritual scheduling — decides whether a ritual is "due" on a given local date
 * (spec §26/§27/§29.4). Kept intentionally simple: no calendar engine, just
 * clear, testable rules. `date` and the ritual dates are local `yyyy-MM-dd`
 * strings; weekday math is UTC-based so it never drifts (spec §45).
 */

function weekdayOf(date: string): number {
  const parts = date.split('-');
  return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))).getUTCDay();
}

function dayOfMonth(date: string): number {
  return Number(date.split('-')[2]);
}

/** Is `ritual` scheduled on the local date `date`? Ignores completion state. */
export function isRitualScheduledOn(ritual: Ritual, date: string): boolean {
  if (ritual.status !== 'active') return false;
  if (date < ritual.startDate) return false;
  if (ritual.endDate && date > ritual.endDate) return false;

  const dow = weekdayOf(date);
  switch (ritual.recurrence) {
    case 'daily':
      return true;
    case 'flexible':
      // Flexible rituals are always available; if weekdays are set, honour them.
      return ritual.weekdays.length === 0 || ritual.weekdays.includes(dow);
    case 'weekly':
      return ritual.weekdays.length > 0
        ? ritual.weekdays.includes(dow)
        : dow === weekdayOf(ritual.startDate);
    case 'monthly': {
      const target = dayOfMonth(ritual.startDate);
      const parts = date.split('-');
      const lastDay = new Date(Date.UTC(Number(parts[0]), Number(parts[1]), 0)).getUTCDate();
      // Clamp to the last day for short months (e.g. day 31 in February).
      return dayOfMonth(date) === Math.min(target, lastDay);
    }
    default:
      return false;
  }
}

/** Rituals due on `date`, sorted by preferred time then sort order. */
export function ritualsDueOn(rituals: Ritual[], date: string): Ritual[] {
  const order: Record<string, number> = { morning: 0, day: 1, evening: 2, flexible: 3 };
  return rituals
    .filter((r) => isRitualScheduledOn(r, date))
    .sort(
      (a, b) =>
        (order[a.preferredTime] ?? 9) - (order[b.preferredTime] ?? 9) ||
        a.sortOrder - b.sortOrder ||
        a.title.localeCompare(b.title, 'de'),
    );
}
