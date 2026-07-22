import { describe, it, expect } from 'vitest';
import {
  cumulativeXpForLevel,
  xpToNextLevel,
  levelForXp,
  personalTitle,
  cityTitle,
  levelDefinitions,
} from './levels';

describe('personal level curve — req(L)=80+40L (ADR-0003)', () => {
  it.each([
    [1, 0],
    [2, 120],
    [3, 280],
    [4, 480],
    [5, 720],
    [6, 1000],
  ])('cumulative XP to reach level %i = %i', (level, xp) => {
    expect(cumulativeXpForLevel('personal', level)).toBe(xp);
  });

  it('req(L) increases linearly by 40', () => {
    expect(xpToNextLevel('personal', 1)).toBe(120);
    expect(xpToNextLevel('personal', 2)).toBe(160);
    expect(xpToNextLevel('personal', 3)).toBe(200);
    expect(xpToNextLevel('personal', 3) - xpToNextLevel('personal', 2)).toBe(40);
  });
});

describe('city level curve — req_city(L)=200+120L', () => {
  it.each([
    [1, 0],
    [2, 320],
    [3, 760],
    [4, 1320],
  ])('cumulative city XP to reach level %i = %i', (level, xp) => {
    expect(cumulativeXpForLevel('city', level)).toBe(xp);
  });
});

describe('levelForXp', () => {
  it('maps XP to the correct level and progress', () => {
    const s = levelForXp('personal', 200);
    expect(s.level).toBe(2); // 120 ≤ 200 < 280
    expect(s.levelFloorXp).toBe(120);
    expect(s.nextLevelXp).toBe(280);
    expect(s.xpIntoLevel).toBe(80);
    expect(s.xpForLevel).toBe(160);
    expect(s.xpToNext).toBe(80);
    expect(s.progress).toBeCloseTo(0.5, 5);
  });

  it('level 1 at 0 XP with title Aufbruch', () => {
    const s = levelForXp('personal', 0);
    expect(s.level).toBe(1);
    expect(s.title).toBe('Aufbruch');
    expect(s.progress).toBe(0);
  });

  it('exact threshold lands on the new level', () => {
    expect(levelForXp('personal', 120).level).toBe(2);
    expect(levelForXp('personal', 280).level).toBe(3);
  });

  it('city XP maps onto the flatter city curve', () => {
    expect(levelForXp('city', 320).level).toBe(2);
    expect(levelForXp('city', 319).level).toBe(1);
  });
});

describe('titles (§18/§20)', () => {
  it('personal titles change at the documented boundaries', () => {
    expect(personalTitle(4)).toBe('Aufbruch');
    expect(personalTitle(5)).toBe('Wegbereiter');
    expect(personalTitle(10)).toBe('Gestalter');
    expect(personalTitle(50)).toBe('Weltenhüter');
  });
  it('city titles change at the documented boundaries', () => {
    expect(cityTitle(1)).toBe('Keimzelle');
    expect(cityTitle(5)).toBe('Lebendiges Viertel');
    expect(cityTitle(30)).toBe('Regenerative Welt');
  });
});

describe('levelDefinitions parity', () => {
  it('produces monotonically increasing thresholds', () => {
    const defs = levelDefinitions('personal', 50);
    expect(defs).toHaveLength(50);
    for (let i = 1; i < defs.length; i += 1) {
      expect(defs[i]!.cumulativeXp).toBeGreaterThan(defs[i - 1]!.cumulativeXp);
    }
    expect(defs[0]!.cumulativeXp).toBe(0);
  });
});
