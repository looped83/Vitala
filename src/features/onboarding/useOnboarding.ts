import { useMemo } from 'react';
import { useMyProfile } from '@/features/profile/queries';
import { useCurrentHousehold, useHouseholdMembers } from '@/features/household/queries';
import { deriveOnboardingState } from '@/domain/onboarding/state';
import type { OnboardingState } from '@/domain/onboarding/state';

export interface OnboardingHookResult {
  isLoading: boolean;
  state: OnboardingState;
  householdId: string | null;
}

/**
 * Combines the user's profile + household membership into the derived
 * onboarding state (framework-free logic in domain/onboarding). Used by the
 * OnboardingGuard and the onboarding wizard so both agree.
 */
export function useOnboarding(): OnboardingHookResult {
  const profileQuery = useMyProfile();
  const householdQuery = useCurrentHousehold();
  const householdId = householdQuery.data?.household.id;
  const membersQuery = useHouseholdMembers(householdId);

  const isLoading =
    profileQuery.isLoading ||
    householdQuery.isLoading ||
    (Boolean(householdId) && membersQuery.isLoading);

  const state = useMemo<OnboardingState>(() => {
    const displayName = profileQuery.data?.display_name ?? '';
    const membership = householdQuery.data ? { role: householdQuery.data.membership.role } : null;
    const activeMemberCount = (membersQuery.data ?? []).filter(
      (member) => member.status === 'active',
    ).length;
    return deriveOnboardingState({ displayName, membership, activeMemberCount });
  }, [profileQuery.data, householdQuery.data, membersQuery.data]);

  return { isLoading, state, householdId: householdId ?? null };
}
