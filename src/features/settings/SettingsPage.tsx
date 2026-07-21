import { useNavigate } from 'react-router-dom';
import { Page } from '@/app/layout/Page';
import { Card } from '@/ui/Card/Card';
import { Section } from '@/ui/Section/Section';
import { Switch } from '@/ui/Form/Switch';
import { Select } from '@/ui/Form/Select';
import { FormField } from '@/ui/Form/FormField';
import { Button } from '@/ui/Button/Button';
import { Divider } from '@/ui/Divider/Divider';
import { Alert } from '@/ui/Alert/Alert';
import { Link } from '@/ui/Link/Link';
import { useToast } from '@/ui/Toast/ToastProvider';
import { ThemeToggle } from './ThemeToggle';
import { useThemePreference } from './useThemePreference';
import { MembersList } from '@/features/household/MembersList';
import { InvitePanel } from '@/features/household/InvitePanel';
import {
  useCurrentHousehold,
  useHouseholdMembers,
  useHouseholdSettings,
  useUpdateHouseholdSettings,
} from '@/features/household/queries';
import { canManageMembers } from '@/domain/household/roles';
import { TIMEZONE_OPTIONS, WEEK_START_OPTIONS } from '@/domain/settings/schemas';
import { signOut } from '@/data/repositories/auth';
import { paths } from '@/app/router/routes';

/** Settings: appearance, accessibility, household, privacy, account (spec §37.9). */
export function SettingsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const toast = useToast();
  const { reducedMotion, setReducedMotion } = useThemePreference();
  const { data: current } = useCurrentHousehold();
  const householdId = current?.household.id;
  const isOwner = current ? canManageMembers(current.membership.role) : false;

  const { data: members } = useHouseholdMembers(householdId);
  const activeCount = (members ?? []).filter((m) => m.status === 'active').length;
  const { data: settings } = useHouseholdSettings(householdId);
  const updateSettings = useUpdateHouseholdSettings();

  const handleSettingChange = (patch: Partial<{ timezone: string; week_start: number }>): void => {
    if (!householdId) return;
    updateSettings.mutate(
      { householdId, patch },
      {
        onSuccess: () => toast.show('Einstellung gespeichert.', 'success'),
        onError: () => toast.show('Einstellung konnte nicht gespeichert werden.', 'attention'),
      },
    );
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
    } finally {
      navigate(paths.login, { replace: true });
    }
  };

  return (
    <Page documentTitle="Einstellungen" heading="Einstellungen" narrow>
      <Card>
        <Section title="Erscheinungsbild" headingLevel={2}>
          <ThemeToggle />
        </Section>
      </Card>

      <Card>
        <Section
          title="Barrierefreiheit"
          description="Diese Einstellungen unterstützen eine ruhige, zugängliche Nutzung."
          headingLevel={2}
        >
          <Switch
            label="Reduzierte Bewegung"
            description="Reduziert nicht-essentielle Animationen (respektiert auch die Systemeinstellung)."
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />
        </Section>
      </Card>

      <Card>
        <Section title="Household" description={current?.household.name} headingLevel={2}>
          {householdId ? (
            <div style={{ display: 'grid', gap: 'var(--space-24)' }}>
              <MembersList householdId={householdId} />

              {isOwner ? (
                <>
                  <Divider />
                  <InvitePanel isFull={activeCount >= 2} />
                </>
              ) : null}

              <Divider />

              <FormField label="Zeitzone" description="Für Tages- und Wochengrenzen.">
                <Select
                  value={settings?.timezone ?? 'Europe/Berlin'}
                  onChange={(event) => handleSettingChange({ timezone: event.target.value })}
                  options={TIMEZONE_OPTIONS.map((tz) => ({ value: tz, label: tz }))}
                />
              </FormField>

              <FormField label="Wochenbeginn">
                <Select
                  value={String(settings?.week_start ?? 1)}
                  onChange={(event) =>
                    handleSettingChange({ week_start: Number(event.target.value) })
                  }
                  options={WEEK_START_OPTIONS.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  }))}
                />
              </FormField>
            </div>
          ) : (
            <Alert tone="info">Du gehörst noch keinem Household an.</Alert>
          )}
        </Section>
      </Card>

      <Card>
        <Section title="Datenschutz" headingLevel={2}>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Vitala speichert nur die für die App notwendigen Daten und nutzt kein externes Tracking.
            In dieser Phase sind das dein Profil, deine Einstellungen sowie eure Household- und
            Mitgliedschaftsdaten. Details findest du in der{' '}
            <Link
              external
              href="https://github.com/looped83/Vitala/blob/main/docs/privacy-data-inventory.md"
              target="_blank"
            >
              Datenschutzübersicht
            </Link>
            .
          </p>
        </Section>
      </Card>

      <Card>
        <Section title="Konto" headingLevel={2}>
          <Button variant="secondary" onClick={() => void handleLogout()}>
            Abmelden
          </Button>
        </Section>
      </Card>
    </Page>
  );
}
