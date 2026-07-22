import { describe, it, expect } from 'vitest';
import { missionReward, goalReward, ritualCompletionXp, checkinXp } from './events';

describe('missionReward (§34)', () => {
  it('personal daily → 8 XP, 4 city, 1 primary resource', () => {
    expect(missionReward('personal', 'day', 'movement')).toEqual({
      personalXp: 8,
      cityXp: 4,
      resources: [{ key: 'energy', amount: 1 }],
    });
  });
  it('shared daily → 6 XP, 10 city, primary + community', () => {
    const r = missionReward('shared', 'day', 'nutrition');
    expect(r.personalXp).toBe(6);
    expect(r.cityXp).toBe(10);
    expect(r.resources).toContainEqual({ key: 'food', amount: 1 });
    expect(r.resources).toContainEqual({ key: 'community', amount: 1 });
  });
  it('shared weekly → 15 XP, 30 city, 3 primary + 2 community', () => {
    const r = missionReward('shared', 'week', 'sustainability');
    expect(r.personalXp).toBe(15);
    expect(r.cityXp).toBe(30);
    expect(r.resources).toContainEqual({ key: 'nature', amount: 3 });
    expect(r.resources).toContainEqual({ key: 'community', amount: 2 });
  });
});

describe('goalReward (§39)', () => {
  it('personal → 15 XP, 8 city, 2 primary', () => {
    expect(goalReward('personal', 'movement')).toEqual({
      personalXp: 15,
      cityXp: 8,
      resources: [{ key: 'energy', amount: 2 }],
    });
  });
  it('shared → 10 XP, 20 city, 2 primary + 2 community', () => {
    const r = goalReward('shared', 'nutrition');
    expect(r.personalXp).toBe(10);
    expect(r.cityXp).toBe(20);
    expect(r.resources).toContainEqual({ key: 'community', amount: 2 });
  });
});

describe('ritual & check-in XP (§40)', () => {
  it('first ritual of the day is 2 XP, further are 1, capped at 6', () => {
    expect(ritualCompletionXp(0, 0)).toBe(2);
    expect(ritualCompletionXp(1, 2)).toBe(1);
    expect(ritualCompletionXp(5, 6)).toBe(0);
  });
  it('check-in is 1 XP, capped at 2/day', () => {
    expect(checkinXp(0)).toBe(1);
    expect(checkinXp(1)).toBe(1);
    expect(checkinXp(2)).toBe(0);
  });
});
