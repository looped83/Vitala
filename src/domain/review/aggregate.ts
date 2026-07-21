import type { LifeArea } from '@/domain/activity/areas';
import { LIFE_AREAS, LIFE_AREA_LABEL } from '@/domain/activity/areas';

/**
 * Review aggregation & neutral text (spec §32–§35, ADR-0030). Reviews are
 * factual and never moralising: no "successful/failed", no "too little",
 * no red states. Comparisons are neutral ("zwei mehr als im Vormonat"),
 * never an aggressive growth demand.
 */

/** Counts per life area, plus shared + active-day totals for a window. */
export interface AreaTotals {
  byArea: Record<LifeArea, number>;
  movementMinutes: number;
  sharedCount: number;
  activeDays: number;
  entryCount: number;
  ritualsCompleted: number;
}

export function emptyAreaTotals(): AreaTotals {
  return {
    byArea: { movement: 0, nutrition: 0, sustainability: 0, animal_welfare: 0 },
    movementMinutes: 0,
    sharedCount: 0,
    activeDays: 0,
    entryCount: 0,
    ritualsCompleted: 0,
  };
}

function pluralEntries(n: number): string {
  return n === 1 ? '1 Eintrag' : `${n} Einträge`;
}

function pluralRituals(n: number): string {
  return n === 1 ? '1 Ritual' : `${n} Rituale`;
}

/**
 * Neutral one-line day summary (spec §32). Example:
 *   "Heute wurden 3 Einträge dokumentiert und 2 Rituale abgeschlossen."
 */
export function daySummaryText(totals: AreaTotals, isToday = true): string {
  const day = isToday ? 'Heute' : 'An diesem Tag';
  if (totals.entryCount === 0 && totals.ritualsCompleted === 0) {
    return `${day} wurde noch nichts dokumentiert – das ist völlig in Ordnung.`;
  }
  const parts: string[] = [];
  if (totals.entryCount > 0) parts.push(`${pluralEntries(totals.entryCount)} dokumentiert`);
  if (totals.ritualsCompleted > 0)
    parts.push(`${pluralRituals(totals.ritualsCompleted)} abgeschlossen`);
  // The verb agrees with the first clause's subject count.
  const firstCount = totals.entryCount > 0 ? totals.entryCount : totals.ritualsCompleted;
  const verb = firstCount === 1 ? 'wurde' : 'wurden';
  return `${day} ${verb} ${parts.join(' und ')}.`;
}

/** Areas with the most entries, in canonical order. Used for the balance line. */
export function focusAreas(totals: AreaTotals): LifeArea[] {
  const max = Math.max(...LIFE_AREAS.map((a) => totals.byArea[a]));
  if (max === 0) return [];
  return LIFE_AREAS.filter((a) => totals.byArea[a] === max);
}

/** Join German labels with commas + "und" (Oxford-free). */
function joinDe(labels: string[]): string {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} und ${labels[labels.length - 1] ?? ''}`;
}

/**
 * Neutral balance line (spec §33). Names where the emphasis lay — never a
 * deficiency ("Nachhaltigkeit war zu schwach" is forbidden).
 *   "Diese Woche lag der Schwerpunkt auf Bewegung und Ernährung."
 */
export function balanceText(totals: AreaTotals, periodWord = 'Diese Woche'): string {
  const areas = focusAreas(totals);
  if (areas.length === 0) {
    return `${periodWord} wurde noch nichts erfasst.`;
  }
  if (areas.length === LIFE_AREAS.length) {
    return `${periodWord} waren alle vier Bereiche ausgewogen vertreten.`;
  }
  const labels = areas.map((a) => LIFE_AREA_LABEL[a]);
  return `${periodWord} lag der Schwerpunkt auf ${joinDe(labels)}.`;
}

/**
 * Neutral comparison to a previous period (spec §34). Never demands growth.
 *   equal:   "Im Bereich Nachhaltigkeit wurden in beiden Monaten jeweils 6 Aktionen erfasst."
 *   more:    "Zwei gemeinsame Aktivitäten mehr als im Vormonat."
 *   fewer:   "Eine gemeinsame Aktivität weniger als im Vormonat – jede zählt."
 */
export interface ComparisonInput {
  current: number;
  previous: number;
  /** Noun in the plural, e.g. "gemeinsame Aktivitäten", "Aktionen". */
  nounPlural: string;
  /** Noun in the singular, e.g. "gemeinsame Aktivität", "Aktion". */
  nounSingular: string;
  previousPeriodWord?: string;
}

const NUMBER_WORDS = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht'];

function numberWord(n: number, singular: string, plural: string): string {
  const abs = Math.abs(n);
  const word = (abs < NUMBER_WORDS.length ? NUMBER_WORDS[abs] : String(abs)) ?? String(abs);
  const capitalised = word.charAt(0).toUpperCase() + word.slice(1);
  return `${capitalised} ${abs === 1 ? singular : plural}`;
}

export function comparisonText(input: ComparisonInput): string {
  const prev = input.previousPeriodWord ?? 'im Vormonat';
  const diff = input.current - input.previous;
  if (diff === 0) {
    const n = input.current;
    return `In beiden Zeiträumen wurden jeweils ${n} ${n === 1 ? input.nounSingular : input.nounPlural} erfasst.`;
  }
  const phrase = numberWord(diff, input.nounSingular, input.nounPlural);
  if (diff > 0) {
    return `${phrase} mehr als ${prev}.`;
  }
  return `${phrase} weniger als ${prev} – jede zählt.`;
}
