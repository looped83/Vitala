/**
 * Building catalog view (Phase 7, AP6).
 * Grid display of all buildings with unlock status, costs, and effects.
 */

import { useMemo } from 'react';
import { Spinner } from '@/ui/Spinner/Spinner';
import { Alert } from '@/ui/Alert/Alert';
import { Heading } from '@/ui/Heading/Heading';
import { Text } from '@/ui/Text/Text';
import { useCurrentHousehold } from '@/features/household/queries';
import { useBuildingDefinitions, useBuiltBuildings } from './queries';
import { BuildingCatalogItem } from './BuildingCatalogItem';
import styles from './buildings.module.css';

/**
 * Building catalog: browsable grid of all buildings grouped by category.
 * Shows unlock status, costs, and quick-build buttons.
 */
export function BuildingCatalog(): React.JSX.Element {
  const { data: household } = useCurrentHousehold();
  const { data: definitions, isLoading: defsLoading } =
    useBuildingDefinitions();
  const { data: builtBuildings } = useBuiltBuildings(
    household?.household.id,
  );

  const isLoading = defsLoading;

  // Group definitions by category for display
  const buildingsByCategory = useMemo(() => {
    if (!definitions || !Array.isArray(definitions)) return new Map();
    const grouped = new Map<string, typeof definitions>();
    for (const def of definitions) {
      const cat = def.primary_category || 'other';
      if (!grouped.has(cat)) {
        grouped.set(cat, []);
      }
      grouped.get(cat)!.push(def);
    }
    return grouped;
  }, [definitions]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner aria-label="Loading buildings..." />
      </div>
    );
  }

  if (!definitions || definitions.length === 0) {
    return (
      <Alert tone="info">
        <Text>No buildings available yet.</Text>
      </Alert>
    );
  }

  return (
    <div className={styles.catalogContainer}>
      <div className={styles.catalogHeader}>
        <Heading level={1}>Building Catalog</Heading>
        <Text variant="secondary">
          Explore available buildings and start construction projects.
        </Text>
      </div>

      {Array.from(buildingsByCategory.entries()).map(([category, buildings]) => (
        <section key={category} className={styles.categorySection}>
          <Heading level={2} className={styles.categoryTitle}>
            {categoryLabel(category)}
          </Heading>

          <div className={styles.buildingGrid}>
            {buildings.map((building: any) => (
              <BuildingCatalogItem
                key={building.id}
                definition={building}
                builtCount={
                  builtBuildings?.filter(
                    (b: any) => b.building_definition_id === building.id,
                  ).length || 0
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    movement: '🏃 Movement & Fitness',
    nutrition: '🥕 Nutrition & Growth',
    sustainability: '♻️ Sustainability',
    animal_welfare: '🦋 Animal Welfare',
    community: '🤝 Community',
  };
  return labels[category] || category;
}
