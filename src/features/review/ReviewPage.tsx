import { Page } from '@/app/layout/Page';
import { PlaceholderView } from '@/features/placeholders/PlaceholderView';

/** "Rückblick" — clear empty state, no invented statistics (spec §37.7). */
export function ReviewPage(): React.JSX.Element {
  return (
    <Page
      documentTitle="Rückblick"
      heading="Rückblick"
      intro="Ein wertfreier Blick zurück – Tag, Woche, Monat und eure Stadtgeschichte."
    >
      <PlaceholderView
        icon="review"
        title="Noch nichts zu zeigen"
        description="Sobald ihr Aktivitäten erfasst, entstehen hier eure Rückblicke, die Balance eurer Lebensbereiche und die Stadtgeschichte."
        phaseNote="Der Rückblick folgt in einer späteren Phase."
      />
    </Page>
  );
}
