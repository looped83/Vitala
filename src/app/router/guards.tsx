import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOnboarding } from '@/features/onboarding/useOnboarding';
import { RouteLoading } from './RouteLoading';
import { paths } from './routes';
import { DEFAULT_REDIRECT, sanitizeRedirect } from '@/lib/navigation/redirect';

/**
 * Auth guard: requires a signed-in user. While the session is resolving we show
 * a loader (never flash the login page). Unauthenticated users are sent to
 * /login with a *sanitized* return path (open-redirect safe, security §30).
 */
export function RequireAuth(): React.JSX.Element {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <RouteLoading />;
  if (status === 'unauthenticated') {
    const from = `${location.pathname}${location.search}`;
    const redirect = sanitizeRedirect(from, DEFAULT_REDIRECT);
    return <Navigate to={`${paths.login}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  return <Outlet />;
}

/**
 * Public-only guard: redirects already-authenticated users away from
 * login/reset. Sends them to a sanitized `redirect` param or the default.
 */
export function PublicOnly(): React.JSX.Element {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <RouteLoading />;
  if (status === 'authenticated') {
    const params = new URLSearchParams(location.search);
    const redirect = sanitizeRedirect(params.get('redirect'), DEFAULT_REDIRECT);
    return <Navigate to={redirect} replace />;
  }
  return <Outlet />;
}

/**
 * Onboarding guard for the main app: users who have not finished onboarding
 * (profile + household) are routed to the wizard. No redirect loop: the
 * onboarding route lives outside this guard.
 */
export function RequireOnboarding(): React.JSX.Element {
  const { isLoading, state } = useOnboarding();
  if (isLoading) return <RouteLoading />;
  if (!state.isComplete) return <Navigate to={paths.onboarding} replace />;
  return <Outlet />;
}

/**
 * Inverse guard for the onboarding route: once onboarding is complete, keep the
 * wizard out of reach (send to the app). Prevents a completed user from being
 * stuck in onboarding.
 */
export function RedirectIfOnboarded(): React.JSX.Element {
  const { isLoading, state } = useOnboarding();
  if (isLoading) return <RouteLoading />;
  // Keep the optional "invite the second member" step reachable: only redirect
  // out of onboarding once the required steps are done AND there is no pending
  // optional invite step (owner still alone). The wizard's "skip" navigates to
  // the app imperatively.
  if (state.isComplete && !state.canInviteSecondMember) {
    return <Navigate to={paths.today} replace />;
  }
  return <Outlet />;
}
