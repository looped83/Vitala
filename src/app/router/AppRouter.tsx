import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, PublicOnly, RequireOnboarding, RedirectIfOnboarded } from './guards';
import { RouteLoading } from './RouteLoading';
import { paths } from './routes';

// Route-level code splitting (performance §21.1). Auth pages stay light; the
// authenticated shell + feature pages load on demand.
const LoginPage = lazy(() =>
  import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const UpdatePasswordPage = lazy(() =>
  import('@/features/auth/UpdatePasswordPage').then((m) => ({ default: m.UpdatePasswordPage })),
);
const OnboardingPage = lazy(() =>
  import('@/features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const AppLayout = lazy(() =>
  import('@/app/layout/AppLayout').then((m) => ({ default: m.AppLayout })),
);
const TodayPage = lazy(() =>
  import('@/features/today/TodayPage').then((m) => ({ default: m.TodayPage })),
);
const CityPage = lazy(() =>
  import('@/features/city/CityPage').then((m) => ({ default: m.CityPage })),
);
const CapturePage = lazy(() =>
  import('@/features/capture/CapturePage').then((m) => ({ default: m.CapturePage })),
);
const GoalsPage = lazy(() =>
  import('@/features/goals/GoalsPage').then((m) => ({ default: m.GoalsPage })),
);
const ReviewPage = lazy(() =>
  import('@/features/review/ReviewPage').then((m) => ({ default: m.ReviewPage })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/features/system/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const ForbiddenPage = lazy(() =>
  import('@/features/system/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
);

export function AppRouter(): React.JSX.Element {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route index element={<Navigate to={paths.today} replace />} />

        {/* Public (redirects authenticated users away). */}
        <Route element={<PublicOnly />}>
          <Route path={paths.login} element={<LoginPage />} />
          <Route path={paths.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        {/* Reachable with a recovery session from the reset email. */}
        <Route path={paths.updatePassword} element={<UpdatePasswordPage />} />

        {/* Authenticated. */}
        <Route element={<RequireAuth />}>
          <Route element={<RedirectIfOnboarded />}>
            <Route path={paths.onboarding} element={<OnboardingPage />} />
          </Route>

          <Route element={<RequireOnboarding />}>
            <Route element={<AppLayout />}>
              <Route path={paths.today} element={<TodayPage />} />
              <Route path={paths.city} element={<CityPage />} />
              <Route path={paths.capture} element={<CapturePage />} />
              <Route path={paths.goals} element={<GoalsPage />} />
              <Route path={paths.review} element={<ReviewPage />} />
              <Route path={paths.profile} element={<ProfilePage />} />
              <Route path={paths.settings} element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path={paths.forbidden} element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
