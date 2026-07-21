import { Page } from '@/app/layout/Page';
import { PlaceholderView } from '@/features/placeholders/PlaceholderView';

/** "Stadt" — placeholder only; no fake buildings or visualization (spec §37.4). */
export function CityPage(): React.JSX.Element {
  return (
    <Page
      documentTitle="Stadt"
      heading="Stadt"
      intro="Eure gemeinsame Stadt wächst mit euren Beiträgen über Wochen und Monate."
    >
      <PlaceholderView
        icon="city"
        title="Eure Stadt"
        description="Später baut ihr hier gemeinsam eine nachhaltige Stadt auf – mit Gebäuden, Natur und einer barrierefreien Strukturansicht."
        phaseNote="Die Stadtfunktionen folgen in einer späteren Phase."
      />
    </Page>
  );
}
