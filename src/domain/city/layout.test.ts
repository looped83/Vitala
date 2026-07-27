import { describe, expect, it } from 'vitest';
import {
  CITY_CANVAS,
  getRegionDefinition,
  getRegionSlots,
  getSlotDefinition,
  LAYOUT_VERSION,
  REGION_DEFINITIONS,
  regionsInOrder,
  SLOT_DEFINITIONS,
} from './layout';

describe('city layout definitions', () => {
  it('exposes a positive layout version', () => {
    expect(LAYOUT_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('contains all required logical regions (§5)', () => {
    const ids = REGION_DEFINITIONS.map((r) => r.id);
    for (const required of [
      'city_center',
      'movement_quarter',
      'nutrition_quarter',
      'nature_reserve',
      'culture_quarter',
      'water_forest',
      'expansion',
    ]) {
      expect(ids).toContain(required);
    }
  });

  it('has unique region ids and orders', () => {
    const ids = new Set(REGION_DEFINITIONS.map((r) => r.id));
    const orders = new Set(REGION_DEFINITIONS.map((r) => r.order));
    expect(ids.size).toBe(REGION_DEFINITIONS.length);
    expect(orders.size).toBe(REGION_DEFINITIONS.length);
  });

  it('keeps every region footprint inside the canvas', () => {
    for (const region of REGION_DEFINITIONS) {
      expect(region.rect.x).toBeGreaterThanOrEqual(0);
      expect(region.rect.y).toBeGreaterThanOrEqual(0);
      expect(region.rect.x + region.rect.width).toBeLessThanOrEqual(CITY_CANVAS.width);
      expect(region.rect.y + region.rect.height).toBeLessThanOrEqual(CITY_CANVAS.height);
    }
  });

  it('has non-overlapping region footprints', () => {
    for (let i = 0; i < REGION_DEFINITIONS.length; i += 1) {
      for (let j = i + 1; j < REGION_DEFINITIONS.length; j += 1) {
        const a = REGION_DEFINITIONS[i]!.rect;
        const b = REGION_DEFINITIONS[j]!.rect;
        const overlap =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        expect(overlap).toBe(false);
      }
    }
  });

  it('starts with at least one region available at level 1', () => {
    expect(REGION_DEFINITIONS.some((r) => r.unlockLevel <= 1)).toBe(true);
    const center = getRegionDefinition('city_center');
    expect(center?.unlockLevel).toBe(1);
  });

  it('requires positive unlock levels', () => {
    for (const region of REGION_DEFINITIONS) {
      expect(region.unlockLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns regions sorted by order', () => {
    const orders = regionsInOrder().map((r) => r.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('resolves unknown ids to undefined', () => {
    expect(getRegionDefinition('does_not_exist')).toBeUndefined();
    expect(getSlotDefinition('nope')).toBeUndefined();
  });
});

describe('city slot definitions', () => {
  it('has unique slot ids', () => {
    const ids = new Set(SLOT_DEFINITIONS.map((s) => s.id));
    expect(ids.size).toBe(SLOT_DEFINITIONS.length);
  });

  it('references only known regions', () => {
    for (const slot of SLOT_DEFINITIONS) {
      expect(getRegionDefinition(slot.regionId)).toBeDefined();
    }
  });

  it('never unlocks a slot before its region', () => {
    for (const slot of SLOT_DEFINITIONS) {
      const region = getRegionDefinition(slot.regionId)!;
      expect(slot.unlockLevel).toBeGreaterThanOrEqual(region.unlockLevel);
    }
  });

  it('positions every slot inside its region footprint', () => {
    for (const slot of SLOT_DEFINITIONS) {
      const { rect } = getRegionDefinition(slot.regionId)!;
      expect(slot.position.x).toBeGreaterThanOrEqual(rect.x);
      expect(slot.position.x).toBeLessThanOrEqual(rect.x + rect.width);
      expect(slot.position.y).toBeGreaterThanOrEqual(rect.y);
      expect(slot.position.y).toBeLessThanOrEqual(rect.y + rect.height);
    }
  });

  it('keeps the expansion region reserved (no buildable slot in V1, §17)', () => {
    const expansionSlots = getRegionSlots('expansion');
    expect(expansionSlots.length).toBeGreaterThan(0);
    expect(expansionSlots.every((s) => !s.buildableInV1)).toBe(true);
  });

  it('offers at least one buildable slot from level 1 (§61)', () => {
    const early = SLOT_DEFINITIONS.filter((s) => s.unlockLevel <= 1 && s.buildableInV1);
    expect(early.length).toBeGreaterThan(0);
  });
});
