import { Page } from '@/app/layout/Page';
import { PlaceholderView } from '@/features/placeholders/PlaceholderView';

/** "Ziele" — clear empty state, no fictional goals (spec §37.6). */
export function GoalsPage(): React.JSX.Element {
  return (
    <Page
      documentTitle="Ziele"
      heading="Ziele"
      intro="Ziele sind freiwillig – persönlich oder gemeinsam."
    >
      <PlaceholderView
        icon="goals"
        title="Noch keine Ziele"
        description="Hier legt ihr später persönliche und gemeinsame Ziele an und verfolgt ihren Fortschritt."
        phaseNote="Ziele folgen in einer späteren Phase."
      />
    </Page>
  );
}
