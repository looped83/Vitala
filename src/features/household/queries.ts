import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import {
  acceptInvite,
  createHousehold,
  createInvite,
  deactivateMember,
  getCurrentHousehold,
  getHouseholdMembers,
  getHouseholdSettings,
  renameHousehold,
  updateHouseholdSettings,
} from '@/data/repositories/household';
import type {
  CurrentHousehold,
  HouseholdMemberWithProfile,
  HouseholdSettings,
  InviteResult,
} from '@/data/repositories/household';
import { useAuth } from '@/app/providers/AuthProvider';

export function useCurrentHousehold(): UseQueryResult<CurrentHousehold | null> {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.household.current(),
    queryFn: () => getCurrentHousehold(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });
}

export function useHouseholdMembers(
  householdId: string | undefined,
): UseQueryResult<HouseholdMemberWithProfile[]> {
  return useQuery({
    queryKey: queryKeys.household.members(householdId ?? 'none'),
    queryFn: () => getHouseholdMembers(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

export function useHouseholdSettings(
  householdId: string | undefined,
): UseQueryResult<HouseholdSettings | null> {
  return useQuery({
    queryKey: queryKeys.household.settings(householdId ?? 'none'),
    queryFn: () => getHouseholdSettings(householdId ?? ''),
    enabled: Boolean(householdId),
  });
}

/** Invalidate the whole household subtree after a membership/household change. */
function useInvalidateHousehold(): () => void {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.household.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.state() });
  };
}

export function useCreateHousehold() {
  const invalidate = useInvalidateHousehold();
  return useMutation({
    mutationFn: (name: string) => createHousehold(name),
    onSuccess: invalidate,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  return useMutation<InviteResult, unknown, void>({
    mutationFn: () => createInvite(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.all });
    },
  });
}

export function useAcceptInvite() {
  const invalidate = useInvalidateHousehold();
  return useMutation({
    mutationFn: (code: string) => acceptInvite(code),
    onSuccess: invalidate,
  });
}

export function useDeactivateMember() {
  const invalidate = useInvalidateHousehold();
  return useMutation({
    mutationFn: (memberId: string) => deactivateMember(memberId),
    onSuccess: invalidate,
  });
}

export function useRenameHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ householdId, name }: { householdId: string; name: string }) =>
      renameHousehold(householdId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.all });
    },
  });
}

export function useUpdateHouseholdSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      householdId,
      patch,
    }: {
      householdId: string;
      patch: Partial<Pick<HouseholdSettings, 'timezone' | 'week_start' | 'theme_default'>>;
    }) => updateHouseholdSettings(householdId, patch),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.household.settings(settings.household_id), settings);
    },
  });
}
