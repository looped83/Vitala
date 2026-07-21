/** The four equal life areas. Canonical domain definition (framework-free). */
export type LifeArea = 'movement' | 'nutrition' | 'sustainability' | 'animal_welfare';

/** The four life areas in their canonical order (product-principles §2.3). */
export const LIFE_AREAS: readonly LifeArea[] = [
  'movement',
  'nutrition',
  'sustainability',
  'animal_welfare',
] as const;

export interface LifeAreaMeta {
  key: LifeArea;
  /** Short display label. */
  label: string;
  /** One-line description for the capture hub. */
  description: string;
  /** How this area is captured: a timed activity vs. a ritual check-in. */
  entryKind: 'activity' | 'ritual';
}

export const LIFE_AREA_META: Record<LifeArea, LifeAreaMeta> = {
  movement: {
    key: 'movement',
    label: 'Bewegung',
    description: 'Sport und Bewegung mit Dauer und Intensität erfassen.',
    entryKind: 'activity',
  },
  nutrition: {
    key: 'nutrition',
    label: 'Ernährung',
    description: 'Ein kurzes veganes Ernährungs-Check-in – ohne Kalorienzählen.',
    entryKind: 'ritual',
  },
  sustainability: {
    key: 'sustainability',
    label: 'Nachhaltigkeit',
    description: 'Nachhaltige Alltagshandlungen und größere Aktionen festhalten.',
    entryKind: 'ritual',
  },
  animal_welfare: {
    key: 'animal_welfare',
    label: 'Tierwohl',
    description: 'Handlungen für Tierwohl und Biodiversität dokumentieren.',
    entryKind: 'ritual',
  },
};

export const LIFE_AREA_LABEL: Record<LifeArea, string> = {
  movement: LIFE_AREA_META.movement.label,
  nutrition: LIFE_AREA_META.nutrition.label,
  sustainability: LIFE_AREA_META.sustainability.label,
  animal_welfare: LIFE_AREA_META.animal_welfare.label,
};

/** Is this a valid life area key? */
export function isLifeArea(value: string): value is LifeArea {
  return (LIFE_AREAS as readonly string[]).includes(value);
}
