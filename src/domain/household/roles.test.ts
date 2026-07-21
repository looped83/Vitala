import { describe, expect, it } from 'vitest';
import {
  canAddMember,
  canManageMembers,
  isMemberRole,
  isMemberStatus,
  MAX_ACTIVE_MEMBERS,
} from './roles';

describe('roles', () => {
  it('only owners can manage members', () => {
    expect(canManageMembers('owner')).toBe(true);
    expect(canManageMembers('member')).toBe(false);
  });

  it('allows a new member only below the cap', () => {
    expect(canAddMember(0)).toBe(true);
    expect(canAddMember(1)).toBe(true);
    expect(canAddMember(MAX_ACTIVE_MEMBERS)).toBe(false);
    expect(canAddMember(3)).toBe(false);
  });

  it('validates role and status values', () => {
    expect(isMemberRole('owner')).toBe(true);
    expect(isMemberRole('admin')).toBe(false);
    expect(isMemberStatus('active')).toBe(true);
    expect(isMemberStatus('deleted')).toBe(false);
  });
});
