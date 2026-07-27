import { describe, expect, it } from 'vitest';
import { isCityViewMode, resolveCityView } from './view';

describe('city view mode', () => {
  it('recognises valid modes', () => {
    expect(isCityViewMode('map')).toBe(true);
    expect(isCityViewMode('list')).toBe(true);
    expect(isCityViewMode('system')).toBe(true);
    expect(isCityViewMode('nonsense')).toBe(false);
  });

  it('resolves system + map to the map surface', () => {
    expect(resolveCityView('system')).toBe('map');
    expect(resolveCityView('map')).toBe('map');
  });

  it('resolves list to the list surface', () => {
    expect(resolveCityView('list')).toBe('list');
  });
});
