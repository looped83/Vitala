import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { mapCheckIn } from '@/data/mappers/checkins';
import type { CheckIn, CheckInType } from '@/domain/checkins/types';
import type { DayFocus, DayIntensity, TimeBudget } from '@/data/supabase/database.types';

/**
 * Check-in reads are strictly scoped to the caller by RLS (ADR-0028); the
 * `user_id` filter here is defence in depth, not the security boundary.
 */
export async function getCheckIn(
  userId: string,
  type: CheckInType,
  businessDate: string,
): Promise<CheckIn | null> {
  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('check_in_type', type)
    .eq('business_date', businessDate)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  return data ? mapCheckIn(data) : null;
}

export async function getCheckInsRange(
  userId: string,
  from: string,
  to: string,
): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .gte('business_date', from)
    .lte('business_date', to)
    .order('business_date', { ascending: false });
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapCheckIn);
}

export interface SaveCheckInArgs {
  type: CheckInType;
  businessDate?: string | null;
  energyLevel?: number | null;
  availableTime?: TimeBudget | null;
  intensity?: DayIntensity | null;
  focus?: DayFocus | null;
  wishText?: string | null;
  dayFeeling?: number | null;
  positiveMoment?: string | null;
  reflectionGood?: string | null;
  reflectionEasier?: string | null;
}

export async function saveCheckIn(args: SaveCheckInArgs): Promise<string> {
  const { data, error } = await supabase.rpc('save_check_in', {
    p_type: args.type,
    p_business_date: args.businessDate ?? null,
    p_energy_level: args.energyLevel ?? null,
    p_available_time: args.availableTime ?? null,
    p_intensity: args.intensity ?? null,
    p_focus: args.focus ?? null,
    p_wish_text: args.wishText ?? null,
    p_day_feeling: args.dayFeeling ?? null,
    p_positive_moment: args.positiveMoment ?? null,
    p_reflection_good: args.reflectionGood ?? null,
    p_reflection_easier: args.reflectionEasier ?? null,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function deleteCheckIn(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_check_in', { p_id: id });
  if (error) throw normalizeSupabaseError(error);
}
