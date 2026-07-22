import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import {
  completeMission,
  getCityStatus,
  getMissionBoard,
  getPersonalStatus,
  getResourceBalances,
  getResourceHistory,
  getWeeklyBalance,
  getXpHistory,
  skipMission,
  swapMission,
  syncRewards,
} from '@/data/repositories/rewards';
import type {
  MissionBoardItem,
  PersonalReward,
  ResourceBalances,
  ResourceTransaction,
  WeeklyBalance,
  XpTransaction,
} from '@/data/repositories/rewards';
import type { LevelStatus } from '@/domain/rewards/levels';

/**
 * Reward + mission hooks (Phase 5). Reads are the authoritative server values;
 * mutations invalidate precise subtrees only (performance §64). `useSyncRewards`
 * runs the idempotent server sync once when the reward surfaces mount.
 */

const STATUS_STALE_MS = 30_000;

export function useSyncRewards(enabled = true): UseQueryResult<null> {
  return useQuery({
    queryKey: ['rewards', 'sync'],
    queryFn: async () => {
      await syncRewards();
      return null;
    },
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function usePersonalStatus(
  householdId: string | undefined,
  userId: string | undefined,
): UseQueryResult<PersonalReward> {
  return useQuery({
    queryKey: queryKeys.rewards.personalStatus(householdId ?? 'none', userId ?? 'none'),
    queryFn: () => getPersonalStatus(householdId ?? '', userId ?? ''),
    enabled: Boolean(householdId && userId),
    staleTime: STATUS_STALE_MS,
  });
}

export function useCityStatus(householdId: string | undefined): UseQueryResult<LevelStatus> {
  return useQuery({
    queryKey: queryKeys.rewards.cityStatus(householdId ?? 'none'),
    queryFn: () => getCityStatus(householdId ?? ''),
    enabled: Boolean(householdId),
    staleTime: STATUS_STALE_MS,
  });
}

export function useResourceBalances(
  householdId: string | undefined,
): UseQueryResult<ResourceBalances> {
  return useQuery({
    queryKey: queryKeys.rewards.resources(householdId ?? 'none'),
    queryFn: () => getResourceBalances(householdId ?? ''),
    enabled: Boolean(householdId),
    staleTime: STATUS_STALE_MS,
  });
}

export function useXpHistory(householdId: string | undefined): UseQueryResult<XpTransaction[]> {
  return useQuery({
    queryKey: queryKeys.rewards.xpHistory(householdId ?? 'none'),
    queryFn: () => getXpHistory(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

export function useResourceHistory(
  householdId: string | undefined,
): UseQueryResult<ResourceTransaction[]> {
  return useQuery({
    queryKey: queryKeys.rewards.resourceHistory(householdId ?? 'none'),
    queryFn: () => getResourceHistory(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

export function useWeeklyBalance(
  householdId: string | undefined,
  weekStart: string,
): UseQueryResult<WeeklyBalance | null> {
  return useQuery({
    queryKey: queryKeys.rewards.balance(householdId ?? 'none', weekStart),
    queryFn: () => getWeeklyBalance(householdId ?? '', weekStart),
    enabled: Boolean(householdId),
    staleTime: STATUS_STALE_MS,
  });
}

export function useMissionBoard(
  householdId: string | undefined,
  enabled = true,
): UseQueryResult<MissionBoardItem[]> {
  return useQuery({
    queryKey: queryKeys.missions.board(householdId ?? 'none'),
    queryFn: () => getMissionBoard(),
    enabled: enabled && Boolean(householdId),
    staleTime: STATUS_STALE_MS,
  });
}

/** Invalidate every reward + mission surface after a reward-changing action. */
function invalidateRewardSurfaces(
  qc: ReturnType<typeof useQueryClient>,
  householdId: string | undefined,
): void {
  if (!householdId) return;
  void qc.invalidateQueries({ queryKey: queryKeys.rewards.all });
  void qc.invalidateQueries({ queryKey: queryKeys.missions.board(householdId) });
}

export function useMissionActions(householdId: string | undefined): {
  swap: (assignmentId: string) => Promise<string>;
  skip: (assignmentId: string) => Promise<void>;
  complete: (assignmentId: string) => Promise<void>;
  isPending: boolean;
} {
  const qc = useQueryClient();
  const swap = useMutation({
    mutationFn: (id: string) => swapMission(id),
    onSuccess: () => invalidateRewardSurfaces(qc, householdId),
  });
  const skip = useMutation({
    mutationFn: (id: string) => skipMission(id),
    onSuccess: () => invalidateRewardSurfaces(qc, householdId),
  });
  const complete = useMutation({
    mutationFn: (id: string) => completeMission(id),
    onSuccess: () => invalidateRewardSurfaces(qc, householdId),
  });
  return {
    swap: (id) => swap.mutateAsync(id),
    skip: (id) => skip.mutateAsync(id),
    complete: (id) => complete.mutateAsync(id),
    isPending: swap.isPending || skip.isPending || complete.isPending,
  };
}
