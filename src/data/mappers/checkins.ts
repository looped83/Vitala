import type { Database } from '@/data/supabase/database.types';
import type { CheckIn } from '@/domain/checkins/types';

type CheckInRow = Database['public']['Tables']['daily_check_ins']['Row'];

export function mapCheckIn(row: CheckInRow): CheckIn {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    checkInType: row.check_in_type,
    businessDate: row.business_date,
    timezone: row.timezone,
    energyLevel: row.energy_level,
    availableTime: row.available_time,
    intensity: row.intensity,
    focus: row.focus,
    wishText: row.wish_text,
    dayFeeling: row.day_feeling,
    positiveMoment: row.positive_moment,
    reflectionGood: row.reflection_good,
    reflectionEasier: row.reflection_easier,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
