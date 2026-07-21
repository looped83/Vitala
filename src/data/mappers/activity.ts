import type { Database } from '@/data/supabase/database.types';
import { LIFE_AREA_LABEL } from '@/domain/activity/areas';
import type { ActivityType, HistoryEntry, RitualDefinition } from '@/domain/activity/types';

/**
 * Mappers from Supabase rows to the framework-free domain model (spec §15).
 * They live in the data layer (not domain/) because they reference the generated
 * database types; the domain never sees a Supabase shape.
 */
type ActivityTypeRow = Database['public']['Tables']['activity_types']['Row'];
type RitualDefinitionRow = Database['public']['Tables']['ritual_definitions']['Row'];
type FeedRow = Database['public']['Views']['entry_feed']['Row'];

export function mapActivityType(row: ActivityTypeRow): ActivityType {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    category: row.category,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export function mapRitualDefinition(row: RitualDefinitionRow): RitualDefinition {
  return {
    id: row.id,
    key: row.key,
    area: row.area,
    kind: row.kind,
    name: row.name,
    icon: row.icon,
    sortOrder: row.sort_order,
  };
}

export interface MapFeedContext {
  typeById: Map<string, ActivityType>;
  defById: Map<string, RitualDefinition>;
  /** participant ids keyed by `${kind}:${entry_id}`. */
  participantsByKey: Map<string, string[]>;
}

/** Map one unified feed row into the display HistoryEntry. */
export function mapFeedRow(row: FeedRow, ctx: MapFeedContext): HistoryEntry {
  const participantIds = ctx.participantsByKey.get(`${row.kind}:${row.entry_id}`) ?? [];
  const base = {
    kind: row.kind,
    id: row.entry_id,
    area: row.area,
    occurredOn: row.occurred_on,
    createdBy: row.created_by,
    primaryUserId: row.primary_user_id,
    isShared: row.is_shared,
    participantIds,
    note: row.note,
    customLabel: row.custom_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.kind === 'activity') {
    const type = row.activity_type_id ? ctx.typeById.get(row.activity_type_id) : undefined;
    const title = row.custom_label?.trim() || type?.name || 'Bewegung';
    return {
      ...base,
      title,
      typeKey: type?.key,
      durationMin: row.duration_min ?? undefined,
      intensity: row.intensity,
      location: row.location,
      startedAtTime: row.started_at_time,
    };
  }

  const defs = (row.definition_ids ?? [])
    .map((id) => ctx.defById.get(id))
    .filter((d): d is RitualDefinition => Boolean(d));
  const definitionKeys = defs.map((d) => d.key);
  const definitionLabels = defs.map((d) => d.name);
  let title: string;
  if (row.area === 'nutrition') {
    title = 'Ernährungs-Check-in';
  } else if (defs.length === 1 && defs[0]) {
    title = defs[0].name;
  } else {
    title = `${defs.length} ${LIFE_AREA_LABEL[row.area]}-Handlungen`;
  }
  return {
    ...base,
    title,
    definitionKeys,
    definitionLabels,
    mealLabel: row.meal_label,
    ritualKind: row.is_special ? 'special_action' : 'daily_block',
  };
}
