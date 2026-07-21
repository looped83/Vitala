import type { MemberRole } from '@/domain/household/roles';

/**
 * Pure derivation of onboarding progress from the user's current data. Keeping
 * this framework-free makes the guard and the wizard testable and consistent
 * (user-flows §14.1–14.3). Onboarding is idempotent: re-deriving from persisted
 * state always yields the same step, so a reload never creates a second
 * household or skips a completed step.
 */
export type OnboardingStep = 'profile' | 'household' | 'invite' | 'complete';

export interface OnboardingInput {
  /** Trimmed display name from the profile ('' when not yet set). */
  displayName: string;
  /** The user's active membership, or null when not in a household yet. */
  membership: { role: MemberRole } | null;
  /** Count of active members in the user's household (0 when none). */
  activeMemberCount: number;
}

export interface OnboardingState {
  step: OnboardingStep;
  /** True once the required steps (profile + household) are done. */
  isComplete: boolean;
  /** Owner is alone and can still invite a second person (optional step). */
  canInviteSecondMember: boolean;
}

export function deriveOnboardingState(input: OnboardingInput): OnboardingState {
  const hasName = input.displayName.trim().length > 0;
  const hasHousehold = input.membership !== null;
  const isOwner = input.membership?.role === 'owner';
  const canInviteSecondMember = isOwner && input.activeMemberCount < 2;

  let step: OnboardingStep;
  if (!hasName) {
    step = 'profile';
  } else if (!hasHousehold) {
    step = 'household';
  } else if (canInviteSecondMember) {
    step = 'invite';
  } else {
    step = 'complete';
  }

  return {
    step,
    // Required onboarding is complete as soon as the user has a name and a
    // household; inviting the second member is optional and skippable.
    isComplete: hasName && hasHousehold,
    canInviteSecondMember,
  };
}
