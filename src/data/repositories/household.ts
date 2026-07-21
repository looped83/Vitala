import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import type { Database } from '@/data/supabase/database.types';
import type { MemberRole } from '@/domain/household/roles';

export type Household = Database['public']['Tables']['households']['Row'];
export type HouseholdSettings = Database['public']['Tables']['household_settings']['Row'];
export type HouseholdMemberRow = Database['public']['Tables']['household_members']['Row'];

/** A member joined with the (readable) profile of that person. */
export interface HouseholdMemberWithProfile {
  id: string;
  userId: string;
  role: MemberRole;
  status: 'active' | 'deactivated';
  displayName: string;
  accentColor: string;
}

export interface CurrentHousehold {
  household: Household;
  membership: { id: string; role: MemberRole; status: 'active' | 'deactivated' };
}

/**
 * Resolve the signed-in user's active household + their membership. RLS already
 * scopes rows to the caller; we additionally filter to the active membership.
 */
export async function getCurrentHousehold(userId: string): Promise<CurrentHousehold | null> {
  const { data: membership, error: membershipError } = await supabase
    .from('household_members')
    .select('id, household_id, role, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (membershipError) throw normalizeSupabaseError(membershipError);
  if (!membership) return null;

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', membership.household_id)
    .single();
  if (householdError) throw normalizeSupabaseError(householdError);

  return {
    household,
    membership: { id: membership.id, role: membership.role, status: membership.status },
  };
}

export async function getHouseholdMembers(
  householdId: string,
): Promise<HouseholdMemberWithProfile[]> {
  // Two indexed queries (members + profiles) then a client-side join — avoids
  // relying on a PostgREST FK relationship to auth-scoped profiles.
  const { data: members, error } = await supabase
    .from('household_members')
    .select('id, user_id, role, status')
    .eq('household_id', householdId)
    .order('role', { ascending: true });
  if (error) throw normalizeSupabaseError(error);

  const ids = members.map((m) => m.user_id);
  const profilesById = new Map<string, { display_name: string; accent_color: string }>();
  if (ids.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, accent_color')
      .in('id', ids);
    if (profilesError) throw normalizeSupabaseError(profilesError);
    for (const profile of profiles) {
      profilesById.set(profile.id, {
        display_name: profile.display_name,
        accent_color: profile.accent_color,
      });
    }
  }

  return members.map((member) => {
    const profile = profilesById.get(member.user_id);
    return {
      id: member.id,
      userId: member.user_id,
      role: member.role,
      status: member.status,
      displayName: profile?.display_name ?? '',
      accentColor: profile?.accent_color ?? 'movement',
    };
  });
}

export async function getHouseholdSettings(householdId: string): Promise<HouseholdSettings | null> {
  const { data, error } = await supabase
    .from('household_settings')
    .select('*')
    .eq('household_id', householdId)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function updateHouseholdSettings(
  householdId: string,
  patch: Partial<Pick<HouseholdSettings, 'timezone' | 'week_start' | 'theme_default'>>,
): Promise<HouseholdSettings> {
  const { data, error } = await supabase
    .from('household_settings')
    .update(patch)
    .eq('household_id', householdId)
    .select('*')
    .single();
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function renameHousehold(householdId: string, name: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .update({ name })
    .eq('id', householdId)
    .select('*')
    .single();
  if (error) throw normalizeSupabaseError(error);
  return data;
}

// ---- RPC wrappers (the only write path for membership/invites) ----

export async function createHousehold(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_household', { p_name: name });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export interface InviteResult {
  code: string;
  expiresAt: string;
}

export async function createInvite(): Promise<InviteResult> {
  const { data, error } = await supabase.rpc('create_household_invite');
  if (error) throw normalizeSupabaseError(error);
  const row = Array.isArray(data) ? data[0] : undefined;
  if (!row) throw normalizeSupabaseError(new Error('no_invite'));
  return { code: row.code, expiresAt: row.expires_at };
}

export async function acceptInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_household_invite', { p_code: code });
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function deactivateMember(memberId: string): Promise<void> {
  const { error } = await supabase.rpc('deactivate_household_member', { p_member_id: memberId });
  if (error) throw normalizeSupabaseError(error);
}
