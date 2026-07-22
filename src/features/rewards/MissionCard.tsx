import { useState } from 'react';
import { Card } from '@/ui/Card/Card';
import { Badge } from '@/ui/Badge/Badge';
import { Button } from '@/ui/Button/Button';
import { ProgressBar } from '@/features/goals/ProgressBar';
import { RESOURCE_META } from '@/domain/rewards/display';
import type { MissionBoardItem } from '@/data/repositories/rewards';
import { useToast } from '@/ui/Toast/ToastProvider';
import { getAppErrorMessage } from '@/lib/errors/app-error';
import styles from './rewards.module.css';

export interface MissionCardProps {
  mission: MissionBoardItem;
  onSwap: (id: string) => Promise<string>;
  onSkip: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  disabled?: boolean;
}

function rewardLine(m: MissionBoardItem): string {
  const parts = [`${m.personalXp} XP`, `${m.cityXp} Stadt-XP`];
  if (m.rewardResource && m.rewardResourceAmount > 0) {
    parts.push(`${m.rewardResourceAmount} ${RESOURCE_META[m.rewardResource].label}`);
  }
  if (m.rewardCommunity > 0) parts.push(`${m.rewardCommunity} ${RESOURCE_META.community.label}`);
  return parts.join(' · ');
}

/**
 * A single mission (§50/§58). Freiwillig, never a duty: the header states the
 * scope + difficulty; progress is an accessible bar with a numeric value;
 * reward is plain text; and the actions (Tauschen / Überspringen / Abschließen)
 * are clearly labelled buttons. Skipping and swapping carry no penalty (§30/§31).
 */
export function MissionCard({
  mission,
  onSwap,
  onSkip,
  onComplete,
  disabled = false,
}: MissionCardProps): React.JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const done = mission.status === 'completed';
  const skipped = mission.status === 'skipped';

  const run = async (fn: () => Promise<unknown>, ok: string): Promise<void> => {
    setBusy(true);
    try {
      await fn();
      toast.show(ok, 'success');
    } catch (error) {
      toast.show(getAppErrorMessage(error), 'attention');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={styles.missionCard} data-status={mission.status}>
      <div className={styles.missionHead}>
        <div className={styles.missionTags}>
          <Badge tone={mission.scope === 'shared' ? 'primary' : 'neutral'}>
            {mission.scope === 'shared' ? 'Gemeinsam' : 'Persönlich'}
          </Badge>
          <Badge tone="neutral">{mission.period === 'week' ? 'Woche' : 'Heute'}</Badge>
          {done ? <Badge tone="success">Abgeschlossen</Badge> : null}
          {skipped ? <Badge tone="neutral">Übersprungen</Badge> : null}
        </div>
      </div>
      <h3 className={styles.missionTitle}>{mission.title}</h3>
      <p className={styles.missionDesc}>{mission.description}</p>

      <ProgressBar
        value={mission.progress}
        target={mission.target}
        label={`Fortschritt: ${mission.title}`}
        area={mission.area ?? undefined}
      />
      <p className={styles.missionReward}>Belohnung: {rewardLine(mission)}</p>

      {!done && !skipped ? (
        <div className={styles.missionActions}>
          <Button
            variant="primary"
            disabled={disabled || busy || !mission.canComplete}
            onClick={() =>
              void run(() => onComplete(mission.assignmentId), 'Mission abgeschlossen.')
            }
          >
            Abschließen
          </Button>
          <Button
            variant="ghost"
            disabled={disabled || busy || mission.swapsUsed >= 1}
            onClick={() => void run(() => onSwap(mission.assignmentId), 'Neue Mission zugewiesen.')}
          >
            Tauschen
          </Button>
          <Button
            variant="ghost"
            disabled={disabled || busy}
            onClick={() =>
              void run(() => onSkip(mission.assignmentId), 'Mission für heute übersprungen.')
            }
          >
            Überspringen
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
