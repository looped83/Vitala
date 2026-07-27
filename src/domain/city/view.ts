/**
 * Card/list view preference (§30). Stored per user, minimal, no sensitive data.
 * `system` follows a sensible default (map, with a list fallback offered).
 */

export const CITY_VIEW_MODES = ['map', 'list', 'system'] as const;
export type CityViewMode = (typeof CITY_VIEW_MODES)[number];

export const DEFAULT_CITY_VIEW_MODE: CityViewMode = 'system';

/** The two concrete modes the UI actually renders. */
export type ResolvedCityView = 'map' | 'list';

export function isCityViewMode(value: string): value is CityViewMode {
  return (CITY_VIEW_MODES as readonly string[]).includes(value);
}

/** Resolve `system` to a concrete view. Defaults to the map; the list is always
 *  reachable via the toggle, so this only picks the initial surface. */
export function resolveCityView(mode: CityViewMode): ResolvedCityView {
  return mode === 'list' ? 'list' : 'map';
}
