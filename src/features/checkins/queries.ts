import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import { getCheckIn, getCheckInsRange, saveCheckIn } from '@/data/repositories/checkins';
import type { SaveCheckInArgs } from '@/data/repositories/checkins';
import { useAuth } from '@/app/providers/AuthProvider';
import type { CheckIn, CheckInType } from '@/domain/checkins/types';

export function useCheckIn(
  type: CheckInType,
  businessDate: string,
): UseQueryResult<CheckIn | null> {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.checkins.day(`${user?.id ?? 'none'}:${type}`, businessDate),
    queryFn: () => getCheckIn(user?.id ?? '', type, businessDate),
    enabled: Boolean(user?.id),
  });
}

export function useCheckInsRange(from: string, to: string): UseQueryResult<CheckIn[]> {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.checkins.range(user?.id ?? 'none', from, to),
    queryFn: () => getCheckInsRange(user?.id ?? '', from, to),
    enabled: Boolean(user?.id),
  });
}

export function useSaveCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: SaveCheckInArgs) => saveCheckIn(args),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.checkins.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.today.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.missions.all });
    },
  });
}
