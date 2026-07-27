import type { RegionDefinition, RegionId, SlotDefinition } from './types';

/**
 * The fixed, curated city layout (ADR-0039/0040). NOT procedurally generated.
 * A single source of truth for regions + slots, versioned by LAYOUT_VERSION so
 * later phases can extend the map and migrate existing households safely (§44).
 *
 * Coordinate space: a 1000×700 viewBox, top-down (ADR-0001). Regions sit on a
 * tidy, non-overlapping 3×3 grid so interactive rectangles stay large and
 * legible on small screens (§4). All positions are deterministic + testable.
 */

/** Current layout version. Bump only with a documented migration (§44). */
export const LAYOUT_VERSION = 1;

/** Fixed drawing surface. The SVG scales responsively; the coordinates do not. */
export const CITY_CANVAS = { width: 1000, height: 700 } as const;

// Grid geometry — three columns × three rows.
const COL_X = [40, 365, 690] as const;
const ROW_Y = [40, 260, 480] as const;
const CELL_W = 270;
const CELL_H = 180;

function cell(
  col: 0 | 1 | 2,
  row: 0 | 1 | 2,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return { x: COL_X[col], y: ROW_Y[row], width: CELL_W, height: CELL_H };
}

/**
 * Region definitions. Unlock levels follow the binding Phase-1 table
 * (city-and-world-concept §9.2); the two start regions are always available.
 */
export const REGION_DEFINITIONS: readonly RegionDefinition[] = [
  {
    id: 'movement_quarter',
    name: 'movement_quarter',
    title: 'Sportviertel',
    description: 'Wege, Bewegungsflächen und ein kleiner Park für gemeinsamen Sport.',
    outlook: 'Später entstehen hier Trainingsräume, ein Laufpark und eine Fahrradstation.',
    theme: 'movement',
    areas: ['movement'],
    primaryResource: 'energy',
    unlockLevel: 2,
    order: 3,
    rect: cell(0, 0),
    isExpansion: false,
  },
  {
    id: 'city_center',
    name: 'city_center',
    title: 'Stadtzentrum',
    description: 'Das Herz der Stadt mit Platz und Brunnen – Ausgangspunkt und Orientierung.',
    outlook: 'Später Standort zentraler Gemeinschaftsgebäude wie Rathaus und Bibliothek.',
    theme: 'center',
    areas: [],
    primaryResource: 'community',
    unlockLevel: 1,
    order: 1,
    rect: cell(1, 0),
    isExpansion: false,
  },
  {
    id: 'nutrition_quarter',
    name: 'nutrition_quarter',
    title: 'Garten- & Ernährungsviertel',
    description: 'Beete, Felder und eine Marktfläche für vegane, regionale Versorgung.',
    outlook: 'Später mit Gemeinschaftsgarten, Gewächshaus, Wochenmarkt und Café.',
    theme: 'nutrition',
    areas: ['nutrition'],
    primaryResource: 'food',
    unlockLevel: 3,
    order: 4,
    rect: cell(2, 0),
    isExpansion: false,
  },
  {
    id: 'residential',
    name: 'residential',
    title: 'Wohngebiet',
    description: 'Warme Häuser und Gärten – das gemeinsame Zuhause von Lutz und René.',
    outlook: 'Wächst mit der Stadt und verbindet die Viertel miteinander.',
    theme: 'residential',
    areas: [],
    primaryResource: 'community',
    unlockLevel: 1,
    order: 2,
    rect: cell(0, 1),
    isExpansion: false,
  },
  {
    id: 'culture_quarter',
    name: 'culture_quarter',
    title: 'Bildungs- & Kulturviertel',
    description: 'Ein Platz mit Sitzflächen und Grün für Gemeinschaft, Rituale und Kultur.',
    outlook: 'Später mit Gemeinschaftshaus, Bibliothek, Werkstatt und Reparaturcafé.',
    theme: 'community',
    areas: [],
    primaryResource: 'community',
    unlockLevel: 6,
    order: 7,
    rect: cell(1, 1),
    isExpansion: false,
  },
  {
    id: 'sustainability_infra',
    name: 'sustainability_infra',
    title: 'Nachhaltigkeitsinfrastruktur',
    description: 'Grüne Infrastruktur mit Radwegen, Solarflächen und Reparaturorten.',
    outlook: 'Später mit Solardächern, Recyclingzentrum und Reparaturwerkstatt.',
    theme: 'sustainability',
    areas: ['sustainability'],
    primaryResource: 'nature',
    unlockLevel: 4,
    order: 5,
    rect: cell(2, 1),
    isExpansion: false,
  },
  {
    id: 'nature_reserve',
    name: 'nature_reserve',
    title: 'Naturschutzgebiet',
    description: 'Wildblumenflächen, Hecken und ein Teich als Lebensraum für Tiere.',
    outlook: 'Später mit Biotop, Insektengarten und Vogelreservat.',
    theme: 'nature',
    areas: ['animal_welfare'],
    primaryResource: 'nature',
    unlockLevel: 5,
    order: 6,
    rect: cell(0, 2),
    isExpansion: false,
  },
  {
    id: 'water_forest',
    name: 'water_forest',
    title: 'Wasser- & Waldgebiet',
    description: 'See, Uferweg und Wald – Ruhe, Erholung und ökologische Vielfalt.',
    outlook: 'Wird als Erholungs- und Naturraum weiter erschlossen.',
    theme: 'water',
    areas: ['sustainability', 'animal_welfare'],
    primaryResource: 'nature',
    unlockLevel: 7,
    order: 8,
    rect: cell(1, 2),
    isExpansion: false,
  },
  {
    id: 'expansion',
    name: 'expansion',
    title: 'Umland & vernetzte Region',
    description: 'Eine markierte Erweiterungsfläche für spätere Stadtlevel und Projekte.',
    outlook: 'Wird auf einem späteren Stadtlevel erschlossen – ganz ohne Kaufzwang.',
    theme: 'expansion',
    areas: [],
    primaryResource: 'community',
    unlockLevel: 8,
    order: 9,
    rect: cell(2, 2),
    isExpansion: true,
  },
];

