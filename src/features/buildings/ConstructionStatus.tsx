/**
 * Construction project status display (Phase 7, AP6).
 * Shows progress bar, build points, completion time, and cancel button.
 */

import { Card } from '@/ui/Card/Card';
import { Button } from '@/ui/Button/Button';
import { Badge } from '@/ui/Badge/Badge';
import { ProgressBar } from '@/ui/ProgressBar/ProgressBar';
import { Heading } from '@/ui/Heading/Heading';
import { Text } from '@/ui/Text/Text';
import { Icon } from '@/ui/Icon/Icon';
import type { ConstructionProject } from '@/domain/buildings';
import {
  calculateProgressPercent,
  isProjectComplete,
} from '@/domain/buildings';
import styles from './buildings.module.css';

interface ConstructionStatusProps {
  project: ConstructionProject;
  buildingTitle: string;
  onCancel?: () => void;
}

/**
 * Status card for an active construction project.
 * Shows progress, build points earned/required, and controls.
 */
export function ConstructionStatus({
  project,
  buildingTitle,
  onCancel,
}: ConstructionStatusProps): React.JSX.Element {
  const progress = calculateProgressPercent(
    project.buildPointsEarned,
    project.buildPointsRequired,
  );
  const isComplete = isProjectComplete(project);

  const statusBadgeTone = isComplete
    ? ('success' as const)
    : project.status === 'in_progress'
      ? ('info' as const)
      : ('neutral' as const);

  return (
    <Card className={styles.statusCard}>
      <div className={styles.statusHeader}>
        <div>
          <Heading level={3}>{buildingTitle}</Heading>
          <Badge tone={statusBadgeTone}>{project.status}</Badge>
        </div>
        {isComplete && <Icon name="check" />}
      </div>

      {project.buildPointsRequired > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span>Progress</span>
            <span className={styles.percentage}>{Math.round(progress)}%</span>
          </div>
          <ProgressBar value={progress} max={100} />
          <div className={styles.progressDetails}>
            <Text size="small" variant="secondary">
              {project.buildPointsEarned} / {project.buildPointsRequired} build
              points
            </Text>
          </div>
        </div>
      )}

      {!isComplete && project.status !== 'cancelled' && onCancel && (
        <div className={styles.statusActions}>
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            aria-label="Cancel construction project"
            leadingIcon={<Icon name="close" />}
          >
            Cancel Project
          </Button>
        </div>
      )}

      {isComplete && (
        <div className={styles.completeMessage}>
          <Text variant="success">
            ✓ Building complete!
          </Text>
        </div>
      )}
    </Card>
  );
}
