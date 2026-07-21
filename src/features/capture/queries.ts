import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import { getActivityTypes, getRitualDefinitions } from '@/data/repositories/activityCatalog';
import {
  deleteEntry,
  getEntryDetail,
  getHistoryPage,
  saveActivity,
  saveRitualCheckin,
} from '@/data/repositories/entries';
import type {
  FeedCursor,
  HistoryPage,
  SaveActivityArgs,
  SaveRitualArgs,
} from '@/data/repositories/entries';
import { deleteFavorite, getFavorites, saveFavorite } from '@/data/repositories/favorites';
import type { SaveFavoriteArgs } from '@/data/repositories/favorites';
import type { ActivityType, EntryKind, Favorite, RitualDefinition } from '@/domain/activity/types';

const CATALOG_STALE = 1000 * 60 * 60; // 1h — reference data barely changes.

export function useActivityTypes(): UseQueryResult<ActivityType[]> {
  return useQuery({
    queryKey: queryKeys.catalog.activityTypes(),
    queryFn: getActivityTypes,
    staleTime: CATALOG_STALE,
  });
}

export function useRitualDefinitions(): UseQueryResult<RitualDefinition[]> {
  return useQuery({
    queryKey: queryKeys.catalog.ritualDefinitions(),
    queryFn: getRitualDefinitions,
    staleTime: CATALOG_STALE,
  });
}

/** Both catalogs together; ready only when both have loaded. */
export function useCatalog(): {
  types: ActivityType[];
  definitions: RitualDefinition[];
  isLoading: boolean;
  isError: boolean;
} {
  const types = useActivityTypes();
  const definitions = useRitualDefinitions();
  return {
    types: types.data ?? [],
    definitions: definitions.data ?? [],
    isLoading: types.isLoading || definitions.isLoading,
    isError: types.isError || definitions.isError,
  };
}

export function useFavorites(householdId: string | undefined): UseQueryResult<Favorite[]> {
  return useQuery({
    queryKey: queryKeys.favorites.list(householdId ?? 'none'),
    queryFn: () => getFavorites(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

/** Paginated shared history. Catalog must be loaded for label resolution. */
export function useHistory(
  householdId: string | undefined,
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] },
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.entries.history(householdId ?? 'none'),
    initialPageParam: null as FeedCursor | null,
    queryFn: ({ pageParam }: { pageParam: FeedCursor | null }) =>
      getHistoryPage({ householdId: householdId ?? '', catalog, cursor: pageParam }),
    getNextPageParam: (lastPage: HistoryPage) => lastPage.nextCursor,
    enabled: enabled && Boolean(householdId) && catalog.types.length > 0,
  });
}

export function useEntryDetail(
  householdId: string | undefined,
  kind: EntryKind,
  id: string | undefined,
  catalog: { types: ActivityType[]; definitions: RitualDefinition[] },
) {
  return useQuery({
    queryKey: queryKeys.entries.detail(householdId ?? 'none', kind, id ?? 'none'),
    queryFn: () => getEntryDetail(householdId ?? '', kind, id ?? '', catalog),
    enabled: Boolean(householdId) && Boolean(id) && catalog.types.length > 0,
  });
}

/** Invalidate every entry list + detail after a write (targeted subtree §29). */
function useInvalidateEntries(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.entries.all });
  };
}

export function useSaveActivity() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: (args: SaveActivityArgs) => saveActivity(args),
    onSuccess: invalidate,
  });
}

export function useSaveRitual() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: (args: SaveRitualArgs) => saveRitualCheckin(args),
    onSuccess: invalidate,
  });
}

export function useDeleteEntry() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: EntryKind; id: string }) => deleteEntry(kind, id),
    onSuccess: invalidate,
  });
}

export function useSaveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: SaveFavoriteArgs) => saveFavorite(args),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}

export function useDeleteFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFavorite(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });
}
