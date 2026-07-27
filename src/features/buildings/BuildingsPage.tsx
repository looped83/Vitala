/**
 * Buildings page (Phase 7, AP6).
 * Building catalog and construction project management.
 */

import { Page } from '@/app/layout/Page';
import { Section } from '@/ui/Section/Section';
import { BuildingCatalog } from './BuildingCatalog';

/**
 * Main building system page. Shows catalog of available buildings
 * and allows creation/management of construction projects.
 */
export function BuildingsPage(): React.JSX.Element {
  return (
    <Page
      documentTitle="Gebäude"
      heading="Building Catalog"
    >
      <Section title="Available Buildings">
        <BuildingCatalog />
      </Section>
    </Page>
  );
}
