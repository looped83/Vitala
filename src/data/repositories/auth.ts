import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/data/supabase/client';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import type { LoginInput } from '@/domain/auth/schemas';

/**
 * Auth data access. Every function normalizes Supabase errors to AppError so
 * callers (hooks/forms) never see raw provider messages (security §23).
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw normalizeSupabaseError(error);
  return data.session;
}

export async function signInWithPassword(input: LoginInput): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw normalizeSupabaseError(error);
  if (!data.session) {
    throw normalizeSupabaseError(new Error('no_session'));
  }
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw normalizeSupabaseError(error);
}

export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw normalizeSupabaseError(error);
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw normalizeSupabaseError(error);
}
