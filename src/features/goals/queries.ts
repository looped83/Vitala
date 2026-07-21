import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import {
  deleteGoal,
  getGoalPeriods,
  getGoalsOverview,
  getGoalTemplates,
  saveGoal,
  setGoalManualProgress,
  setGoalStatus,
} from '@/data/repositories/goals';
import type { SaveGoalArgs } from '@/data/repositories/goals';
import type { Goal, GoalPeriod, GoalStatus, GoalTemplate } from '@/domain/goals/types';

const TEMPLATE_STALE = 1000 * 60 * 60; // 1h — reference data.

export function useGoalTemplates(): UseQueryResult<GoalTemplate[]> {
  return useQuery({
    queryKey: queryKeys.goals.templates(),
    queryFn: getGoalTemplates,
    staleTime: TEMPLATE_STALE,
  });
}

export function useGoalsOverview(householdId: string | undefined): UseQueryResult<Goal[]> {
  return useQuery({
    queryKey: queryKeys.goals.overview(householdId ?? 'none'),
    queryFn: () => getGoalsOverview(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

export function useGoalPeriods(
  householdId: string | undefined,
  goalId: string | undefined,
): UseQueryResult<GoalPeriod[]> {
  return useQuery({
    queryKey: queryKeys.goals.periods(householdId ?? 'none', goalId ?? 'none'),
    queryFn: () => getGoalPeriods(goalId ?? ''),
    enabled: Boolean(householdId) && Boolean(goalId),
  });
}

/** Invalidate goals + everything downstream that reflects goal progress. */
function useInvalidateGoals(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.today.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
  };
}

export function useSaveGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (args: SaveGoalArgs) => saveGoal(args),
    onSuccess: invalidate,
  });
}

export function useSetGoalStatus() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (args: {
      id: string;
      status: GoalStatus;
      pauseReason?: string | null;
      resumeOn?: string | null;
    }) => setGoalStatus(args.id, args.status, args.pauseReason, args.resumeOn),
    onSuccess: invalidate,
  });
}

export function useSetGoalManualProgress() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (args: { id: string; value: number }) => setGoalManualProgress(args.id, args.value),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: invalidate,
  });
}
