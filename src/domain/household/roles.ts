/**
 * Household role/status domain helpers (framework-free). Roles are deliberately
 * minimal — owner + member (ADR-0006).
 */
export type MemberRole = 'owner' | 'member';
export type MemberStatus = 'active' | 'deactivated';

export const MEMBER_ROLES: readonly MemberRole[] = ['owner', 'member'];
export const MEMBER_STATUSES: readonly MemberStatus[] = ['active', 'deactivated'];

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Verwaltung',
  member: 'Mitglied',
};

export function isMemberRole(value: unknown): value is MemberRole {
  return value === 'owner' || value === 'member';
}

export function isMemberStatus(value: unknown): value is MemberStatus {
  return value === 'active' || value === 'deactivated';
}

/** Can this role invite / manage members? Owner-only (security §17.3). */
export function canManageMembers(role: MemberRole): boolean {
  return role === 'owner';
}

export const MAX_ACTIVE_MEMBERS = 2;

/** Is there still room for another active member? */
export function canAddMember(activeCount: number): boolean {
  return activeCount < MAX_ACTIVE_MEMBERS;
}
