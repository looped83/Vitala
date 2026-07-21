import { useState } from 'react';
import { Card } from '@/ui/Card/Card';
import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { DropdownMenu } from '@/ui/Menu/DropdownMenu';
import { Dialog } from '@/ui/Dialog/Dialog';
import { useToast } from '@/ui/Toast/ToastProvider';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import { getAppErrorMessage } from '@/lib/errors/app-error';
import type { Goal } from '@/domain/goals/types';
import { GOAL_STATUS_LABEL, isAutoMeasurement } from '@/domain/goals/types';
import { progressLine } from '@/domain/goals/progress';
import { availableTransitions } from '@/domain/goals/status';
import { ProgressBar } from './ProgressBar';
import { formatPeriodLabel } from './periodLabel';
import { useDeleteGoal, useSetGoalManualProgress, useSetGoalStatus } from './queries';
import styles from './GoalCard.module.css';

export interface GoalCardProps {
  goal: Goal;
  ownerLabel: string;
  onEdit?: (goal: Goal) => void;
  onOpenDetail?: (goal: Goal) => void;
  /** Compact rendering for the Today page. */
  compact?: boolean;
}

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'info'> = {
  active: 'info',
  paused: 'neutral',
  completed: 'success',
  expired: 'neutral',
  archived: 'neutral',
  draft: 'neutral',
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  active: 'Fortsetzen',
  paused: 'Pausieren',
  completed: 'Als abgeschlossen markieren',
  archived: 'Archivieren',
  expired: 'Verlängern',
  draft: 'Aktivieren',
};

export function GoalCard({
  goal,
  ownerLabel,
  onEdit,
  onOpenDetail,
  compact = false,
}: GoalCardProps): React.JSX.Element {
  const toast = useToast();
  const setStatus = useSetGoalStatus();
  const setManual = useSetGoalManualProgress();
  const remove = useDeleteGoal();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const value = isAutoMeasurement(goal.measurement) ? goal.currentValue : (goal.manualValue ?? 0);
  const target = goal.periodTarget || goal.targetValue;
  const periodLabel = formatPeriodLabel(goal.periodType, goal.periodStart, goal.periodEnd);
  const isBoolean = goal.measurement === 'boolean';
  const isManual = goal.measurement === 'manual';

  function handleStatus(status: string): void {
    setStatus.mutate(
      { id: goal.id, status: status as Goal['status'] },
      {
        onSuccess: () => toast.show('Ziel aktualisiert.', 'success'),
        onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
      },
    );
  }

  function handleManual(next: number): void {
    setManual.mutate(
      { id: goal.id, value: Math.max(0, next) },
      { onError: (e) => toast.show(getAppErrorMessage(e), 'attention') },
    );
  }

  const menuItems = [
    ...(onEdit ? [{ id: 'edit', label: 'Bearbeiten', onSelect: () => onEdit(goal) }] : []),
    ...availableTransitions(goal.status)
      .filter((s) => s !== 'archived')
      .map((s) => ({
        id: s,
        label: STATUS_ACTION_LABEL[s] ?? GOAL_STATUS_LABEL[s],
        onSelect: () => handleStatus(s),
      })),
    ...(availableTransitions(goal.status).includes('archived')
      ? [{ id: 'archive', label: 'Archivieren', onSelect: () => handleStatus('archived') }]
      : []),
    {
      id: 'delete',
      label: 'Löschen',
      tone: 'danger' as const,
      onSelect: () => setConfirmDelete(true),
    },
  ];

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <div className={styles.titleRow}>
          {onOpenDetail ? (
            <button type="button" className={styles.titleButton} onClick={() => onOpenDetail(goal)}>
              {goal.title}
            </button>
          ) : (
            <h3 className={styles.title}>{goal.title}</h3>
          )}
          <Badge tone={STATUS_TONE[goal.status] ?? 'neutral'}>
            {GOAL_STATUS_LABEL[goal.status]}
          </Badge>
        </div>
        <DropdownMenu
          label="Zieloptionen"
          items={menuItems}
          trigger={(props) => (
            <IconButton {...props} label="Zieloptionen" icon={<Icon name="more" size={20} />} />
          )}
        />
      </div>

      <div className={styles.meta}>
        <LifeAreaBadge area={goal.lifeArea} size={14} />
        <span className={styles.metaItem}>{ownerLabel}</span>
        {periodLabel ? <span className={styles.metaItem}>{periodLabel}</span> : null}
      </div>

      {goal.status === 'paused' && goal.pauseReason ? (
        <p className={styles.pauseNote}>Pausiert: {goal.pauseReason}</p>
      ) : null}

      {isBoolean ? (
        <div className={styles.boolRow}>
          <Button
            variant={value >= 1 ? 'secondary' : 'primary'}
            onClick={() => handleManual(value >= 1 ? 0 : 1)}
            leadingIcon={<Icon name={value >= 1 ? 'check' : 'plus'} size={18} />}
          >
            {value >= 1 ? 'Erledigt' : 'Als erledigt markieren'}
          </Button>
        </div>
      ) : (
        <div className={styles.progress}>
          <ProgressBar value={value} target={target} label={goal.title} area={goal.lifeArea} />
          <p className={styles.progressLine}>{progressLine(value, target, goal.unit)}</p>
          {isManual ? (
            <div className={styles.stepper}>
              <IconButton
                label="Fortschritt verringern"
                icon={<Icon name="minus" size={18} />}
                variant="surface"
                onClick={() => handleManual(value - 1)}
                disabled={value <= 0}
              />
              <IconButton
                label="Fortschritt erhöhen"
                icon={<Icon name="plus" size={18} />}
                variant="surface"
                onClick={() => handleManual(value + 1)}
              />
            </div>
          ) : null}
        </div>
      )}

      {!compact && goal.description ? (
        <p className={styles.description}>{goal.description}</p>
      ) : null}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Ziel löschen?"
        description="Das Ziel wird entfernt. Deine erfassten Aktivitäten bleiben erhalten. Alternativ kannst du es archivieren."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(goal.id, {
                  onSuccess: () => {
                    toast.show('Ziel gelöscht.', 'success');
                    setConfirmDelete(false);
                  },
                  onError: (e) => toast.show(getAppErrorMessage(e), 'attention'),
                })
              }
            >
              Löschen
            </Button>
          </>
        }
      />
    </Card>
  );
}
