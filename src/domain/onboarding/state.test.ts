import { describe, expect, it } from 'vitest';
import { deriveOnboardingState } from './state';

describe('deriveOnboardingState', () => {
  it('starts at the profile step with no name', () => {
    const state = deriveOnboardingState({
      displayName: '',
      membership: null,
      activeMemberCount: 0,
    });
    expect(state.step).toBe('profile');
    expect(state.isComplete).toBe(false);
  });

  it('moves to household after a name is set', () => {
    const state = deriveOnboardingState({
      displayName: 'Lutz',
      membership: null,
      activeMemberCount: 0,
    });
    expect(state.step).toBe('household');
    expect(state.isComplete).toBe(false);
  });

  it('offers the optional invite step to an owner who is alone', () => {
    const state = deriveOnboardingState({
      displayName: 'Lutz',
      membership: { role: 'owner' },
      activeMemberCount: 1,
    });
    expect(state.step).toBe('invite');
    expect(state.isComplete).toBe(true);
    expect(state.canInviteSecondMember).toBe(true);
  });

  it('is complete for an owner with two members', () => {
    const state = deriveOnboardingState({
      displayName: 'Lutz',
      membership: { role: 'owner' },
      activeMemberCount: 2,
    });
    expect(state.step).toBe('complete');
    expect(state.isComplete).toBe(true);
    expect(state.canInviteSecondMember).toBe(false);
  });

  it('is complete for a member who joined', () => {
    const state = deriveOnboardingState({
      displayName: 'René',
      membership: { role: 'member' },
      activeMemberCount: 2,
    });
    expect(state.step).toBe('complete');
    expect(state.isComplete).toBe(true);
    expect(state.canInviteSecondMember).toBe(false);
  });

  it('treats whitespace-only names as unset (idempotent guard)', () => {
    const state = deriveOnboardingState({
      displayName: '   ',
      membership: null,
      activeMemberCount: 0,
    });
    expect(state.step).toBe('profile');
  });
});
