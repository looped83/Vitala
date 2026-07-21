import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import type { Database } from '@/data/supabase/database.types';
import type { ProfileInput } from '@/domain/profile/schemas';
import type { PreferencesInput } from '@/domain/settings/schemas';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Preferences = Database['public']['Tables']['user_preferences']['Row'];

/** Load the signed-in user's profile (auto-created on signup). */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function updateMyProfile(userId: string, input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: input.display_name,
      accent_color: input.accent_color,
      avatar_motif: input.avatar_motif ? input.avatar_motif : null,
    })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function getMyPreferences(userId: string): Promise<Preferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw normalizeSupabaseError(error);
  return data;
}

export async function updateMyPreferences(
  userId: string,
  input: PreferencesInput,
): Promise<Preferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      theme: input.theme,
      reduced_motion: input.reduced_motion,
      locale: input.locale,
    })
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw normalizeSupabaseError(error);
  return data;
}
