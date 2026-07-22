import { describe, it, expect } from 'vitest';
import {
  movementBaseXp,
  movementXp,
  ritualCheckinRawXp,
  applyAreaCap,
  cityXpFor,
  primaryResourceGrant,
  specialCapForArea,
} from './xp';
import { roundHalfAwayFromZero } from './constants';

describe('movementBaseXp — duration buckets (resources-and-xp §2)', () => {
  it.each([
    [5, 4],
    [10, 4],
    [11, 6],
    [20, 6],
    [21, 9],
    [35, 9],
    [36, 12],
    [55, 12],
    [56, 14],
    [80, 14],
    [81, 15],
    [120, 15],
    [121, 15],
    [300, 15],
  ])('%i min → base %i', (minutes, base) => {
    expect(movementBaseXp(minutes)).toBe(base);
  });
});

describe('movementXp — weight, intensity, regeneration', () => {
  it('60 min strength (weight 1.1, medium) → 15 XP (spec example)', () => {
    expect(movementXp({ durationMin: 60, weight: 1.1, intensity: 'medium', isRegeneration: false })).toBe(15);
  });

  it('120 min hiking (weight 1.05) → round(15×1.05)=16 (spec example)', () => {
    expect(movementXp({ durationMin: 120, weight: 1.05, intensity: 'medium', isRegeneration: false })).toBe(16);
  });

  it('45 min yoga (weight 1.0, medium) → 12 (spec example)', () => {
    expect(movementXp({ durationMin: 45, weight: 1.0, intensity: 'medium', isRegeneration: false })).toBe(12);
  });

  it('15 min walk (weight 1.0) → 6 (spec example)', () => {
    expect(movementXp({ durationMin: 15, weight: 1.0, intensity: 'medium', isRegeneration: false })).toBe(6);
  });

  it('regeneration is a fixed 6 XP regardless of duration', () => {
    expect(movementXp({ durationMin: 5, weight: 1.0, intensity: null, isRegeneration: true })).toBe(6);
    expect(movementXp({ durationMin: 90, weight: 1.1, intensity: 'intense', isRegeneration: true })).toBe(6);
  });

  it('intensity is a small factor and never outweighs the duration bucket', () => {
    const light = movementXp({ durationMin: 60, weight: 1.1, intensity: 'light', isRegeneration: false });
    const intense = movementXp({ durationMin: 60, weight: 1.1, intensity: 'intense', isRegeneration: false });
    // Same weight + intensity: a longer duration bucket is always ≥.
    const shorter = movementXp({ durationMin: 60, weight: 1.0, intensity: 'medium', isRegeneration: false });
    const longer = movementXp({ durationMin: 90, weight: 1.0, intensity: 'medium', isRegeneration: false });
    expect(intense - light).toBeLessThanOrEqual(3);
    expect(longer).toBeGreaterThanOrEqual(shorter);
  });
});

describe('ritualCheckinRawXp', () => {
  it('daily blocks are 2 XP each', () => {
    expect(ritualCheckinRawXp(['daily_block', 'daily_block', 'daily_block'])).toEqual({ dailyXp: 6, specialXp: 0 });
  });
  it('special actions are 5 XP and tracked separately', () => {
    expect(ritualCheckinRawXp(['special_action'])).toEqual({ dailyXp: 0, specialXp: 5 });
    expect(ritualCheckinRawXp(['daily_block', 'special_action'])).toEqual({ dailyXp: 2, specialXp: 5 });
  });
});

describe('applyAreaCap — daily limits (§8)', () => {
  it('trims nutrition to the 12/day cap and flags capped', () => {
    const r = applyAreaCap({ area: 'nutrition', rawDailyXp: 16, rawSpecialXp: 0, priorDailyXp: 0, priorSpecialXp: 0 });
    expect(r.awarded).toBe(12);
    expect(r.capped).toBe(true);
  });
  it('respects prior awarded XP within the day', () => {
    const r = applyAreaCap({ area: 'movement', rawDailyXp: 20, rawSpecialXp: 0, priorDailyXp: 20, priorSpecialXp: 0 });
    expect(r.awarded).toBe(10); // 30 cap − 20 prior
    expect(r.capped).toBe(true);
  });
  it('never awards negative when already over cap', () => {
    const r = applyAreaCap({ area: 'nutrition', rawDailyXp: 4, rawSpecialXp: 0, priorDailyXp: 12, priorSpecialXp: 0 });
    expect(r.awarded).toBe(0);
  });
  it('special actions add above the ordinary cap (sustainability)', () => {
    const r = applyAreaCap({ area: 'sustainability', rawDailyXp: 10, rawSpecialXp: 5, priorDailyXp: 10, priorSpecialXp: 0 });
    expect(r.dailyAwarded).toBe(0);
    expect(r.specialAwarded).toBe(5);
    expect(r.awarded).toBe(5);
  });
  it('special headroom is capped at 5/day and further specials add nothing', () => {
    const r = applyAreaCap({ area: 'animal_welfare', rawDailyXp: 0, rawSpecialXp: 10, priorDailyXp: 0, priorSpecialXp: 5 });
    expect(r.specialAwarded).toBe(0);
  });
  it('movement and nutrition have no special headroom', () => {
    expect(specialCapForArea('movement')).toBe(0);
    expect(specialCapForArea('nutrition')).toBe(0);
    expect(specialCapForArea('sustainability')).toBe(5);
  });
});

describe('cityXpFor & primaryResourceGrant', () => {
  it('city XP is round(0.5 × personal), half away from zero', () => {
    expect(cityXpFor(15)).toBe(8); // 7.5 → 8
    expect(cityXpFor(12)).toBe(6);
    expect(cityXpFor(5)).toBe(3); // 2.5 → 3
  });
  it('resource grant is round(xp × 0.4) of the area primary', () => {
    expect(primaryResourceGrant('movement', 15)).toEqual({ key: 'energy', amount: 6 });
    expect(primaryResourceGrant('nutrition', 12)).toEqual({ key: 'food', amount: 5 }); // 4.8 → 5
    expect(primaryResourceGrant('sustainability', 6)).toEqual({ key: 'nature', amount: 2 }); // 2.4 → 2
    expect(primaryResourceGrant('animal_welfare', 5)).toEqual({ key: 'nature', amount: 2 });
  });
});

describe('roundHalfAwayFromZero (PostgreSQL round parity)', () => {
  it.each([
    [2.5, 3],
    [7.5, 8],
    [-2.5, -3],
    [2.4, 2],
    [0, 0],
  ])('round(%d) = %d', (input, output) => {
    expect(roundHalfAwayFromZero(input)).toBe(output);
  });
});