/** A region's building slots, positioned inside the region footprint. */
export const SLOT_DEFINITIONS: readonly SlotDefinition[] = [
  // City centre — always available, community-focused.
  {
    id: 'center_community_1',
    regionId: 'city_center',
    position: { x: 445, y: 155 },
    size: 'community',
    unlockLevel: 1,
    allowedCategories: ['community'],
    order: 1,
    buildableInV1: true,
  },
  {
    id: 'center_community_2',
    regionId: 'city_center',
    position: { x: 555, y: 155 },
    size: 'medium',
    unlockLevel: 1,
    allowedCategories: ['community'],
    order: 2,
    buildableInV1: true,
  },
  // Residential — a small early slot so level 1 already invites a first project.
  {
    id: 'residential_small_1',
    regionId: 'residential',
    position: { x: 175, y: 375 },
    size: 'small',
    unlockLevel: 1,
    allowedCategories: ['community', 'nutrition'],
    order: 1,
    buildableInV1: true,
  },
  // Movement quarter (level 2).
  {
    id: 'movement_medium_1',
    regionId: 'movement_quarter',
    position: { x: 120, y: 155 },
    size: 'medium',
    unlockLevel: 2,
    allowedCategories: ['movement'],
    order: 1,
    buildableInV1: true,
  },
  {
    id: 'movement_small_1',
    regionId: 'movement_quarter',
    position: { x: 230, y: 155 },
    size: 'small',
    unlockLevel: 2,
    allowedCategories: ['movement'],
    order: 2,
    buildableInV1: true,
  },
  // Nutrition quarter (level 3).
  {
    id: 'nutrition_large_1',
    regionId: 'nutrition_quarter',
    position: { x: 770, y: 155 },
    size: 'large',
    unlockLevel: 3,
    allowedCategories: ['nutrition'],
    order: 1,
    buildableInV1: true,
  },
  {
    id: 'nutrition_small_1',
    regionId: 'nutrition_quarter',
    position: { x: 880, y: 155 },
    size: 'small',
    unlockLevel: 3,
    allowedCategories: ['nutrition'],
    order: 2,
    buildableInV1: true,
  },
  // Sustainability infrastructure (level 4).
  {
    id: 'sustainability_infra_1',
    regionId: 'sustainability_infra',
    position: { x: 770, y: 375 },
    size: 'infrastructure',
    unlockLevel: 4,
    allowedCategories: ['sustainability'],
    order: 1,
    buildableInV1: true,
  },
  {
    id: 'sustainability_small_1',
    regionId: 'sustainability_infra',
    position: { x: 880, y: 375 },
    size: 'small',
    unlockLevel: 4,
    allowedCategories: ['sustainability'],
    order: 2,
    buildableInV1: true,
  },
  // Nature reserve (level 5).
  {
    id: 'nature_project_1',
    regionId: 'nature_reserve',
    position: { x: 120, y: 595 },
    size: 'nature_project',
    unlockLevel: 5,
    allowedCategories: ['animal_welfare'],
    order: 1,
    buildableInV1: true,
  },
  {
    id: 'nature_project_2',
    regionId: 'nature_reserve',
    position: { x: 230, y: 595 },
    size: 'nature_project',
    unlockLevel: 5,
    allowedCategories: ['animal_welfare'],
    order: 2,
    buildableInV1: true,
  },
  // Culture quarter (level 6).
  {
    id: 'culture_community_1',
    regionId: 'culture_quarter',
    position: { x: 445, y: 375 },
    size: 'community',
    unlockLevel: 6,
    allowedCategories: ['community'],
    order: 1,
    buildableInV1: true,
  },
  {
    id: 'culture_medium_1',
    regionId: 'culture_quarter',
    position: { x: 555, y: 375 },
    size: 'medium',
    unlockLevel: 6,
    allowedCategories: ['community'],
    order: 2,
    buildableInV1: true,
  },
  // Water & forest (level 7) — a single nature project; the rest stays scenery.
  {
    id: 'water_project_1',
    regionId: 'water_forest',
    position: { x: 500, y: 595 },
    size: 'nature_project',
    unlockLevel: 7,
    allowedCategories: ['animal_welfare', 'sustainability'],
    order: 1,
    buildableInV1: true,
  },
  // Expansion — reserved outlook only; visible but never buildable in V1 (§17).
  {
    id: 'expansion_reserved_1',
    regionId: 'expansion',
    position: { x: 825, y: 595 },
    size: 'large',
    unlockLevel: 8,
    allowedCategories: ['community', 'nutrition', 'sustainability'],
    order: 1,
    buildableInV1: false,
  },
];

