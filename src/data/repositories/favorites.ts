import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import type { Favorite } from '@/domain/activity/types';
import type { Database } from '@/data/supabase/database.types';

type FavoriteRow = Database['public']['Tables']['entry_favorites']['Row'];

function mapFavorite(row: FavoriteRow): Favorite {
  return {
    id: row.id,
    area: row.area,
    label: row.label,
    ownerUserId: row.owner_user_id,
    activityTypeId: row.activity_type_id,
    durationMin: row.duration_min,
    intensity: row.intensity,
    ritualDefinitionIds: row.ritual_definition_ids ?? [],
    isShared: row.is_shared,
    sortOrder: row.sort_order,
  };
}

/** Household favourites the caller may see (shared + own) — RLS enforces scope. */
export async function getFavorites(householdId: string): Promise<Favorite[]> {
  const { data, error } = await supabase
    .from('entry_favorites')
    .select(
      'id, household_id, created_by, owner_user_id, area, label, activity_type_id, duration_min, intensity, ritual_definition_ids, is_shared, sort_order, created_at, updated_at',
    )
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true });
  if (error) throw normalizeSupabaseError(error);
  return data.map(mapFavorite);
}

export interface SaveFavoriteArgs {
  id?: string | null;
  area: 'movement' | 'nutrition' | 'sustainability' | 'animal_welfare';
  label: string;
  activityTypeId?: string | null;
  durationMin?: number | null;
  intensity?: 'light' | 'medium' | 'intense' | null;
  ritualDefinitionIds?: string[];
  isShared?: boolean;
  personal?: boolean;
}

export async function saveFavorite(args: SaveFavoriteArgs): Promise<string> {
  const { data, error } = await supabase.rpc('save_favorite', {
    p_id: args.id ?? null,
    p_area: args.area,
    p_label: args.label,
    p_activity_type_id: args.activityTypeId ?? null,
    p_duration_min: args.durationMin ?? null,
    p_intensity: args.intensity ?? null,
    p_ritual_definition_ids: args.ritualDefinitionIds ?? [],
    p_is_shared: args.isShared ?? false,
    p_personal: args.personal ?? false,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function deleteFavorite(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_favorite', { p_id: id });
  if (error) throw normalizeSupabaseError(error);
}
