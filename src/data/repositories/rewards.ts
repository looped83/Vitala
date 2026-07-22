import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import type { Database } from '@/data/supabase/database.types';
import type { ResourceKey } from '@/domain/rewards/constants';
import type { XpReason, ResourceReason } from '@/domain/rewards/constants';
import { levelForXp } from '@/domain/rewards/levels';
import type { LevelStatus } from '@/domain/rewards/levels';
import { RESOURCE_DISPLAY_ORDER } from '@/domain/rewards/display';
import type { LifeArea } from '@/domain/activity/areas';
import type { MissionMeasurement } from '@/domain/missions/types';

type ResourceRow = Database['public']['Tables']['resources']['Row'];

/**
 * Reward data access (Phase 5). All reward *writes* happen server-side inside
 * the capture/goal RPCs (ADR-0005); this repository only reads authoritative
 * state and triggers the idempotent sync/mission RPCs. Level math is derived
 * client-side from the same formulas the server uses.
 */

/** Idempotently materialise goal periods, pending goal rewards + missions. */
export async function syncRewards(): Promise<void> {
  const { error } = await supabase.rpc('sync_rewards');
  if (error) throw normalizeSupabaseError(error);
}

export interface PersonalReward {
  status: LevelStatus;
  householdId: string;
  userId: string;
}

export async function getPersonalStatus(
  householdId: string,
  userId: string,
): Promise<PersonalReward> {
  const { data, error } = await supabase
    .from('personal_reward_status')
    .select('*')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  const row = data ?? null;
  return { householdId, userId, status: levelForXp('personal', row?.total_xp ?? 0) };
}

export async function getCityStatus(householdId: string): Promise<LevelStatus> {
  const { data, error } = await supabase
    .from('city_reward_status')
    .select('*')
    .eq('household_id', householdId)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  const row = data ?? null;
  return levelForXp('city', row?.total_xp ?? 0);
}

export type ResourceBalances = Record<ResourceKey, number>;

export async function getResourceBalances(householdId: string): Promise<ResourceBalances> {
  const { data, error } = await supabase
    .from('resources')
    .select('resource_key, balance')
    .eq('household_id', householdId);
  if (error) throw normalizeSupabaseError(error);
  const balances = Object.fromEntries(
    RESOURCE_DISPLAY_ORDER.map((k) => [k, 0]),
  ) as ResourceBalances;
  for (const row of (data ?? []) as Pick<ResourceRow, 'resource_key' | 'balance'>[]) {
    balances[row.resource_key] = row.balance;
  }
  return balances;
}

export interface XpTransaction {
  id: string;
  amount: number;
  scope: 'personal' | 'city';
  reason: XpReason;
  area: LifeArea | null;
  sourceKind: string;
  businessDate: string;
  createdAt: string;
}

export async function getXpHistory(householdId: string, limit = 50): Promise<XpTransaction[]> {
  const { data, error } = await supabase
    .from('experience_transactions')
    .select('id, amount, scope, reason, area, source_kind, business_date, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map((r) => ({
    id: r.id,
    amount: r.amount,
    scope: r.scope,
    reason: r.reason,
    area: r.area,
    sourceKind: r.source_kind,
    businessDate: r.business_date,
    createdAt: r.created_at,
  }));
}

export interface ResourceTransaction {
  id: string;
  resourceKey: ResourceKey;
  amount: number;
  reason: ResourceReason;
  sourceKind: string;
  businessDate: string;
  createdAt: string;
}

export async function getResourceHistory(
  householdId: string,
  limit = 50,
): Promise<ResourceTransaction[]> {
  const { data, error } = await supabase
    .from('resource_transactions')
    .select('id, resource_key, amount, reason, source_kind, business_date, created_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map((r) => ({
    id: r.id,
    resourceKey: r.resource_key,
    amount: r.amount,
    reason: r.reason,
    sourceKind: r.source_kind,
    businessDate: r.business_date,
    createdAt: r.created_at,
  }));
}

export interface WeeklyBalance {
  weekStart: string;
  weekEnd: string;
  byArea: Record<LifeArea, number>;
  activeAreas: number;
  stage: number;
  bothContributed: boolean;
  bonusGranted: boolean;
}

export async function getWeeklyBalance(
  householdId: string,
  anchorDate: string,
): Promise<WeeklyBalance | null> {
  // The snapshot is keyed by the household's week start (Monday by default), so
  // fetch the most recent snapshot on or before the anchor day.
  const { data, error } = await supabase
    .from('weekly_balance_snapshots')
    .select('*')
    .eq('household_id', householdId)
    .lte('week_start', anchorDate)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  const row = data ?? null;
  if (!row) return null;
  return {
    weekStart: row.week_start,
    weekEnd: row.week_end,
    byArea: {
      movement: row.movement_count,
      nutrition: row.nutrition_count,
      sustainability: row.sustainability_count,
      animal_welfare: row.animal_welfare_count,
    },
    activeAreas: row.active_areas,
    stage: row.stage,
    bothContributed: row.both_contributed,
    bonusGranted: row.bonus_granted,
  };
}

export interface MissionBoardItem {
  assignmentId: string;
  key: string;
  title: string;
  description: string;
  area: LifeArea | null;
  scope: 'personal' | 'shared';
  period: 'day' | 'week';
  measurement: MissionMeasurement;
  target: number;
  difficulty: 'leicht' | 'normal' | 'gemeinschaftlich';
  status: 'offered' | 'active' | 'completed' | 'skipped' | 'expired';
  swapsUsed: number;
  progress: number;
  personalXp: number;
  cityXp: number;
  rewardResource: ResourceKey | null;
  rewardResourceAmount: number;
  rewardCommunity: number;
  canComplete: boolean;
}

export async function getMissionBoard(): Promise<MissionBoardItem[]> {
  const { data, error } = await supabase.rpc('mission_board');
  if (error) throw normalizeSupabaseError(error);
  return (data ?? []).map((r) => ({
    assignmentId: r.assignment_id,
    key: r.definition_key,
    title: r.title,
    description: r.description,
    area: r.area,
    scope: r.scope,
    period: r.period,
    measurement: r.measurement,
    target: r.target_value,
    difficulty: r.difficulty,
    status: r.status,
    swapsUsed: r.swaps_used,
    progress: Number(r.progress),
    personalXp: r.personal_xp,
    cityXp: r.city_xp,
    rewardResource: r.reward_resource,
    rewardResourceAmount: r.reward_resource_amount,
    rewardCommunity: r.reward_community,
    canComplete: r.can_complete,
  }));
}

export async function swapMission(assignmentId: string): Promise<string> {
  const { data, error } = await supabase.rpc('swap_mission', { p_assignment_id: assignmentId });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function skipMission(assignmentId: string): Promise<void> {
  const { error } = await supabase.rpc('skip_mission', { p_assignment_id: assignmentId });
  if (error) throw normalizeSupabaseError(error);
}

export async function completeMission(assignmentId: string): Promise<void> {
  const { error } = await supabase.rpc('complete_mission', { p_assignment_id: assignmentId });
  if (error) throw normalizeSupabaseError(error);
}
