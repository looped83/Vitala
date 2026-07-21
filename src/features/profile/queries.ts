import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/data/queryKeys';
import {
  getMyPreferences,
  getMyProfile,
  updateMyPreferences,
  updateMyProfile,
} from '@/data/repositories/profile';
import type { Preferences, Profile } from '@/data/repositories/profile';
import { useAuth } from '@/app/providers/AuthProvider';
import type { ProfileInput } from '@/domain/profile/schemas';
import type { PreferencesInput } from '@/domain/settings/schemas';

export function useMyProfile(): UseQueryResult<Profile | null> {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: () => getMyProfile(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => updateMyProfile(user?.id ?? '', input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.me(), profile);
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.state() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.household.all });
    },
  });
}

export function useMyPreferences(): UseQueryResult<Preferences | null> {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.preferences.me(),
    queryFn: () => getMyPreferences(user?.id ?? ''),
    enabled: Boolean(user?.id),
  });
}

export function useUpdatePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PreferencesInput) => updateMyPreferences(user?.id ?? '', input),
    onSuccess: (preferences) => {
      queryClient.setQueryData(queryKeys.preferences.me(), preferences);
    },
  });
}
