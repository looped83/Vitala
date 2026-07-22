import { describe, it, expect } from 'vitest';
import {
  previewMovementReward,
  previewRitualReward,
  rewardDelta,
  mergeResources,
  zeroReward,
} from './preview';

describe('previewMovementReward', () => {
  it('60 min strength shared → 15 XP, 8 city, 6 energy + 2 community', () => {
    const r = previewMovementReward({
      durationMin: 60,
      weight: 1.1,
      intensity: 'medium',
      isRegeneration: false,
      isShared: true,
      priorDailyXp: 0,
    });
    expect(r.personalXp).toBe(15);
    expect(r.cityXp).toBe(8);
    expect(r.resources).toContainEqual({ key: 'energy', amount: 6 });
    expect(r.resources).toContainEqual({ key: 'community', amount: 2 });
    expect(r.sharedBonus).toBe(true);
  });

  it('personal entry has no community bonus', () => {
    const r = previewMovementReward({
      durationMin: 45,
      weight: 1.0,
      intensity: 'medium',
      isRegeneration: false,
      isShared: false,
      priorDailyXp: 0,
    });
    expect(r.sharedBonus).toBe(false);
    expect(r.resources.find((g) => g.key === 'community')).toBeUndefined();
  });

  it('respects the shared community daily remaining', () => {
    const r = previewMovementReward({
      durationMin: 45,
      weight: 1.0,
      intensity: 'medium',
      isRegeneration: false,
      isShared: true,
      priorDailyXp: 0,
      sharedCommunityRemaining: 1,
    });
    expect(r.resources).toContainEqual({ key: 'community', amount: 1 });
  });
});

describe('previewRitualReward', () => {
  it('nutrition 6 blocks → capped at 12 XP, 6 city, 5 food', () => {
    const r = previewRitualReward({
      area: 'nutrition',
      kinds: Array(6).fill('daily_block'),
      isShared: false,
      priorDailyXp: 0,
      priorSpecialXp: 0,
    });
    expect(r.personalXp).toBe(12);
    expect(r.cityXp).toBe(6);
    expect(r.resources).toContainEqual({ key: 'food', amount: 5 });
  });

  it('sustainability special action → 5 XP, 3 city, 2 nature', () => {
    const r = previewRitualReward({
      area: 'sustainability',
      kinds: ['special_action'],
      isShared: false,
      priorDailyXp: 10,
      priorSpecialXp: 0,
    });
    expect(r.personalXp).toBe(5);
    expect(r.cityXp).toBe(3);
    expect(r.resources).toContainEqual({ key: 'nature', amount: 2 });
  });
});

describe('rewardDelta — corrections (§41)', () => {
  it('reducing duration produces a negative correction', () => {
    const before = previewMovementReward({
      durationMin: 60,
      weight: 1.0,
      intensity: 'medium',
      isRegeneration: false,
      isShared: false,
      priorDailyXp: 0,
    });
    const after = previewMovementReward({
      durationMin: 30,
      weight: 1.0,
      intensity: 'medium',
      isRegeneration: false,
      isShared: false,
      priorDailyXp: 0,
    });
    const delta = rewardDelta(before, after);
    expect(delta.personalXp).toBeLessThan(0);
    expect(delta.cityXp).toBeLessThanOrEqual(0);
  });

  it('deletion (delta to zero-award) is fully negative', () => {
    const before = previewMovementReward({
      durationMin: 60,
      weight: 1.0,
      intensity: 'medium',
      isRegeneration: false,
      isShared: false,
      priorDailyXp: 0,
    });
    const delta = rewardDelta(before, zeroReward('movement'));
    expect(delta.personalXp).toBe(-before.personalXp);
  });
});

describe('mergeResources', () => {
  it('sums same-key grants and drops zeros', () => {
    expect(
      mergeResources([
        { key: 'nature', amount: 1 },
        { key: 'nature', amount: 2 },
        { key: 'energy', amount: 0 },
      ]),
    ).toEqual([{ key: 'nature', amount: 3 }]);
  });
});
