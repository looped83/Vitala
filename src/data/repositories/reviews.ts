import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { mapFeedRow } from '@/data/mappers/activity';
import type { ActivityType, HistoryEntry, RitualDefinition } from '@/domain/activity/types';
import { emptyAreaTotals } from '@/domain/review/aggregate';
import type { AreaTotals } from '@/domain/review/aggregate';
import type { Database } from '@/data/supabase/database.types';

type FeedRow = Database['public']['Views']['entry_feed']['Row'];

export interface ReviewData {
  totals: AreaTotals;
  entries: HistoryEntry[];
}

interface Catalog {
  types: ActivityType[];
  definitions: RitualDefinition[];
}

/**
 * Factual review data for an inclusive local-date window (spec §32–§34).
 * Bounded by date range so payloads stay small (performance §51); aggregation
 * is deterministic and framework-free. No scoring, no moralising.
 */
export async function getReviewData(
  householdId: string,
  from: string,
  to: string,
  catalog: Catalog,
): Promise<ReviewData> {
  const [{ data: feed, error: feedError }, { data: completions, error: compError }] =
    await Promise.all([
      supabase
        .from('entry_feed')
        .select('*')
        .eq('household_id', householdId)
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('ritual_completions')
        .select('id, status, occurred_on')
        .eq('household_id', householdId)
        .gte('occurred_on', from)
        .lte('occurred_on', to)
        .eq('status', 'done'),
    ]);
  if (feedError) throw normalizeSupabaseError(feedError);
  if (compError) throw normalizeSupabaseError(compError);

  const rows = (feed ?? []) as FeedRow[];

  // Participants for shared entries (single batched query).
  const sharedGroupIds = rows.filter((r) => r.is_shared).map((r) => r.entry_id);
  const participantsByKey = new Map<string, string[]>();
  if (sharedGroupIds.length > 0) {
    const { data: parts, error: partError } = await supabase
      .from('entry_participants')
      .select('entry_kind, group_id, user_id')
      .eq('household_id', householdId)
      .in('group_id', sharedGroupIds);
    if (partError) throw normalizeSupabaseError(partError);
    for (const p of parts ?? []) {
      const key = `${p.entry_kind}:${p.group_id}`;
      const list = participantsByKey.get(key);
      if (list) list.push(p.user_id);
      else participantsByKey.set(key, [p.user_id]);
    }
  }

  const ctx = {
    typeById: new Map(catalog.types.map((t) => [t.id, t])),
    defById: new Map(catalog.definitions.map((d) => [d.id, d])),
    participantsByKey,
  };
  const entries = rows.map((row) => mapFeedRow(row, ctx));

  const totals = emptyAreaTotals();
  const days = new Set<string>();
  for (const e of entries) {
    totals.entryCount += 1;
    totals.byArea[e.area] += 1;
    days.add(e.occurredOn);
    if (e.isShared) totals.sharedCount += 1;
    if (e.kind === 'activity' && typeof e.durationMin === 'number') {
      totals.movementMinutes += e.durationMin;
    }
  }
  totals.activeDays = days.size;
  totals.ritualsCompleted = (completions ?? []).length;

  return { totals, entries };
}
