import type { Database } from '@/data/supabase/database.types';
import type { Goal, GoalPeriod, GoalTemplate } from '@/domain/goals/types';

/**
 * Mappers from Supabase rows to the framework-free goal domain (spec §41).
 * Supabase shapes never reach UI components directly.
 */
type OverviewRow = Database['public']['Views']['goal_overview']['Row'];
type PeriodRow = Database['public']['Tables']['goal_periods']['Row'];
type TemplateRow = Database['public']['Tables']['goal_templates']['Row'];

export function mapGoalOverview(row: OverviewRow): Goal {
  return {
    id: row.id,
    householdId: row.household_id,
    createdBy: row.created_by,
    ownerType: row.owner_type,
    ownerUserId: row.owner_user_id,
    title: row.title,
    description: row.description,
    lifeArea: row.life_area,
    measurement: row.measurement,
    targetValue: Number(row.target_value),
    unit: row.unit,
    periodType: row.period_type,
    recurrence: row.recurrence,
    activityTypeKeys: row.activity_type_keys ?? [],
    ritualDefinitionKeys: row.ritual_definition_keys ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    manualValue: row.manual_value === null ? null : Number(row.manual_value),
    templateKey: row.template_key,
    pauseReason: row.pause_reason,
    resumeOn: row.resume_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    pausedAt: row.paused_at,
    archivedAt: row.archived_at,
    periodId: row.period_id,
    periodIndex: row.period_index,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    periodTarget: Number(row.period_target),
    currentValue: Number(row.current_value),
  };
}

export function mapGoalPeriod(row: PeriodRow): GoalPeriod {
  return {
    id: row.id,
    goalId: row.goal_id,
    householdId: row.household_id,
    periodIndex: row.period_index,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    targetValue: Number(row.target_value),
    status: row.status,
    finalValue: row.final_value === null ? null : Number(row.final_value),
    completedAt: row.completed_at,
  };
}

export function mapGoalTemplate(row: TemplateRow): GoalTemplate {
  return {
    key: row.key,
    ownerType: row.owner_type,
    lifeArea: row.life_area,
    title: row.title,
    description: row.description,
    measurement: row.measurement,
    targetValue: Number(row.target_value),
    unit: row.unit,
    periodType: row.period_type,
    recurrence: row.recurrence,
    activityTypeKeys: row.activity_type_keys ?? [],
    ritualDefinitionKeys: row.ritual_definition_keys ?? [],
    sortOrder: row.sort_order,
  };
}
