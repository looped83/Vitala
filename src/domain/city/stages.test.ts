import { describe, expect, it } from 'vitest';
import {
  availableSlotCount,
  developmentStageForLevel,
  isRegionUnlocked,
  newlyUnlockedRegions,
  nextUnlock,
  regionStatus,
  regionView,
  regionViews,
  slotStatus,
  unlockedRegionCount,
} from './stages';
import { getRegionDefinition, getSlotDefinition } from './layout';

const center = getRegionDefinition('city_center')!;
const nature = getRegionDefinition('nature_reserve')!; // unlock level 5
const expansion = getRegionDefinition('expansion')!; // unlock level 8

describe('developmentStageForLevel', () => {
  it('maps level 1 to Keimzelle', () => {
    expect(developmentStageForLevel(1).title).toBe('Keimzelle');
  });

  it('maps higher levels to their named band', () => {
    expect(developmentStageForLevel(5).title).toBe('Lebensräume');
    expect(developmentStageForLevel(8).title).toBe('Vernetzte Region');
    expect(developmentStageForLevel(10).title).toBe('Verdichtete Stadt');
    expect(developmentStageForLevel(20).title).toBe('Wachsende Welt');
  });

  it('floors and clamps the level', () => {
    expect(developmentStageForLevel(0).title).toBe('Keimzelle');
    expect(developmentStageForLevel(3.9).stage).toBe(3);
  });
});

describe('isRegionUnlocked', () => {
  it('is monotone with the level', () => {
    expect(isRegionUnlocked(nature, 4)).toBe(false);
    expect(isRegionUnlocked(nature, 5)).toBe(true);
    expect(isRegionUnlocked(nature, 12)).toBe(true);
  });

  it('unlocks start regions at level 1', () => {
    expect(isRegionUnlocked(center, 1)).toBe(true);
  });
});

describe('regionStatus', () => {
  it('is locked below the unlock level', () => {
    expect(regionStatus(nature, 4, 4)).toBe('locked');
  });

  it('is newly_unlocked right after crossing the threshold', () => {
    expect(regionStatus(nature, 5, 4)).toBe('newly_unlocked');
  });

  it('is available once acknowledged', () => {
    expect(regionStatus(nature, 5, 5)).toBe('available');
  });

  it('never marks a start region as new', () => {
    expect(regionStatus(center, 1, 0)).toBe('available');
  });
});

describe('slotStatus', () => {
  it('locks a slot below its unlock level', () => {
    const slot = getSlotDefinition('nature_project_1')!; // level 5
    expect(slotStatus(slot, 4)).toBe('locked');
    expect(slotStatus(slot, 5)).toBe('available');
  });

  it('marks non-buildable slots reserved when unlocked (§17)', () => {
    const reserved = getSlotDefinition('expansion_reserved_1')!; // level 8, not buildable
    expect(slotStatus(reserved, 7)).toBe('locked');
    expect(slotStatus(reserved, 8)).toBe('reserved');
  });
});

describe('regionView', () => {
  it('counts available slots for an unlocked region', () => {
    const view = regionView(center, 1, 1);
    expect(view.status).toBe('available');
    expect(view.availableSlots).toBeGreaterThan(0);
    expect(view.slots.every((s) => s.status !== 'locked')).toBe(true);
  });

  it('locks all slots of a locked region', () => {
    const view = regionView(nature, 3, 3);
    expect(view.status).toBe('locked');
    expect(view.slots.every((s) => s.status === 'locked')).toBe(true);
    expect(view.availableSlots).toBe(0);
  });
});

describe('regionViews', () => {
  it('returns every region in order', () => {
    const views = regionViews(1, 1);
    const orders = views.map((v) => v.definition.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe('newlyUnlockedRegions', () => {
  it('lists regions crossed between seen and current level', () => {
    const result = newlyUnlockedRegions(5, 3);
    const ids = result.map((r) => r.id);
    expect(ids).toContain('sustainability_infra'); // level 4
    expect(ids).toContain('nature_reserve'); // level 5
    expect(ids).not.toContain('movement_quarter'); // level 2, already seen
  });

  it('is empty when nothing new was crossed', () => {
    expect(newlyUnlockedRegions(5, 5)).toHaveLength(0);
  });

  it('never includes start regions', () => {
    const result = newlyUnlockedRegions(2, 0);
    expect(result.map((r) => r.id)).not.toContain('city_center');
  });
});

describe('nextUnlock', () => {
  it('points at the nearest higher region', () => {
    const next = nextUnlock(1);
    expect(next?.regionId).toBe('movement_quarter');
    expect(next?.unlockLevel).toBe(2);
    expect(next?.levelsAway).toBe(1);
  });

  it('returns null once everything is unlocked', () => {
    expect(nextUnlock(expansion.unlockLevel)).toBeNull();
  });
});

describe('aggregate counts', () => {
  it('grows the unlocked region count with level', () => {
    expect(unlockedRegionCount(1)).toBeLessThan(unlockedRegionCount(8));
  });

  it('never exposes buildable slots for locked regions', () => {
    expect(availableSlotCount(1)).toBeGreaterThan(0);
    expect(availableSlotCount(8)).toBeGreaterThan(availableSlotCount(1));
  });
});
