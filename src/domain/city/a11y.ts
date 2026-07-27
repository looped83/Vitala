import { areaListLabel, REGION_STATUS_LABEL, SLOT_SIZE_LABEL, SLOT_STATUS_LABEL } from './display';
import { regionResourceLabel } from './display';
import type { RegionView, SlotView } from './types';

/**
 * Accessibility summaries (§56). Every interactive element carries a full,
 * self-contained label so the map is usable without sight — the list view reads
 * the same strings. No information is conveyed by colour or position alone.
 */

/** e.g. "Naturschutzgebiet, gesperrt, Freischaltung auf Stadtlevel 5." (§56.2) */
export function regionA11yLabel(view: RegionView): string {
  const { definition, status } = view;
  const base = `${definition.title}, ${REGION_STATUS_LABEL[status]}`;
  if (status === 'locked') {
    return `${base}, Freischaltung auf Stadtlevel ${definition.unlockLevel}.`;
  }
  const slots =
    view.availableSlots === 1 ? '1 freie Baufläche' : `${view.availableSlots} freie Bauflächen`;
  return `${base}, ${slots}.`;
}

/** e.g. "Große Baufläche, frei, Garten- & Ernährungsviertel, für Ernährung." (§56.3) */
export function slotA11yLabel(view: SlotView, regionTitle: string): string {
  const { definition, status } = view;
  const size = SLOT_SIZE_LABEL[definition.size];
  const categories = definition.allowedCategories.map((c) => c).join(', ');
  return `${size}, ${SLOT_STATUS_LABEL[status]}, ${regionTitle}, für ${categories}.`;
}

/** Whole-map summary for the accessible name + list intro (§56.1). */
export function mapSummary(params: {
  cityName: string;
  currentLevel: number;
  stageTitle: string;
  unlockedRegions: number;
  totalRegions: number;
  availableSlots: number;
}): string {
  const { cityName, currentLevel, stageTitle, unlockedRegions, totalRegions, availableSlots } =
    params;
  return (
    `${cityName}, Stadtlevel ${currentLevel} (${stageTitle}). ` +
    `${unlockedRegions} von ${totalRegions} Stadtbereichen erschlossen, ` +
    `${availableSlots} freie Bauflächen. ` +
    'Eine gleichwertige Listenansicht steht zur Verfügung.'
  );
}

/** Sober resource-relation sentence for a region (§64), e.g.
 *  "Dieser Bereich ist mit der Ressource Natur verbunden." */
export function regionResourceSentence(view: RegionView): string {
  const resource = regionResourceLabel(view.definition.primaryResource);
  const areas = areaListLabel(view.definition.areas);
  if (view.definition.areas.length === 0) {
    return `Verbunden mit der Ressource ${resource}.`;
  }
  return `Verbunden mit der Ressource ${resource} und dem Bereich ${areas}.`;
}
