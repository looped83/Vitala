import { getRegionSlots, regionsInOrder, REGION_DEFINITIONS, SLOT_DEFINITIONS } from './layout';
import type {
  NextUnlock,
  RegionDefinition,
  RegionStatus,
  RegionView,
  SlotDefinition,
  SlotStatus,
  SlotView,
} from './types';

/**
 * Deterministic mapping from city level → visible development. All state is
 * *derived* from the current city level (ADR-0041): unlocks never fall because
 * the level never falls, and the server additionally guards the highest reached
 * level (§14). No client can set an unlock directly.
 */

export interface DevelopmentStage {
  /** Stage number == city level (1-based). */
  stage: number;
  title: string;
  description: string;
}

interface StageBand {
  minLevel: number;
  title: string;
  description: string;
}

/** The first (always-valid) band, also the safe default for level 1. */
const STAGE_KEIMZELLE: StageBand = {
  minLevel: 1,
  title: 'Keimzelle',
  description: 'Stadtzentrum und Wohngebiet mit ersten Wegen und einer kleinen Grünfläche.',
};

/** Narrative development-stage titles per level (§13). Levels 9+ reuse the last
 *  band; the structure stays scalable without inventing undocumented content. */
const STAGE_META: readonly StageBand[] = [
  STAGE_KEIMZELLE,
  {
    minLevel: 2,
    title: 'Erste Bewegung',
    description: 'Das Sportviertel entsteht – Wege, Bewegungsflächen und ein kleiner Park.',
  },
  {
    minLevel: 3,
    title: 'Grüne Versorgung',
    description: 'Das Garten- & Ernährungsviertel öffnet mit Beeten und einer Marktfläche.',
  },
  {
    minLevel: 4,
    title: 'Nachhaltige Wege',
    description: 'Nachhaltigkeitsinfrastruktur verbindet die Viertel mit grünen Wegen.',
  },
  {
    minLevel: 5,
    title: 'Lebensräume',
    description: 'Das Naturschutzgebiet bringt Wildblumen, Hecken und einen Teich.',
  },
  {
    minLevel: 6,
    title: 'Lebendiges Viertel',
    description: 'Das Bildungs- & Kulturviertel wird zum Ort für Gemeinschaft und Rituale.',
  },
  {
    minLevel: 7,
    title: 'Wald & Wasser',
    description: 'Das Wasser- & Waldgebiet wird als Erholungs- und Naturraum zugänglich.',
  },
  {
    minLevel: 8,
    title: 'Vernetzte Region',
    description: 'Das Umland wird erschlossen und verbindet die Stadt mit ihrer Umgebung.',
  },
  {
    minLevel: 9,
    title: 'Verdichtete Stadt',
    description: 'Bestehende Bereiche verdichten sich – mehr Wege, Grün und Bauflächen.',
  },
  {
    minLevel: 13,
    title: 'Wachsende Welt',
    description: 'Die Stadt bleibt offen für weitere Erweiterungen und Projekte.',
  },
];

/** The development stage for a given (already floored) city level. */
export function developmentStageForLevel(level: number): DevelopmentStage {
  const lvl = Math.max(1, Math.floor(level));
  let meta: StageBand = STAGE_KEIMZELLE;
  for (const entry of STAGE_META) {
    if (lvl >= entry.minLevel) meta = entry;
  }
  return { stage: lvl, title: meta.title, description: meta.description };
}

/** Is a region unlocked at this city level? */
export function isRegionUnlocked(region: RegionDefinition, currentLevel: number): boolean {
  return currentLevel >= region.unlockLevel;
}

/** Derived status of a region. `seenLevel` marks the last level the viewer has
 *  acknowledged, so a freshly-crossed unlock reads as "newly unlocked" (§33). */
export function regionStatus(
  region: RegionDefinition,
  currentLevel: number,
  seenLevel: number,
): RegionStatus {
  if (!isRegionUnlocked(region, currentLevel)) return 'locked';
  // A start region (unlock ≤ 1) is never surfaced as "new".
  if (region.unlockLevel > 1 && region.unlockLevel > seenLevel) return 'newly_unlocked';
  return 'available';
}

/** Derived status of a slot. In V1 nothing is built, so a slot is available,
 *  reserved (visible outlook, not buildable yet) or locked. */
export function slotStatus(slot: SlotDefinition, currentLevel: number): SlotStatus {
  if (currentLevel < slot.unlockLevel) return 'locked';
  return slot.buildableInV1 ? 'available' : 'reserved';
}

/** Build the slot presentation models for a region at a given level. */
function slotViewsFor(regionId: RegionDefinition['id'], currentLevel: number): SlotView[] {
  return getRegionSlots(regionId).map((definition) => ({
    definition,
    status: slotStatus(definition, currentLevel),
  }));
}

/** Full region presentation model (definition + derived state + slots). */
export function regionView(
  region: RegionDefinition,
  currentLevel: number,
  seenLevel: number,
): RegionView {
  const slots = slotViewsFor(region.id, currentLevel);
  return {
    definition: region,
    status: regionStatus(region, currentLevel, seenLevel),
    slots,
    availableSlots: slots.filter((s) => s.status === 'available').length,
  };
}

/** All regions as presentation models, in display order. */
export function regionViews(currentLevel: number, seenLevel: number): RegionView[] {
  return regionsInOrder().map((region) => regionView(region, currentLevel, seenLevel));
}

/** Regions unlocked since `seenLevel` (for the calm unlock banner, §33). */
export function newlyUnlockedRegions(currentLevel: number, seenLevel: number): RegionDefinition[] {
  return regionsInOrder().filter(
    (region) =>
      region.unlockLevel > 1 &&
      region.unlockLevel <= currentLevel &&
      region.unlockLevel > seenLevel,
  );
}

/** The next region to unlock above the current level, if any (§35/§62). */
export function nextUnlock(currentLevel: number): NextUnlock | null {
  const upcoming = regionsInOrder()
    .filter((region) => region.unlockLevel > currentLevel)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];
  if (!upcoming) return null;
  return {
    regionId: upcoming.id,
    title: upcoming.title,
    unlockLevel: upcoming.unlockLevel,
    levelsAway: upcoming.unlockLevel - currentLevel,
  };
}

/** Count of regions currently unlocked (for the world status, §36). */
export function unlockedRegionCount(currentLevel: number): number {
  return REGION_DEFINITIONS.filter((r) => isRegionUnlocked(r, currentLevel)).length;
}

/** Count of building slots currently available across the whole city (§36). */
export function availableSlotCount(currentLevel: number): number {
  return SLOT_DEFINITIONS.filter((s) => slotStatus(s, currentLevel) === 'available').length;
}
