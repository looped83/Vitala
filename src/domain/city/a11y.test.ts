import { describe, expect, it } from 'vitest';
import { mapSummary, regionA11yLabel, regionResourceSentence, slotA11yLabel } from './a11y';
import { getRegionDefinition } from './layout';
import { regionView } from './stages';

const nature = getRegionDefinition('nature_reserve')!; // level 5
const center = getRegionDefinition('city_center')!;

describe('regionA11yLabel', () => {
  it('states the unlock level for a locked region (§56.2)', () => {
    const label = regionA11yLabel(regionView(nature, 3, 3));
    expect(label).toContain('gesperrt');
    expect(label).toContain('Stadtlevel 5');
  });

  it('states free building slots for an available region', () => {
    const label = regionA11yLabel(regionView(center, 1, 1));
    expect(label).toContain('verfügbar');
    expect(label).toMatch(/Bauflächen?/);
  });
});

describe('slotA11yLabel', () => {
  it('describes size, status, region and later category (§56.3)', () => {
    const view = regionView(center, 1, 1);
    const label = slotA11yLabel(view.slots[0]!, center.title);
    expect(label).toContain('Gemeinschaftsfläche');
    expect(label).toContain(center.title);
    expect(label).toContain('frei');
  });
});

describe('mapSummary', () => {
  it('mentions level, region counts and the list alternative (§56.1)', () => {
    const summary = mapSummary({
      cityName: 'Unsere Stadt',
      currentLevel: 3,
      stageTitle: 'Grüne Versorgung',
      unlockedRegions: 4,
      totalRegions: 9,
      availableSlots: 6,
    });
    expect(summary).toContain('Unsere Stadt');
    expect(summary).toContain('Stadtlevel 3');
    expect(summary).toContain('4 von 9');
    expect(summary).toContain('Listenansicht');
  });
});

describe('regionResourceSentence', () => {
  it('links a themed region to its resource and area (§64)', () => {
    const sentence = regionResourceSentence(regionView(nature, 5, 5));
    expect(sentence).toContain('Natur');
    expect(sentence).toContain('Tierwohl');
  });

  it('handles central regions without a life area', () => {
    const sentence = regionResourceSentence(regionView(center, 1, 1));
    expect(sentence).toContain('Gemeinschaft');
  });
});
