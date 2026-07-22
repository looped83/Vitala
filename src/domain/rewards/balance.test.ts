import { describe, it, expect } from 'vitest';
import { activeAreas, balanceStage, balanceBonus, BALANCE_STAGE_LABEL } from './balance';

const areas = (m: number, n: number, s: number, a: number) => ({
  movement: m,
  nutrition: n,
  sustainability: s,
  animal_welfare: a,
});

describe('balance stage (§36)', () => {
  it('counts distinct active areas', () => {
    expect(balanceStage(areas(0, 0, 0, 0))).toBe(0);
    expect(balanceStage(areas(3, 0, 0, 0))).toBe(1);
    expect(balanceStage(areas(1, 1, 0, 0))).toBe(2);
    expect(balanceStage(areas(1, 1, 1, 0))).toBe(3);
    expect(balanceStage(areas(1, 1, 1, 1))).toBe(4);
  });
  it('lists the active areas in canonical order', () => {
    expect(activeAreas(areas(1, 0, 1, 0))).toEqual(['movement', 'sustainability']);
  });
  it('uses only neutral, non-negative labels', () => {
    expect(BALANCE_STAGE_LABEL[4]).toBe('Ganzheitliche Woche');
    expect(Object.values(BALANCE_STAGE_LABEL).join(' ')).not.toMatch(
      /unausgewogen|schlecht|zu wenig/i,
    );
  });
});

describe('balance bonus (§37) — additive, loss-free, once per week', () => {
  it('no bonus below three areas', () => {
    expect(balanceBonus(0, true).hasBonus).toBe(false);
    expect(balanceBonus(2, true).hasBonus).toBe(false);
    expect(balanceBonus(2, true).cityXp).toBe(0);
  });
  it('three areas → 10 city XP + 1 community', () => {
    const b = balanceBonus(3, false);
    expect(b.cityXp).toBe(10);
    expect(b.resources).toEqual([{ key: 'community', amount: 1 }]);
    expect(b.personalXpPerMember).toBe(0);
  });
  it('four areas → 20 city XP + 1 nature + 2 community', () => {
    const b = balanceBonus(4, false);
    expect(b.cityXp).toBe(20);
    expect(b.resources).toEqual([
      { key: 'nature', amount: 1 },
      { key: 'community', amount: 2 },
    ]);
  });
  it('both-contributed adds 5 personal XP each at stages 3–4 only', () => {
    expect(balanceBonus(4, true).personalXpPerMember).toBe(5);
    expect(balanceBonus(3, true).personalXpPerMember).toBe(5);
    expect(balanceBonus(2, true).personalXpPerMember).toBe(0);
  });
});
