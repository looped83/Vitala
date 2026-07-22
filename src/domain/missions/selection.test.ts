import { describe, it, expect } from 'vitest';
import { selectMission, areasByNeed } from './selection';
import type { MissionDefinition, MissionSelectionContext } from './types';

const def = (over: Partial<MissionDefinition>): MissionDefinition => ({
  key: 'k',
  title: 't',
  description: 'd',
  area: 'movement',
  scope: 'personal',
  period: 'day',
  measurement: 'activity_count',
  targetValue: 1,
  difficulty: 'normal',
  isActive: true,
  ...over,
});

const ctx = (over: Partial<MissionSelectionContext>): MissionSelectionContext => ({
  scope: 'personal',
  period: 'day',
  weeklyByArea: { movement: 0, nutrition: 0, sustainability: 0, animal_welfare: 0 },
  activeGoalAreas: [],
  recentKeys: [],
  movementExhausted: false,
  dayForm: null,
  seed: 1,
  ...over,
});

describe('areasByNeed', () => {
  it('ranks least-covered areas first', () => {
    const ranked = areasByNeed({ movement: 5, nutrition: 0, sustainability: 2, animal_welfare: 1 });
    expect(ranked[0]).toBe('nutrition');
    expect(ranked[ranked.length - 1]).toBe('movement');
  });
});

describe('selectMission — hard filters', () => {
  it('skips missions in the recent cooldown window (rule 2)', () => {
    const pool = [def({ key: 'a' }), def({ key: 'b', area: 'nutrition' })];
    const result = selectMission(
      pool,
      ctx({
        recentKeys: ['b'],
        weeklyByArea: { movement: 5, nutrition: 0, sustainability: 5, animal_welfare: 5 },
      }),
    );
    expect(result?.key).toBe('a');
  });

  it('drops demanding movement under exhaustion protection (rule 1)', () => {
    const pool = [def({ key: 'hard', demanding: true }), def({ key: 'calm', area: 'nutrition' })];
    const result = selectMission(pool, ctx({ movementExhausted: true }));
    expect(result?.key).toBe('calm');
  });

  it('drops demanding missions when regeneration is wished (rule 3)', () => {
    const pool = [def({ key: 'hard', demanding: true }), def({ key: 'soft', area: 'nutrition' })];
    const result = selectMission(
      pool,
      ctx({
        dayForm: { energy: 'low', timeBudget: 'some', focusArea: null, wantsRegeneration: true },
      }),
    );
    expect(result?.key).toBe('soft');
  });

  it('drops long missions when time budget is little (rule 3)', () => {
    const pool = [
      def({ key: 'long', minMinutes: 30 }),
      def({ key: 'short', area: 'nutrition', minMinutes: 5 }),
    ];
    const result = selectMission(
      pool,
      ctx({
        dayForm: {
          energy: 'medium',
          timeBudget: 'little',
          focusArea: null,
          wantsRegeneration: false,
        },
      }),
    );
    expect(result?.key).toBe('short');
  });

  it('returns null when nothing qualifies', () => {
    expect(selectMission([def({ isActive: false })], ctx({}))).toBeNull();
  });
});

describe('selectMission — scoring', () => {
  it('prefers the least-covered area (rule 4)', () => {
    const pool = [def({ key: 'mov', area: 'movement' }), def({ key: 'nut', area: 'nutrition' })];
    const result = selectMission(
      pool,
      ctx({ weeklyByArea: { movement: 5, nutrition: 0, sustainability: 5, animal_welfare: 5 } }),
    );
    expect(result?.key).toBe('nut');
  });

  it('is deterministic for the same context', () => {
    const pool = [def({ key: 'a', area: 'nutrition' }), def({ key: 'b', area: 'sustainability' })];
    const c = ctx({});
    expect(selectMission(pool, c)?.key).toBe(selectMission(pool, c)?.key);
  });

  it('swap excludes the current mission and returns a different one', () => {
    const pool = [def({ key: 'a', area: 'nutrition' }), def({ key: 'b', area: 'sustainability' })];
    const first = selectMission(pool, ctx({}));
    const swapped = selectMission(pool, ctx({}), [first!.key]);
    expect(swapped?.key).not.toBe(first?.key);
  });
});
