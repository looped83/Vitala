import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/config/env';
import type { Database } from './database.types';

/**
 * The single Supabase browser client for the whole app.
 *
 * Exactly one instance is created (a module singleton) so session persistence
 * and token refresh behave consistently (technical-architecture §15.1). Only
 * the public anon key is used — never a service-role key in the browser
 * (security §30). Sessions persist in localStorage and tokens auto-refresh.
 */
export type VitalaClient = SupabaseClient<Database>;

export const supabase: VitalaClient = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'vitala.auth',
  },
  global: {
    headers: { 'x-client-info': 'vitala-web' },
  },
});
