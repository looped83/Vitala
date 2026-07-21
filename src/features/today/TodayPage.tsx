import { Page } from '@/app/layout/Page';
import { PlaceholderView } from '@/features/placeholders/PlaceholderView';
import { useMyProfile } from '@/features/profile/queries';

/**
 * "Heute" — the start page. Phase 2 shows a warm greeting and an honest,
 * empty base state. Daily rituals, missions and check-ins follow in a later
 * phase (spec §37.3, no fake data).
 */
export function TodayPage(): React.JSX.Element {
  const { data: profile } = useMyProfile();
  const name = profile?.display_name?.trim();
  const greeting = name ? `Schön, dass du da bist, ${name}.` : 'Schön, dass du da bist.';

  return (
    <Page documentTitle="Heute" heading="Heute" intro={greeting}>
      <PlaceholderView
        icon="today"
        title="Dein Tag"
        description="Hier entstehen später deine Tagesrituale, der Morgen- und Abend-Check-in sowie eure Tagesmissionen."
        phaseNote="Diese Inhalte folgen in einer späteren Phase."
      />
    </Page>
  );
}
