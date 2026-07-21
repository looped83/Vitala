import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { mapRitual, mapRitualCompletion } from '@/data/mappers/rituals';
import type { Ritual, RitualCompletion } from '@/domain/rituals/types';
import type {
  LifeArea,
  OwnerType,
  RitualCompletionStatus,
  RitualRecurrence,
  RitualStatus,
  RitualTime,
  RitualTypeDb,
} from '@/data/supabase/database.types';

/** All non-deleted rituals of a household (active + paused + archived). */
export async function getRituals(householdId: string): Promise<Ritual[]> {
  const { data, error } = await supabase
    .from('rituals')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true });
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapRitual);
}

/** Ritual completions within an inclusive local-date window. */
export async function getRitualCompletions(
  householdId: string,
  from: string,
  to: string,
): Promise<RitualCompletion[]> {
  const { data, error } = await supabase
    .from('ritual_completions')
    .select('*')
    .eq('household_id', householdId)
    .gte('occurred_on', from)
    .lte('occurred_on', to);
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapRitualCompletion);
}

export interface SaveRitualArgs {
  id?: string | null;
  ownerType: OwnerType;
  ownerUserId?: string | null;
  title: string;
  description?: string | null;
  lifeArea?: LifeArea | null;
  ritualType: RitualTypeDb;
  recurrence: RitualRecurrence;
  preferredTime: RitualTime;
  weekdays: number[];
  startDate: string;
  endDate?: string | null;
  sortOrder?: number;
}

export async function saveRitual(args: SaveRitualArgs): Promise<string> {
  const { data, error } = await supabase.rpc('save_ritual', {
    p_id: args.id ?? null,
    p_owner_type: args.ownerType,
    p_owner_user_id: args.ownerUserId ?? null,
    p_title: args.title,
    p_description: args.description ?? null,
    p_life_area: args.lifeArea ?? null,
    p_ritual_type: args.ritualType,
    p_recurrence: args.recurrence,
    p_preferred_time: args.preferredTime,
    p_weekdays: args.weekdays,
    p_start_date: args.startDate,
    p_end_date: args.endDate ?? null,
    p_sort_order: args.sortOrder ?? 100,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function setRitualStatus(id: string, status: RitualStatus): Promise<void> {
  const { error } = await supabase.rpc('set_ritual_status', { p_id: id, p_status: status });
  if (error) throw normalizeSupabaseError(error);
}

export async function deleteRitual(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_ritual', { p_id: id });
  if (error) throw normalizeSupabaseError(error);
}

export interface CompleteRitualArgs {
  ritualId: string;
  occurredOn: string;
  status?: RitualCompletionStatus;
  value?: number | null;
  note?: string | null;
}

export async function completeRitual(args: CompleteRitualArgs): Promise<string> {
  const { data, error } = await supabase.rpc('complete_ritual', {
    p_ritual_id: args.ritualId,
    p_occurred_on: args.occurredOn,
    p_status: args.status ?? 'done',
    p_value: args.value ?? null,
    p_note: args.note ?? null,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function clearRitualCompletion(ritualId: string, occurredOn: string): Promise<void> {
  const { error } = await supabase.rpc('clear_ritual_completion', {
    p_ritual_id: ritualId,
    p_occurred_on: occurredOn,
  });
  if (error) throw normalizeSupabaseError(error);
}
