import type { LifeArea } from '@/domain/activity/areas';
import { LIFE_AREAS } from '@/domain/activity/areas';
import type { MissionDefinition, MissionSelectionContext } from './types';

/**
 * Deterministic, rule-based mission selection (§28–§29, missions-and-goals
 * §7.3). No ML, no external service, no free-text analysis. Given the same
 * context and pool the result is stable, so the server and any preview agree.
 *
 * Priority (high → low), implemented as additive scoring + hard filters:
 *   1. Exhaustion protection — drop demanding movement after a capped day.
 *   2. Repetition avoidance — drop anything in the recent cooldown window.
 *   3. Day form — little time drops long missions; regeneration wish prefers
 *      gentle missions and drops demanding ones.
 *   4. Balance steering — least-covered areas score highest.
 *   5. Focus wish + active-goal areas — mild preference.
 *   6. Difficulty fit — gentle when energy is low, fuller when high.
 */

const AREA_SCORE_WEIGHT = 100;
const FOCUS_BONUS = 40;
const GOAL_AREA_BONUS = 15;
const DIFFICULTY_FIT_BONUS = 20;

function timeBudgetMinutes(budget: MissionSelectionContext['dayForm']): number {
  const b = budget?.timeBudget;
  if (b === 'little') return 15;
  if (b === 'some') return 45;
  if (b === 'plenty') return 120;
  return Number.POSITIVE_INFINITY;
}

/** Areas ranked by *fewest* weekly contributions first (balance steering). */
export function areasByNeed(weeklyByArea: Record<LifeArea, number>): LifeArea[] {
  return [...LIFE_AREAS].sort((a, b) => (weeklyByArea[a] ?? 0) - (weeklyByArea[b] ?? 0));
}

function passesHardFilters(def: MissionDefinition, ctx: MissionSelectionContext): boolean {
  if (!def.isActive || def.scope !== ctx.scope || def.period !== ctx.period) return false;
  if (ctx.recentKeys.includes(def.key)) return false; // rule 2
  if (ctx.movementExhausted && def.demanding && def.area === 'movement') return false; // rule 1
  if (ctx.dayForm?.wantsRegeneration && def.demanding) return false; // rule 3
  const available = timeBudgetMinutes(ctx.dayForm);
  if (def.minMinutes && def.minMinutes > available) return false; // rule 3
  return true;
}

function score(def: MissionDefinition, ctx: MissionSelectionContext): number {
  let value = 0;
  // Rule 4 — balance steering: rank of the mission's area among least-covered.
  const ranked = areasByNeed(ctx.weeklyByArea);
  if (def.area) {
    const rank = ranked.indexOf(def.area); // 0 = least covered
    value += (LIFE_AREAS.length - rank) * AREA_SCORE_WEIGHT;
  } else {
    value += 2 * AREA_SCORE_WEIGHT; // cross-area missions score mid-high
  }
  // Rule 5 — focus wish + active-goal areas.
  if (def.area && ctx.dayForm?.focusArea === def.area) value += FOCUS_BONUS;
  if (def.area && ctx.activeGoalAreas.includes(def.area)) value += GOAL_AREA_BONUS;
  // Rule 6 — difficulty fit to energy.
  const energy = ctx.dayForm?.energy;
  if (energy === 'low' && def.difficulty === 'leicht') value += DIFFICULTY_FIT_BONUS;
  if (energy === 'high' && def.difficulty !== 'leicht') value += DIFFICULTY_FIT_BONUS;
  return value;
}

/**
 * Pick the best mission from `pool`, excluding `excludeKeys` (used by swap to
 * guarantee a *different* mission). Ties broken deterministically by seed then
 * key, so there is no randomness. Returns null when nothing qualifies.
 */
export function selectMission(
  pool: readonly MissionDefinition[],
  ctx: MissionSelectionContext,
  excludeKeys: readonly string[] = [],
): MissionDefinition | null {
  const excluded = new Set(excludeKeys);
  const candidates = pool
    .filter((def) => !excluded.has(def.key) && passesHardFilters(def, ctx))
    .map((def) => ({ def, s: score(def, ctx) }));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    // Stable, seed-rotated tie-break — avoids always picking the same key.
    const ah = (hashKey(a.def.key) + ctx.seed) % 1000;
    const bh = (hashKey(b.def.key) + ctx.seed) % 1000;
    if (ah !== bh) return ah - bh;
    return a.def.key.localeCompare(b.def.key);
  });
  return candidates[0]?.def ?? null;
}

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) % 1_000_000;
  }
  return h;
}
