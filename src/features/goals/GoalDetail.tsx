import { Dialog } from '@/ui/Dialog/Dialog';
import { Badge } from '@/ui/Badge/Badge';
import { Spinner } from '@/ui/Spinner/Spinner';
import { LifeAreaBadge } from '@/features/capture/LifeAreaBadge';
import type { Goal } from '@/domain/goals/types';
import {
  GOAL_STATUS_LABEL,
  MEASUREMENT_LABEL,
  PERIOD_TYPE_LABEL,
  RECURRENCE_LABEL,
  isAutoMeasurement,
} from '@/domain/goals/types';
import { formatValue, progressLine } from '@/domain/goals/progress';
import { ProgressBar } from './ProgressBar';
import { formatPeriodLabel } from './periodLabel';
import { useGoalPeriods } from './queries';
import styles from './GoalDetail.module.css';

export interface GoalDetailProps {
  goal: Goal;
  householdId: string;
  ownerLabel: string;
  open: boolean;
  onClose: () => void;
}

const PERIOD_STATUS_LABEL: Record<string, string> = {
  active: 'Läuft',
  completed: 'Erreicht',
  expired: 'Beendet',
};

export function GoalDetail({
  goal,
  householdId,
  ownerLabel,
  open,
  onClose,
}: GoalDetailProps): React.JSX.Element {
  const periods = useGoalPeriods(open ? householdId : undefined, open ? goal.id : undefined);
  const value = isAutoMeasurement(goal.measurement) ? goal.currentValue : (goal.manualValue ?? 0);
  const target = goal.periodTarget || goal.targetValue;

  const source =
    goal.ownerType === 'shared'
      ? 'Beiträge beider Personen zählen (gemeinsame Einträge einmal).'
      : 'Nur Einträge der zuständigen Person zählen.';

  return (
    <Dialog open={open} onClose={onClose} title={goal.title}>
      <div className={styles.body}>
        <div className={styles.meta}>
          <LifeAreaBadge area={goal.lifeArea} size={14} />
          <span>{ownerLabel}</span>
          <Badge tone="neutral">{GOAL_STATUS_LABEL[goal.status]}</Badge>
        </div>

        {goal.description ? <p className={styles.description}>{goal.description}</p> : null}

        {goal.measurement !== 'boolean' ? (
          <div className={styles.progress}>
            <ProgressBar value={value} target={target} label={goal.title} area={goal.lifeArea} />
            <p className={styles.progressLine}>{progressLine(value, target, goal.unit)}</p>
          </div>
        ) : (
          <p className={styles.progressLine}>{value >= 1 ? 'Erledigt.' : 'Noch offen.'}</p>
        )}

        <dl className={styles.defs}>
          <div>
            <dt>Messmethode</dt>
            <dd>{MEASUREMENT_LABEL[goal.measurement]}</dd>
          </div>
          <div>
            <dt>Zeitraum</dt>
            <dd>{PERIOD_TYPE_LABEL[goal.periodType]}</dd>
          </div>
          <div>
            <dt>Wiederholung</dt>
            <dd>{RECURRENCE_LABEL[goal.recurrence]}</dd>
          </div>
          <div>
            <dt>Fortschritt</dt>
            <dd>{source}</dd>
          </div>
        </dl>

        <section aria-labelledby="goal-history-heading" className={styles.history}>
          <h3 id="goal-history-heading" className={styles.historyHeading}>
            Verlauf
          </h3>
          {periods.isLoading ? (
            <Spinner label="Verlauf wird geladen" />
          ) : periods.data && periods.data.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Periode</th>
                    <th scope="col">Ergebnis</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.data.map((p) => {
                    const shown = p.status === 'active' ? value : (p.finalValue ?? 0);
                    return (
                      <tr key={p.id}>
                        <td>{formatPeriodLabel(goal.periodType, p.periodStart, p.periodEnd)}</td>
                        <td>
                          {formatValue(shown)} / {formatValue(p.targetValue)}
                        </td>
                        <td>{PERIOD_STATUS_LABEL[p.status] ?? p.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.empty}>Noch keine abgeschlossenen Perioden.</p>
          )}
        </section>
      </div>
    </Dialog>
  );
}
