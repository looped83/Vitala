import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import type { CityState } from '@/domain/city/types';
import type { CityViewMode } from '@/domain/city/view';
import { levelForXp } from '@/domain/rewards/levels';

/**
 * City data access (Phase 6). The city is server-authoritative: `city_overview`
 * initialises the household city on first read, guards the highest level and
 * returns the household state plus the caller's view preference (ADR-0041). All
 * writes go through SECURITY DEFINER RPCs — the client never sets a level, an
 * unlock or a slot status. Static layout/slot definitions live in the domain
 * layer, not the database, so they need no query.
 */

export interface CityOverview {
  state: CityState;
  viewMode: CityViewMode;
  /** Highest city level the caller has acknowledged (for the unlock banner). */
  seenLevel: number;
}

interface CityOverviewRow {
  household_id: string;
  name: string;
  layout_version: number;
  current_level: number;
  highest_level: number;
  city_xp: number;
  next_level_xp: number | null;
  view_mode: CityViewMode;
  seen_city_level: number;
}

function mapOverview(row: CityOverviewRow): CityOverview {
  // XP-to-next is derived from the same closed-form curve the server uses, so
  // the sober "still needed" hint (§35) is exact without a second round-trip.
  const status = levelForXp('city', row.city_xp);
  return {
    state: {
      householdId: row.household_id,
      name: row.name,
      layoutVersion: row.layout_version,
      currentLevel: row.current_level,
      highestLevel: row.highest_level,
      cityXp: row.city_xp,
      xpToNext: status.xpToNext,
    },
    viewMode: row.view_mode,
    seenLevel: row.seen_city_level,
  };
}

/** Read (and lazily initialise) the household's city + the caller's preference. */
export async function getCityOverview(): Promise<CityOverview> {
  const { data, error } = await supabase.rpc('city_overview');
  if (error) throw normalizeSupabaseError(error);
  const row: CityOverviewRow | undefined = (data ?? [])[0];
  if (!row) throw new Error('city_overview_empty');
  return mapOverview(row);
}

/** Rename the household city (validated server-side; XSS-guarded). */
export async function renameCity(name: string): Promise<void> {
  const { error } = await supabase.rpc('rename_city', { p_name: name });
  if (error) throw normalizeSupabaseError(error);
}

/** Persist the caller's preferred surface (map / list / system). */
export async function setCityViewMode(mode: CityViewMode): Promise<void> {
  const { error } = await supabase.rpc('set_city_view_mode', { p_mode: mode });
  if (error) throw normalizeSupabaseError(error);
}

/** Mark the current city level as seen, dismissing the unlock banner. */
export async function acknowledgeCityLevel(): Promise<void> {
  const { error } = await supabase.rpc('acknowledge_city_level');
  if (error) throw normalizeSupabaseError(error);
}
