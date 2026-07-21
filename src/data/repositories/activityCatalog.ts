import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { mapActivityType, mapRitualDefinition } from '@/data/mappers/activity';
import type { ActivityType, RitualDefinition } from '@/domain/activity/types';

/**
 * Reference catalogs (activity types + ritual definitions). Globally readable,
 * never client-written; cached for a long time (queries use a high staleTime).
 */
export async function getActivityTypes(): Promise<ActivityType[]> {
  const { data, error } = await supabase
    .from('activity_types')
    .select('id, key, area, name, category, icon, sort_order, is_active, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw normalizeSupabaseError(error);
  return data.map(mapActivityType);
}

export async function getRitualDefinitions(): Promise<RitualDefinition[]> {
  const { data, error } = await supabase
    .from('ritual_definitions')
    .select('id, key, area, kind, name, icon, sort_order, is_active, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw normalizeSupabaseError(error);
  return data.map(mapRitualDefinition);
}
