import { LIFE_AREA_LABEL } from '@/domain/activity/areas';
import { RESOURCE_META } from '@/domain/rewards/display';
import type { BuildingCategory, RegionStatus, RegionTheme, SlotSize, SlotStatus } from './types';

/**
 * Human-readable labels for the city vocabulary. Icon + word always travel
 * together and status is never conveyed by colour alone (§56.7). These are the
 * single source of truth for both the map and the equivalent list view.
 */

export const SLOT_SIZE_LABEL: Record<SlotSize, string> = {
  small: 'Kleine Baufläche',
  medium: 'Mittlere Baufläche',
  large: 'Große Baufläche',
  nature_project: 'Naturprojektfläche',
  infrastructure: 'Infrastrukturfläche',
  community: 'Gemeinschaftsfläche',
};

export const BUILDING_CATEGORY_LABEL: Record<BuildingCategory, string> = {
  movement: 'Bewegung',
  nutrition: 'Ernährung',
  sustainability: 'Nachhaltigkeit',
  animal_welfare: 'Tierwohl',
  community: 'Gemeinschaft',
};

export const REGION_STATUS_LABEL: Record<RegionStatus, string> = {
  available: 'verfügbar',
  newly_unlocked: 'neu freigeschaltet',
  locked: 'gesperrt',
};

export const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
  available: 'frei',
  locked: 'gesperrt',
  reserved: 'für später reserviert',
};

/** Example building types per region theme — shown as *preview text only* in the
 *  slot details, never as buildable options (§18/§60). */
export const THEME_BUILDING_EXAMPLES: Record<RegionTheme, readonly string[]> = {
  center: ['Rathaus', 'Bibliothek'],
  residential: ['Gemeinschaftsgarten'],
  movement: ['Trainingsraum', 'Laufpark', 'Fahrradstation'],
  nutrition: ['Gemeinschaftsgarten', 'Gewächshaus', 'Wochenmarkt'],
  sustainability: ['Solardächer', 'Recyclingzentrum', 'Reparaturwerkstatt'],
  nature: ['Biotop', 'Insektengarten', 'Vogelreservat'],
  community: ['Gemeinschaftshaus', 'Kulturzentrum', 'Reparaturcafé'],
  water: ['Uferweg', 'Feuchtbiotop'],
  expansion: [],
};

export function slotSizeLabel(size: SlotSize): string {
  return SLOT_SIZE_LABEL[size];
}

export function buildingCategoryLabel(category: BuildingCategory): string {
  return BUILDING_CATEGORY_LABEL[category];
}

/** "Bewegung, Ernährung" for a region's life areas (empty → "übergreifend"). */
export function areaListLabel(areas: readonly string[]): string {
  if (areas.length === 0) return 'übergreifend';
  return areas.map((a) => LIFE_AREA_LABEL[a as keyof typeof LIFE_AREA_LABEL] ?? a).join(', ');
}

/** Resource label + symbol for the resource-flow hint (§64). */
export function regionResourceLabel(resourceKey: keyof typeof RESOURCE_META): string {
  return RESOURCE_META[resourceKey].label;
}
