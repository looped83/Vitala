import { INTENSITY_LABEL } from './types';
import type { HistoryEntry } from './types';

/** Short one-line summary for a history card / detail (no internal ids §23). */
export function entrySummary(entry: HistoryEntry): string {
  if (entry.kind === 'activity') {
    const parts = [`${entry.durationMin ?? 0} Min`];
    if (entry.intensity) parts.push(INTENSITY_LABEL[entry.intensity]);
    if (entry.location) parts.push(entry.location);
    return parts.join(' · ');
  }
  return (entry.definitionLabels ?? []).join(' · ');
}
