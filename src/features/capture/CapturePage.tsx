import { Page } from '@/app/layout/Page';
import { PlaceholderView } from '@/features/placeholders/PlaceholderView';

/** "Erfassen" — no functionless forms in Phase 2 (spec §37.5). */
export function CapturePage(): React.JSX.Element {
  return (
    <Page
      documentTitle="Erfassen"
      heading="Erfassen"
      intro="Bewegung, Ernährung, Nachhaltigkeit und Tierwohl – schnell und ohne Druck erfasst."
    >
      <PlaceholderView
        icon="capture"
        title="Aktivitäten erfassen"
        description="Hier erfasst du später deine Bewegung sowie eure Rituale für Ernährung, Nachhaltigkeit und Tierwohl."
        phaseNote="Die Erfassung folgt in der nächsten fachlichen Phase."
      />
    </Page>
  );
}
