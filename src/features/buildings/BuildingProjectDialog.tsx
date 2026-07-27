/**
 * Building project creation dialog (Phase 7, AP6).
 * Slot selection, cost confirmation, and project initiation.
 */

import { useState } from 'react';
import { Dialog } from '@/ui/Dialog/Dialog';
import { Button } from '@/ui/Button/Button';
import { Alert } from '@/ui/Alert/Alert';
import { Text } from '@/ui/Text/Text';
import { Heading } from '@/ui/Heading/Heading';
import { normalizeSupabaseError } from '@/data/supabase/errors';
import { useCurrentHousehold } from '@/features/household/queries';
import { useResourceBalances } from '@/features/rewards/queries';
import { useStartConstructionProject } from './queries';
import styles from './buildings.module.css';

interface BuildingProjectDialogProps {
  building: any;
  onClose: () => void;
}

/**
 * Dialog for creating a new building project.
 * Confirms costs and initiates the construction.
 */
export function BuildingProjectDialog({
  building,
  onClose,
}: BuildingProjectDialogProps): React.JSX.Element {
  const { data: household } = useCurrentHousehold();
  const { data: resources } = useResourceBalances(household?.household.id);
  const [slotId, setSlotId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startProject = useStartConstructionProject();

  const costs = {
    energy: building.base_cost_energy || 0,
    food: building.base_cost_food || 0,
    nature: building.base_cost_nature || 0,
    community: building.base_cost_community || 0,
    building_material: building.base_cost_building_material || 0,
  };

  const totalCost = Object.values(costs).reduce((a: number, b: number) => a + b, 0);
  const totalResources = resources
    ? Object.values(resources).reduce((a: number, b: number) => a + b, 0)
    : 0;

  const canStart =
    slotId &&
    !startProject.isPending &&
    resources &&
    totalResources >= totalCost;

  const handleStart = async () => {
    if (!canStart) return;

    setError(null);
    const idempotencyKey = `project:${building.id}:${slotId}:${Date.now()}`;

    try {
      await startProject.mutateAsync({
        buildingId: building.id,
        slotId,
        idempotencyKey,
      });
      onClose();
    } catch (err) {
      const { message } = normalizeSupabaseError(err);
      setError(message);
    }
  };

  // TODO: Implement slot selector once city layout is available
  // For now, accept any slot ID input

  return (
    <Dialog open={true} onClose={onClose} title={`Build ${building.title}`}>
      <div className={styles.dialogContent}>
        <div className={styles.section}>
          <Heading level={3}>Select Building Slot</Heading>
          <input
            type="text"
            placeholder="Slot ID (e.g., slot-1)"
            value={slotId}
            onChange={(e) => setSlotId(e.target.value)}
            className={styles.slotInput}
            aria-label="Building slot ID"
          />
          <Text variant="secondary" size="small">
            Choose an empty slot from your city to build this building.
          </Text>
        </div>

        <div className={styles.section}>
          <Heading level={3}>Cost Confirmation</Heading>
          <div className={styles.costBreakdown}>
            <div className={styles.costLine}>
              <span>Energy</span>
              <span>{costs.energy}</span>
            </div>
            <div className={styles.costLine}>
              <span>Food</span>
              <span>{costs.food}</span>
            </div>
            <div className={styles.costLine}>
              <span>Nature</span>
              <span>{costs.nature}</span>
            </div>
            <div className={styles.costLine}>
              <span>Community</span>
              <span>{costs.community}</span>
            </div>
            <div className={styles.costLine}>
              <span>Building Material</span>
              <span>{costs.building_material}</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert tone="attention">
            <Text>{error}</Text>
          </Alert>
        )}

        {resources && totalResources < totalCost && (
          <Alert tone="warning">
            <Text>You don't have enough resources to build this.</Text>
          </Alert>
        )}

        <div className={styles.dialogActions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={!canStart}
            loading={startProject.isPending}
          >
            {startProject.isPending ? 'Starting...' : 'Start Project'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
