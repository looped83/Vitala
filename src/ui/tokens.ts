/**
 * Typed token references for JS-side use (e.g. inline SVG fills, charts in later
 * phases). These point at the CSS custom properties defined in
 * src/styles/tokens.css — they do NOT duplicate the colour values, so themes
 * and balancing tweaks stay in one place (design-system §18.8).
 */
export const cssVar = {
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  surface2: 'var(--color-surface-2)',
  surfaceElevated: 'var(--color-surface-elevated)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  border: 'var(--color-border)',
  primary: 'var(--color-primary)',
  accent: 'var(--color-accent)',
  focus: 'var(--color-focus)',
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  attention: 'var(--color-attention)',
  movement: 'var(--color-movement)',
  nutrition: 'var(--color-nutrition)',
  sustainability: 'var(--color-sustainability)',
  animalWelfare: 'var(--color-animal-welfare)',
} as const;

/** The four equal life areas (product-principles §2.3). */
export const LIFE_AREAS = ['movement', 'nutrition', 'sustainability', 'animal_welfare'] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export const lifeAreaColorVar: Record<LifeArea, string> = {
  movement: cssVar.movement,
  nutrition: cssVar.nutrition,
  sustainability: cssVar.sustainability,
  animal_welfare: cssVar.animalWelfare,
};
