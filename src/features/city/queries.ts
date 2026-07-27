import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import {
  acknowledgeCityLevel,
  getCityOverview,
  renameCity,
  setCityViewMode,
} from '@/data/repositories/city';
import type { CityOverview } from '@/data/repositories/city';
import type { CityViewMode } from '@/domain/city/view';

/**
 * City hooks (Phase 6). The overview is the authoritative household state +
 * the caller's view preference. Mutations invalidate only the city subtree
 * (performance §52) — never the whole cache. Static layout definitions live in
 * the domain layer, so no query is needed for them.
 */

const CITY_STALE_MS = 30_000;

export function useCityOverview(householdId: string | undefined): UseQueryResult<CityOverview> {
  return useQuery({
    queryKey: queryKeys.city.overview(householdId ?? 'none'),
    queryFn: () => getCityOverview(),
    enabled: Boolean(householdId),
    staleTime: CITY_STALE_MS,
  });
}

export function useCityActions(householdId: string | undefined): {
  rename: (name: string) => Promise<void>;
  setViewMode: (mode: CityViewMode) => Promise<void>;
  acknowledgeLevel: () => Promise<void>;
  isRenaming: boolean;
} {
  const qc = useQueryClient();
  const invalidate = (): void => {
    if (!householdId) return;
    void qc.invalidateQueries({ queryKey: queryKeys.city.overview(householdId) });
  };

  const rename = useMutation({
    mutationFn: (name: string) => renameCity(name),
    onSuccess: invalidate,
  });

  const setView = useMutation({
    mutationFn: (mode: CityViewMode) => setCityViewMode(mode),
    // Optimistically update the cached preference so the toggle feels instant;
    // the server value reconciles on the next fetch.
    onMutate: async (mode: CityViewMode) => {
      if (!householdId) return;
      const key = queryKeys.city.overview(householdId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CityOverview>(key);
      if (previous) qc.setQueryData<CityOverview>(key, { ...previous, viewMode: mode });
      return { previous };
    },
    onError: (_e, _mode, context) => {
      if (householdId && context?.previous) {
        qc.setQueryData(queryKeys.city.overview(householdId), context.previous);
      }
    },
  });

  const acknowledge = useMutation({
    mutationFn: () => acknowledgeCityLevel(),
    onSuccess: invalidate,
  });

  return {
    rename: (name) => rename.mutateAsync(name),
    setViewMode: (mode) => setView.mutateAsync(mode),
    acknowledgeLevel: () => acknowledge.mutateAsync(),
    isRenaming: rename.isPending,
  };
}
