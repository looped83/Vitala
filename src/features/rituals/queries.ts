import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import {
  clearRitualCompletion,
  completeRitual,
  deleteRitual,
  getRitualCompletions,
  getRituals,
  saveRitual,
  setRitualStatus,
} from '@/data/repositories/rituals';
import type { CompleteRitualArgs, SaveRitualArgs } from '@/data/repositories/rituals';
import type { Ritual, RitualCompletion, RitualStatus } from '@/domain/rituals/types';

export function useRituals(householdId: string | undefined): UseQueryResult<Ritual[]> {
  return useQuery({
    queryKey: queryKeys.rituals.list(householdId ?? 'none'),
    queryFn: () => getRituals(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

export function useRitualCompletions(
  householdId: string | undefined,
  from: string,
  to: string,
): UseQueryResult<RitualCompletion[]> {
  return useQuery({
    queryKey: queryKeys.rituals.completions(householdId ?? 'none', from, to),
    queryFn: () => getRitualCompletions(householdId ?? '', from, to),
    enabled: Boolean(householdId),
  });
}

function useInvalidateRituals(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.rituals.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.today.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
  };
}

export function useSaveRitual() {
  const invalidate = useInvalidateRituals();
  return useMutation({
    mutationFn: (args: SaveRitualArgs) => saveRitual(args),
    onSuccess: invalidate,
  });
}

export function useSetRitualStatus() {
  const invalidate = useInvalidateRituals();
  return useMutation({
    mutationFn: (args: { id: string; status: RitualStatus }) =>
      setRitualStatus(args.id, args.status),
    onSuccess: invalidate,
  });
}

export function useDeleteRitual() {
  const invalidate = useInvalidateRituals();
  return useMutation({
    mutationFn: (id: string) => deleteRitual(id),
    onSuccess: invalidate,
  });
}

export function useCompleteRitual() {
  const invalidate = useInvalidateRituals();
  return useMutation({
    mutationFn: (args: CompleteRitualArgs) => completeRitual(args),
    onSuccess: invalidate,
  });
}

export function useClearRitualCompletion() {
  const invalidate = useInvalidateRituals();
  return useMutation({
    mutationFn: (args: { ritualId: string; occurredOn: string }) =>
      clearRitualCompletion(args.ritualId, args.occurredOn),
    onSuccess: invalidate,
  });
}
