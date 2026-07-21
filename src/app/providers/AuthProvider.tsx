import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/data/supabase/client';
import { logger } from '@/lib/logging/logger';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Observes the Supabase auth session and exposes it to the app. Session
 * restoration, token refresh and sign-in/out are all reflected here. On sign
 * out the query cache is cleared so no other user's cached data lingers
 * (security §18 / privacy).
 */
export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setStatus(data.session ? 'authenticated' : 'unauthenticated');
      })
      .catch((error: unknown) => {
        if (!active) return;
        logger.warn('auth_get_session_failed');
        logger.debug('auth_get_session_error', { hasError: error != null });
        setStatus('unauthenticated');
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'authenticated' : 'unauthenticated');
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
      logger.debug('auth_state_change', { event });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, user: session?.user ?? null }),
    [status, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  }
  return ctx;
}
