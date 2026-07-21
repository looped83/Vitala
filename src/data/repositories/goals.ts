import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { mapGoalOverview, mapGoalPeriod, mapGoalTemplate } from '@/data/mappers/goals';
import type { Goal, GoalPeriod, GoalStatus, GoalTemplate } from '@/domain/goals/types';
import type {
  GoalMeasurement,
  GoalPeriodType,
  GoalRecurrence,
  GoalUnit,
  OwnerType,
} from '@/data/supabase/database.types';

/** Curated starter goals (reference data; cached long). */
export async function getGoalTemplates(): Promise<GoalTemplate[]> {
  const { data, error } = await supabase
    .from('goal_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapGoalTemplate);
}

/**
 * All non-deleted goals with their current period + live progress. Rolls
 * periods forward first (idempotent) so elapsed periods are frozen and the
 * current one exists (ADR-0026).
 */
export async function getGoalsOverview(householdId: string): Promise<Goal[]> {
  const { error: syncError } = await supabase.rpc('sync_goal_periods');
  if (syncError) throw normalizeSupabaseError(syncError);

  const { data, error } = await supabase
    .from('goal_overview')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapGoalOverview);
}

/** A single goal's period history (newest first), for the detail view. */
export async function getGoalPeriods(goalId: string): Promise<GoalPeriod[]> {
  const { data, error } = await supabase
    .from('goal_periods')
    .select('*')
    .eq('goal_id', goalId)
    .order('period_index', { ascending: false });
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map(mapGoalPeriod);
}

export interface SaveGoalArgs {
  id?: string | null;
  ownerType: OwnerType;
  ownerUserId?: string | null;
  title: string;
  description?: string | null;
  lifeArea: 'movement' | 'nutrition' | 'sustainability' | 'animal_welfare';
  measurement: GoalMeasurement;
  targetValue: number;
  unit: GoalUnit;
  periodType: GoalPeriodType;
  recurrence: GoalRecurrence;
  activityTypeKeys?: string[];
  ritualDefinitionKeys?: string[];
  startDate: string;
  endDate?: string | null;
  templateKey?: string | null;
  manualValue?: number | null;
}

export async function saveGoal(args: SaveGoalArgs): Promise<string> {
  const { data, error } = await supabase.rpc('save_goal', {
    p_id: args.id ?? null,
    p_owner_type: args.ownerType,
    p_owner_user_id: args.ownerUserId ?? null,
    p_title: args.title,
    p_description: args.description ?? null,
    p_life_area: args.lifeArea,
    p_measurement: args.measurement,
    p_target_value: args.targetValue,
    p_unit: args.unit,
    p_period_type: args.periodType,
    p_recurrence: args.recurrence,
    p_activity_type_keys: args.activityTypeKeys ?? [],
    p_ritual_definition_keys: args.ritualDefinitionKeys ?? [],
    p_start_date: args.startDate,
    p_end_date: args.endDate ?? null,
    p_template_key: args.templateKey ?? null,
    p_manual_value: args.manualValue ?? null,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function setGoalStatus(
  id: string,
  status: GoalStatus,
  pauseReason?: string | null,
  resumeOn?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('set_goal_status', {
    p_id: id,
    p_status: status,
    p_pause_reason: pauseReason ?? null,
    p_resume_on: resumeOn ?? null,
  });
  if (error) throw normalizeSupabaseError(error);
}

export async function setGoalManualProgress(id: string, value: number): Promise<void> {
  const { error } = await supabase.rpc('set_goal_manual_progress', { p_id: id, p_value: value });
  if (error) throw normalizeSupabaseError(error);
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_goal', { p_id: id });
  if (error) throw normalizeSupabaseError(error);
}
