import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { mapFeedRow } from '@/data/mappers/activity';
import type { MapFeedContext } from '@/data/mappers/activity';
import type { HistoryEntry, EntryKind } from '@/domain/activity/types';
import type { ActivityType, RitualDefinition } from '@/domain/activity/types';
import type { Database } from '@/data/supabase/database.types';

type FeedRow = Database['public']['Views']['entry_feed']['Row'];

/** Keyset cursor into the feed: the last (occurred_on, created_at, entry_id). */
export interface FeedCursor {
  occurredOn: string;
  createdAt: string;
  entryId: string;
}

export interface HistoryPage {
  entries: HistoryEntry[];
  nextCursor: FeedCursor | null;
}

export interface HistoryQueryArgs {
  householdId: string;
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] };
  pageSize?: number;
  cursor?: FeedCursor | null;
}

/** Load participants for a page of shared entries in a single batched query. */
async function loadParticipants(
  householdId: string,
  rows: FeedRow[],
): Promise<Map<string, string[]>> {
  const shared = rows.filter((r) => r.is_shared);
  const byKey = new Map<string, string[]>();
  if (shared.length === 0) return byKey;
  const groupIds = shared.map((r) => r.entry_id);
  const { data, error } = await supabase
    .from('entry_participants')
    .select('entry_kind, group_id, user_id')
    .eq('household_id', householdId)
    .in('group_id', groupIds);
  if (error) throw normalizeSupabaseError(error);
  for (const p of data) {
    const key = `${p.entry_kind}:${p.group_id}`;
    const list = byKey.get(key);
    if (list) list.push(p.user_id);
    else byKey.set(key, [p.user_id]);
  }
  return byKey;
}

/**
 * One keyset-paginated page of the shared history, newest first. The union feed
 * is ordered by (occurred_on desc, created_at desc, entry_id desc); the cursor
 * is a stable tuple so newly inserted rows never duplicate or skip a page (§21.5).
 */
export async function getHistoryPage({
  householdId,
  catalog,
  pageSize = 25,
  cursor,
}: HistoryQueryArgs): Promise<HistoryPage> {
  let query = supabase
    .from('entry_feed')
    .select(
      'kind, entry_id, household_id, area, occurred_on, primary_user_id, created_by, is_shared, note, custom_label, created_at, updated_at, activity_type_id, duration_min, intensity, location, started_at_time, definition_ids, meal_label, is_special',
    )
    .eq('household_id', householdId)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .order('entry_id', { ascending: false })
    .limit(pageSize + 1);

  if (cursor) {
    // Keyset predicate: strictly "older" than the cursor tuple.
    query = query.or(
      [
        `occurred_on.lt.${cursor.occurredOn}`,
        `and(occurred_on.eq.${cursor.occurredOn},created_at.lt.${cursor.createdAt})`,
        `and(occurred_on.eq.${cursor.occurredOn},created_at.eq.${cursor.createdAt},entry_id.lt.${cursor.entryId})`,
      ].join(','),
    );
  }

  const { data, error } = await query;
  if (error) throw normalizeSupabaseError(error);

  const rows = (data ?? []) as FeedRow[];
  const pageRows = rows.slice(0, pageSize);
  const hasMore = rows.length > pageSize;

  const participantsByKey = await loadParticipants(householdId, pageRows);
  const ctx: MapFeedContext = {
    typeById: new Map(catalog.types.map((t) => [t.id, t])),
    defById: new Map(catalog.definitions.map((d) => [d.id, d])),
    participantsByKey,
  };

  const entries = pageRows.map((row) => mapFeedRow(row, ctx));
  const last = pageRows.at(-1);
  const nextCursor =
    hasMore && last
      ? { occurredOn: last.occurred_on, createdAt: last.created_at, entryId: last.entry_id }
      : null;
  return { entries, nextCursor };
}

/** A single entry by kind + id (activity id or ritual group id) for detail/edit. */
export async function getEntryDetail(
  householdId: string,
  kind: EntryKind,
  id: string,
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] },
): Promise<HistoryEntry | null> {
  const { data, error } = await supabase
    .from('entry_feed')
    .select(
      'kind, entry_id, household_id, area, occurred_on, primary_user_id, created_by, is_shared, note, custom_label, created_at, updated_at, activity_type_id, duration_min, intensity, location, started_at_time, definition_ids, meal_label, is_special',
    )
    .eq('household_id', householdId)
    .eq('kind', kind)
    .eq('entry_id', id)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  if (!data) return null;
  const row: FeedRow = data;
  const participantsByKey = await loadParticipants(householdId, [row]);
  return mapFeedRow(row, {
    typeById: new Map(catalog.types.map((t) => [t.id, t])),
    defById: new Map(catalog.definitions.map((d) => [d.id, d])),
    participantsByKey,
  });
}

// ---- RPC write wrappers (the only write path — ADR-0020) ------------------

export interface SaveActivityArgs {
  id?: string | null;
  activityTypeId: string;
  occurredOn: string;
  durationMin: number;
  intensity?: 'light' | 'medium' | 'intense' | null;
  startedAtTime?: string | null;
  location?: string | null;
  note?: string | null;
  customLabel?: string | null;
  isShared?: boolean;
  partnerUserId?: string | null;
  idempotencyKey?: string | null;
}

export async function saveActivity(args: SaveActivityArgs): Promise<string> {
  const { data, error } = await supabase.rpc('save_activity', {
    p_id: args.id ?? null,
    p_activity_type_id: args.activityTypeId,
    p_occurred_on: args.occurredOn,
    p_duration_min: args.durationMin,
    p_intensity: args.intensity ?? null,
    p_started_at_time: args.startedAtTime || null,
    p_location: args.location ?? null,
    p_note: args.note ?? null,
    p_custom_label: args.customLabel ?? null,
    p_is_shared: args.isShared ?? false,
    p_partner_user_id: args.partnerUserId ?? null,
    p_idempotency_key: args.idempotencyKey ?? null,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export interface SaveRitualArgs {
  groupId?: string | null;
  area: 'nutrition' | 'sustainability' | 'animal_welfare';
  definitionIds: string[];
  occurredOn: string;
  note?: string | null;
  mealLabel?: string | null;
  customLabel?: string | null;
  isShared?: boolean;
  partnerUserId?: string | null;
}

export async function saveRitualCheckin(args: SaveRitualArgs): Promise<string> {
  const { data, error } = await supabase.rpc('save_ritual_checkin', {
    p_group_id: args.groupId ?? null,
    p_area: args.area,
    p_definition_ids: args.definitionIds,
    p_occurred_on: args.occurredOn,
    p_note: args.note ?? null,
    p_meal_label: args.mealLabel ?? null,
    p_custom_label: args.customLabel ?? null,
    p_is_shared: args.isShared ?? false,
    p_partner_user_id: args.partnerUserId ?? null,
  });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function deleteEntry(kind: EntryKind, id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_entry', { p_kind: kind, p_id: id });
  if (error) throw normalizeSupabaseError(error);
}