const REGION_BY_ID = new Map<RegionId, RegionDefinition>(REGION_DEFINITIONS.map((r) => [r.id, r]));
const SLOTS_BY_REGION = new Map<RegionId, SlotDefinition[]>();
for (const slot of SLOT_DEFINITIONS) {
  const list = SLOTS_BY_REGION.get(slot.regionId) ?? [];
  list.push(slot);
  SLOTS_BY_REGION.set(slot.regionId, list);
}
const SLOT_BY_ID = new Map<string, SlotDefinition>(SLOT_DEFINITIONS.map((s) => [s.id, s]));

/** Look up a region definition by id (undefined for unknown ids). */
export function getRegionDefinition(id: string): RegionDefinition | undefined {
  return REGION_BY_ID.get(id as RegionId);
}

/** Slots belonging to a region, in deterministic order. */
export function getRegionSlots(id: RegionId): readonly SlotDefinition[] {
  return (SLOTS_BY_REGION.get(id) ?? []).slice().sort((a, b) => a.order - b.order);
}

/** Look up a slot definition by id (undefined for unknown ids). */
export function getSlotDefinition(id: string): SlotDefinition | undefined {
  return SLOT_BY_ID.get(id);
}

/** Regions in deterministic display order. */
export function regionsInOrder(): readonly RegionDefinition[] {
  return REGION_DEFINITIONS.slice().sort((a, b) => a.order - b.order);
}
