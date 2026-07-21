import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { RouteLoading } from '@/app/router/RouteLoading';
import { useOnboarding } from './useOnboarding';
import { OnboardingProgress } from './OnboardingProgress';
import { ProfileStep } from './steps/ProfileStep';
import { HouseholdStep } from './steps/HouseholdStep';
import { InviteStep } from './steps/InviteStep';
import { paths } from '@/app/router/routes';
import { useDocumentTitle } from '@/app/hooks/useDocumentTitle';

/**
 * Idempotent onboarding wizard (spec §12, user-flows §14.1–14.3). The current
 * step is *derived* from persisted data, so a reload never repeats a finished
 * step or creates a second household. Steps: Profil → Household → (Einladung).
 */
export function OnboardingPage(): React.JSX.Element {
  useDocumentTitle('Einrichtung');
  const navigate = useNavigate();
  const { isLoading, state } = useOnboarding();

  if (isLoading) return <RouteLoading label="Einrichtung wird vorbereitet …" />;

  const finish = (): void => navigate(paths.today, { replace: true });

  return (
    <AuthLayout
      title="Willkommen bei Vitala"
      subtitle="Nur ein paar Schritte, dann kann es losgehen."
    >
      <OnboardingProgress step={state.step} />
      {state.step === 'profile' ? <ProfileStep /> : null}
      {state.step === 'household' ? <HouseholdStep /> : null}
      {state.step === 'invite' ? <InviteStep onFinish={finish} /> : null}
    </AuthLayout>
  );
}
