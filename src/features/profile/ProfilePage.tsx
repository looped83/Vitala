import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Page } from '@/app/layout/Page';
import { Card } from '@/ui/Card/Card';
import { Section } from '@/ui/Section/Section';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { RadioGroup } from '@/ui/Form/RadioGroup';
import { Switch } from '@/ui/Form/Switch';
import { Button } from '@/ui/Button/Button';
import { Avatar } from '@/ui/Avatar/Avatar';
import { Alert } from '@/ui/Alert/Alert';
import { Spinner } from '@/ui/Spinner/Spinner';
import { useToast } from '@/ui/Toast/ToastProvider';
import { ThemeToggle } from '@/features/settings/ThemeToggle';
import { useThemePreference } from '@/features/settings/useThemePreference';
import { useMyProfile, useUpdateProfile } from '@/features/profile/queries';
import { profileSchema, ACCENT_COLORS, ACCENT_LABELS } from '@/domain/profile/schemas';
import type { ProfileInput, AccentColor } from '@/domain/profile/schemas';
import { deriveInitials } from '@/ui/Avatar/Avatar';
import { lifeAreaColorVar } from '@/ui/tokens';
import { useAuth } from '@/app/providers/AuthProvider';
import { useCurrentHousehold } from '@/features/household/queries';
import { LevelCard } from '@/features/rewards/LevelCard';
import { TransactionHistory } from '@/features/rewards/TransactionHistory';
import { usePersonalStatus, useSyncRewards } from '@/features/rewards/queries';

const ACCENT_OPTIONS = ACCENT_COLORS.map((value) => ({ value, label: ACCENT_LABELS[value] }));

/** Fully functional profile management (spec §37.8). */
export function ProfilePage(): React.JSX.Element {
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const { reducedMotion, setReducedMotion } = useThemePreference();
  const { user } = useAuth();
  const { data: household } = useCurrentHousehold();
  const householdId = household?.household.id;
  useSyncRewards(Boolean(householdId));
  const personal = usePersonalStatus(householdId, user?.id);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '', accent_color: 'movement', avatar_motif: '' },
  });

  // Populate the form once the profile has loaded.
  useEffect(() => {
    if (profile) {
      reset({
        display_name: profile.display_name,
        accent_color: profile.accent_color,
        avatar_motif: profile.avatar_motif ?? '',
      });
    }
  }, [profile, reset]);

  const displayName = watch('display_name');
  const accent = watch('accent_color');

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        await updateProfile.mutateAsync(values);
        toast.show('Profil gespeichert.', 'success');
      } catch {
        toast.show('Profil konnte nicht gespeichert werden.', 'attention');
      }
    },
    () => setFocus('display_name'),
  );

  if (isLoading) {
    return (
      <Page documentTitle="Profil" heading="Profil">
        <Spinner size="lg" label="Profil wird geladen" />
      </Page>
    );
  }

  return (
    <Page documentTitle="Profil" heading="Profil" narrow>
      <div style={{ display: 'grid', gap: 'var(--space-24)', marginBottom: 'var(--space-24)' }}>
        {personal.data ? (
          <LevelCard
            status={personal.data.status}
            heading="Dein Fortschritt"
            caption={profile?.display_name}
            scopeLabel="Persönliches Level"
          />
        ) : null}
        <Card>
          <Section title="XP-Verlauf" description="Wodurch deine Erfahrung entstanden ist." headingLevel={2}>
            <TransactionHistory householdId={householdId} kind="xp" />
          </Section>
        </Card>
      </div>

      <form
        onSubmit={(event) => void onSubmit(event)}
        noValidate
        style={{ display: 'grid', gap: 'var(--space-24)' }}
      >
        <Card>
          <Section title="Deine Angaben" headingLevel={2}>
            <div style={{ display: 'grid', gap: 'var(--space-16)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
                <Avatar
                  name={displayName || 'Profil'}
                  accentColor={lifeAreaColorVar[accent]}
                  size="lg"
                />
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Deine Initialen ({deriveInitials(displayName || '?')}) und Akzentfarbe bilden dein
                  Profilbild.
                </p>
              </div>

              <FormField label="Anzeigename" error={errors.display_name?.message} required>
                <Input autoComplete="nickname" {...register('display_name')} />
              </FormField>

              <RadioGroup<AccentColor>
                legend="Akzentfarbe"
                value={accent}
                options={ACCENT_OPTIONS}
                onValueChange={(value) => setValue('accent_color', value, { shouldDirty: true })}
                orientation="stack"
              />

              <FormField
                label="Motiv (optional)"
                description="Ein kurzes Stichwort für dein Profil, z. B. „Wald“."
                error={errors.avatar_motif?.message}
              >
                <Input maxLength={40} {...register('avatar_motif')} />
              </FormField>
            </div>
          </Section>
        </Card>

        <Card>
          <Section
            title="Erscheinungsbild & Bewegung"
            description="Diese Einstellungen gelten für dich – auf allen Geräten."
            headingLevel={2}
          >
            <div style={{ display: 'grid', gap: 'var(--space-16)' }}>
              <ThemeToggle />
              <Switch
                label="Reduzierte Bewegung"
                description="Reduziert nicht-essentielle Animationen."
                checked={reducedMotion}
                onChange={(event) => setReducedMotion(event.target.checked)}
              />
            </div>
          </Section>
        </Card>

        {updateProfile.isError ? (
          <Alert tone="attention" role="alert">
            Deine Änderungen wurden nicht gespeichert. Bitte versuche es erneut.
          </Alert>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty && !isSubmitting}>
            Profil speichern
          </Button>
        </div>
      </form>
    </Page>
  );
}
