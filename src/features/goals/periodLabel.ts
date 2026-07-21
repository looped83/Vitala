import { formatInTimeZone } from 'date-fns-tz';
import { de } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import type { GoalPeriodType } from '@/domain/goals/types';

function fmt(date: string, pattern: string): string {
  // Format the local calendar date at noon UTC so the day never shifts.
  return formatInTimeZone(parseISO(`${date}T12:00:00Z`), 'UTC', pattern, { locale: de });
}

/** Human label for a goal period, e.g. "16.–22. März", "März 2026", "Q1 2026". */
export function formatPeriodLabel(
  type: GoalPeriodType,
  start: string | null,
  end: string | null,
): string {
  if (!start || !end) return '';
  switch (type) {
    case 'day':
      return fmt(start, 'EEEE, d. MMMM');
    case 'week':
      return `${fmt(start, 'd.')}–${fmt(end, 'd. MMMM')}`;
    case 'month':
      return fmt(start, 'MMMM yyyy');
    case 'quarter': {
      const q = Math.floor(Number(start.split('-')[1] ?? '1') / 3.01) + 1;
      return `Q${q} ${start.split('-')[0]}`;
    }
    default:
      return `${fmt(start, 'd. MMM')} – ${fmt(end, 'd. MMM yyyy')}`;
  }
}
