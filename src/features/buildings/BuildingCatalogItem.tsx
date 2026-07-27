/**
 * Individual building catalog card (Phase 7, AP6).
 * Shows building details, costs, unlock status, and build button.
 */

import { useState } from 'react';
import { Card } from '@/ui/Card/Card';
import { Button } from '@/ui/Button/Button';
import { Icon } from '@/ui/Icon/Icon';
import { Badge } from '@/ui/Badge/Badge';
import { ResourceCost } from '@/features/rewards/ResourceCost';
import { BuildingProjectDialog } from './BuildingProjectDialog';
import styles from './buildings.module.css';

interface BuildingCatalogItemProps {
  definition: any;
  builtCount: number;
}

/**
 * Single building card in the catalog.
 * Shows title, description, costs, effects, and unlock status.
 */
export function BuildingCatalogItem({
  definition,
  builtCount,
}: BuildingCatalogItemProps): React.JSX.Element {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Card className={styles.buildingCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.buildingTitle}>{definition.title}</h3>
            {builtCount > 0 && (
              <Badge tone="success" className={styles.builtBadge}>
                Built {builtCount}
              </Badge>
            )}
          </div>
        </div>

        <p className={styles.description}>{definition.description}</p>

        <div className={styles.costSection}>
          <span className={styles.costLabel}>Costs:</span>
          <div className={styles.costGrid}>
            {(definition.base_cost_energy ?? 0) > 0 && (
              <ResourceCost
                resource="energy"
                amount={definition.base_cost_energy}
              />
            )}
            {(definition.base_cost_food ?? 0) > 0 && (
              <ResourceCost
                resource="food"
                amount={definition.base_cost_food}
              />
            )}
            {(definition.base_cost_nature ?? 0) > 0 && (
              <ResourceCost
                resource="nature"
                amount={definition.base_cost_nature}
              />
            )}
            {(definition.base_cost_community ?? 0) > 0 && (
              <ResourceCost
                resource="community"
                amount={definition.base_cost_community}
              />
            )}
            {(definition.base_cost_building_material ?? 0) > 0 && (
              <ResourceCost
                resource="building_material"
                amount={definition.base_cost_building_material}
              />
            )}
          </div>
        </div>

        {definition.effects && definition.effects.length > 0 && (
          <div className={styles.effectsSection}>
            <span className={styles.effectsLabel}>Effects:</span>
            <ul className={styles.effectsList}>
              {definition.effects.map((effect: any) => (
                <li key={effect.id} className={styles.effectItem}>
                  {effect.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.cardFooter}>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowDialog(true)}
            leadingIcon={<Icon name="plus" />}
          >
            Build Project
          </Button>
        </div>
      </Card>

      {showDialog && (
        <BuildingProjectDialog
          building={definition}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
