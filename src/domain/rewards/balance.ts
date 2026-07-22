import type { LifeArea } from '@/domain/activity/areas';
import { LIFE_AREAS } from '@/domain/activity/areas';
import type { ResourceGrant } from './xp';

/**
 * Weekly balance (§35–§37). The four life areas are equal; a week is described
 * — never graded. There is no negative stage and no malus. A household earns a
 * balance bonus **at most once per calendar week**, additive and loss-free.
 *
 * This graduated bonus is the phase-specific rule (task §37) and supersedes the
 * single-tier bonus sketched in resources-and-xp §7 for THIS phase; direct
 * building-material production stays deferred to the Phase 6/7 weekly close
 * (documented in docs/decisions/0037-balance-bonus.md).
 */

export type BalanceStage = 0 | 1 | 2 | 3 | 4;

/** Which areas had at least one qualifying entry in the week. */
export function activeAreas(byArea: Record<LifeArea, number>): LifeArea[] {
  return LIFE_AREAS.filter((area) => (byArea[area] ?? 0) > 0);
}

export function balanceStage(byArea: Record<LifeArea, number>): BalanceStage {
  return activeAreas(byArea).length as BalanceStage;
}

/** Neutral, appreciative stage names (§36) — never "unbalanced". */
export const BALANCE_STAGE_LABEL: Record<BalanceStage, string> = {
  0: 'Noch offen',
  1: 'Schwerpunktwoche',
  2: 'Vielseitige Woche',
  3: 'Ausgewogene Woche',
  4: 'Ganzheitliche Woche',
};

/** One-line neutral description of the week's balance for screen readers + UI. */
export function balanceStageDescription(stage: BalanceStage): string {
  switch (stage) {
    case 0:
      return 'Diese Woche wurde noch nichts erfasst.';
    case 1:
      return 'Diese Woche lag der Schwerpunkt auf einem Bereich.';
    case 2:
      return 'Diese Woche waren zwei Bereiche vertreten.';
    case 3:
      return 'Diese Woche waren drei Bereiche ausgewogen vertreten.';
    case 4:
      return 'Diese Woche waren alle vier Bereiche vertreten.';
  }
}

export interface BalanceBonus {
  stage: BalanceStage;
  cityXp: number;
  /** Personal XP granted to each member who contributed this week (§37). */
  personalXpPerMember: number;
  resources: ResourceGrant[];
  /** True when the stage earns any reward at all (stages 3–4). */
  hasBonus: boolean;
}

/**
 * Balance bonus for a completed / safely-reached week (§37). `bothContributed`
 * gates the small shared personal XP so it rewards genuine cooperation.
 */
export function balanceBonus(stage: BalanceStage, bothContributed: boolean): BalanceBonus {
  const personalXpPerMember = stage >= 3 && bothContributed ? 5 : 0;
  if (stage === 4) {
    return {
      stage,
      cityXp: 20,
      personalXpPerMember,
      resources: [
        { key: 'nature', amount: 1 },
        { key: 'community', amount: 2 },
      ],
      hasBonus: true,
    };
  }
  if (stage === 3) {
    return {
      stage,
      cityXp: 10,
      personalXpPerMember,
      resources: [{ key: 'community', amount: 1 }],
      hasBonus: true,
    };
  }
  return { stage, cityXp: 0, personalXpPerMember: 0, resources: [], hasBonus: false };
}
