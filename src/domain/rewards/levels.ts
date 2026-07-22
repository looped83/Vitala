/**
 * Level curves and titles (ADR-0003 / resources-and-xp §3–§4). Both streams use
 * progressive, linearly-increasing costs — transparent and testable:
 *
 *   personal: req(L) = 80 + 40·L    → total(N) = Σ req = 20·(N−1)·(N+4)
 *   city:     req(L) = 200 + 120·L  → total(N) = Σ req = 20·(N−1)·(3·N+10)
 *
 * The closed forms are exact; `level_definitions` in the database is generated
 * from the *same* formulas so client and server never disagree. Levels never
 * fall and never express health, discipline or a ranking (Prinzip 2.2/2.5).
 */

export type LevelScope = 'personal' | 'city';

/** Cumulative XP required to *reach* level `n` (n ≥ 1; level 1 = 0 XP). */
export function cumulativeXpForLevel(scope: LevelScope, n: number): number {
  const level = Math.max(1, Math.floor(n));
  if (level === 1) return 0;
  return scope === 'personal'
    ? 20 * (level - 1) * (level + 4)
    : 20 * (level - 1) * (3 * level + 10);
}

/** XP needed to advance from level `n` to `n+1` (req(n) = a + b·n). */
export function xpToNextLevel(scope: LevelScope, n: number): number {
  return cumulativeXpForLevel(scope, n + 1) - cumulativeXpForLevel(scope, n);
}

export interface LevelStatus {
  scope: LevelScope;
  level: number;
  title: string;
  /** Total XP in the stream. */
  totalXp: number;
  /** Cumulative XP at the current level's floor. */
  levelFloorXp: number;
  /** Cumulative XP at which the next level begins. */
  nextLevelXp: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP span of the current level (next − floor). */
  xpForLevel: number;
  /** XP still needed for the next level. */
  xpToNext: number;
  /** 0…1 progress within the current level (for the progress bar). */
  progress: number;
}

/** Highest level whose cumulative threshold is ≤ totalXp. Monotone, so a simple
 *  forward walk suffices; capped defensively to avoid runaway loops. */
export function levelForXp(scope: LevelScope, totalXp: number, maxLevel = 999): LevelStatus {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (level < maxLevel && cumulativeXpForLevel(scope, level + 1) <= xp) {
    level += 1;
  }
  const levelFloorXp = cumulativeXpForLevel(scope, level);
  const nextLevelXp = cumulativeXpForLevel(scope, level + 1);
  const xpForLevel = nextLevelXp - levelFloorXp;
  const xpIntoLevel = xp - levelFloorXp;
  return {
    scope,
    level,
    title: scope === 'personal' ? personalTitle(level) : cityTitle(level),
    totalXp: xp,
    levelFloorXp,
    nextLevelXp,
    xpIntoLevel,
    xpForLevel,
    xpToNext: Math.max(0, nextLevelXp - xp),
    progress: xpForLevel > 0 ? Math.min(1, xpIntoLevel / xpForLevel) : 1,
  };
}

interface TitleRange {
  min: number;
  title: string;
}

/** Personal titles (§18): calm, adult, non-competitive, never military. */
const PERSONAL_TITLES: readonly TitleRange[] = [
  { min: 1, title: 'Aufbruch' },
  { min: 5, title: 'Wegbereiter' },
  { min: 10, title: 'Gestalter' },
  { min: 15, title: 'Verbinder' },
  { min: 20, title: 'Zukunftspfleger' },
  { min: 30, title: 'Lebensraumgestalter' },
  { min: 40, title: 'Stadtentwickler' },
  { min: 50, title: 'Weltenhüter' },
];

/** City titles (§20): growth without size-fixation or a market framing. */
const CITY_TITLES: readonly TitleRange[] = [
  { min: 1, title: 'Keimzelle' },
  { min: 3, title: 'Grüne Siedlung' },
  { min: 5, title: 'Lebendiges Viertel' },
  { min: 8, title: 'Nachhaltige Stadt' },
  { min: 12, title: 'Vernetzte Stadt' },
  { min: 17, title: 'Grüne Metropole' },
  { min: 23, title: 'Lebenswerte Region' },
  { min: 30, title: 'Regenerative Welt' },
];

function titleFor(ranges: readonly TitleRange[], level: number): string {
  let title = ranges[0]?.title ?? '';
  for (const range of ranges) {
    if (level >= range.min) title = range.title;
  }
  return title;
}

export function personalTitle(level: number): string {
  return titleFor(PERSONAL_TITLES, level);
}

export function cityTitle(level: number): string {
  return titleFor(CITY_TITLES, level);
}

export interface LevelDefinition {
  scope: LevelScope;
  level: number;
  cumulativeXp: number;
  title: string;
}

/** Generate the definitions table for a stream (used by docs + seed parity). */
export function levelDefinitions(scope: LevelScope, maxLevel: number): LevelDefinition[] {
  const rows: LevelDefinition[] = [];
  for (let level = 1; level <= maxLevel; level += 1) {
    rows.push({
      scope,
      level,
      cumulativeXp: cumulativeXpForLevel(scope, level),
      title: scope === 'personal' ? personalTitle(level) : cityTitle(level),
    });
  }
  return rows;
}
