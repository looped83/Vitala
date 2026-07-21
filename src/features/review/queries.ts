import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import { getReviewData } from '@/data/repositories/reviews';
import type { ReviewData } from '@/data/repositories/reviews';
import type { ActivityType, RitualDefinition } from '@/domain/activity/types';

export function useReviewData(
  householdId: string | undefined,
  scope: string,
  from: string,
  to: string,
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] },
  enabled = true,
): UseQueryResult<ReviewData> {
  return useQuery({
    queryKey: queryKeys.reviews.window(householdId ?? 'none', scope, from, to),
    queryFn: () => getReviewData(householdId ?? '', from, to, catalog),
    enabled: enabled && Boolean(householdId) && catalog.types.length > 0,
  });
}
