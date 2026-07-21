import type { Database } from '@/data/supabase/database.types';
import type { Ritual, RitualCompletion } from '@/domain/rituals/types';

type RitualRow = Database['public']['Tables']['rituals']['Row'];
type CompletionRow = Database['public']['Tables']['ritual_completions']['Row'];

export function mapRitual(row: RitualRow): Ritual {
  return {
    id: row.id,
    householdId: row.household_id,
    createdBy: row.created_by,
    ownerType: row.owner_type,
    ownerUserId: row.owner_user_id,
    title: row.title,
    description: row.description,
    lifeArea: row.life_area,
    ritualType: row.ritual_type,
    recurrence: row.recurrence,
    preferredTime: row.preferred_time,
    weekdays: row.weekdays ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pausedAt: row.paused_at,
    archivedAt: row.archived_at,
  };
}

export function mapRitualCompletion(row: CompletionRow): RitualCompletion {
  return {
    id: row.id,
    ritualId: row.ritual_id,
    householdId: row.household_id,
    userId: row.user_id,
    occurredOn: row.occurred_on,
    status: row.status,
    valueNum: row.value_num,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
