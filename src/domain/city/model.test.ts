import { describe, expect, it } from 'vitest';
import { buildCityModel } from './model';
import type { CityState } from './types';

function state(overrides: Partial<CityState> = {}): CityState {
  return {
    householdId: 'hh',
    name: 'Unsere Stadt',
    layoutVersion: 1,
    currentLevel: 1,
    highestLevel: 1,
    cityXp: 0,
    xpToNext: 320,
    ...overrides,
  };
}

describe('buildCityModel', () => {
  it('builds a level-1 model with the city centre available and later regions locked', () => {
    const model = buildCityModel(state(), 1);
    expect(model.stage.title).toBe('Keimzelle');
    expect(model.totalRegions).toBe(model.regions.length);
    expect(model.unlockedRegions).toBeGreaterThanOrEqual(1);
    const center = model.regions.find((r) => r.definition.id === 'city_center')!;
    expect(center.status).toBe('available');
    const nature = model.regions.find((r) => r.definition.id === 'nature_reserve')!;
    expect(nature.status).toBe('locked');
    expect(model.availableSlots).toBeGreaterThan(0);
  });

  it('points at the next unlock and summarises the map', () => {
    const model = buildCityModel(state(), 1);
    expect(model.nextUnlock?.regionId).toBe('movement_quarter');
    expect(model.summary).toContain('Listenansicht');
    expect(model.summary).toContain('Unsere Stadt');
  });

  it('surfaces newly-unlocked regions when the seen level lags behind', () => {
    const model = buildCityModel(state({ currentLevel: 3 }), 1);
    const newIds = model.newlyUnlocked.map((r) => r.id);
    expect(newIds).toContain('movement_quarter'); // level 2
    expect(newIds).toContain('nutrition_quarter'); // level 3
  });

  it('has no newly-unlocked regions once acknowledged', () => {
    const model = buildCityModel(state({ currentLevel: 3 }), 3);
    expect(model.newlyUnlocked).toHaveLength(0);
  });
});
