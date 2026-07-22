import { Card } from '@/ui/Card/Card';
import { ProgressBar } from '@/features/goals/ProgressBar';
import type { LevelStatus } from '@/domain/rewards/levels';
import styles from './rewards.module.css';

export interface LevelCardProps {
  status: LevelStatus;
  /** Heading, e.g. "Dein Fortschritt" or "Eure Stadt". */
  heading: string;
  /** Small caption under the heading (e.g. the member name). */
  caption?: string;
  scopeLabel: string;
}

/**
 * Calm level card for a personal or city XP stream (§50/§21). Shows level,
 * title and a labelled, accessible progress bar toward the next level. No
 * competition, no ranking — just this stream's own progress.
 */
export function LevelCard({
  status,
  heading,
  caption,
  scopeLabel,
}: LevelCardProps): React.JSX.Element {
  const atMax = status.nextLevelXp <= status.levelFloorXp;
  return (
    <Card className={styles.levelCard}>
      <div className={styles.levelHead}>
        <div>
          <p className={styles.levelHeading}>{heading}</p>
          {caption ? <p className={styles.levelCaption}>{caption}</p> : null}
        </div>
        <div className={styles.levelBadge}>
          <span className={styles.levelNumber}>Level {status.level}</span>
          <span className={styles.levelTitle}>{status.title}</span>
        </div>
      </div>
      <ProgressBar
        value={status.xpIntoLevel}
        target={Math.max(1, status.xpForLevel)}
        label={`${scopeLabel}: Fortschritt zu Level ${status.level + 1}`}
      />
      <p className={styles.levelMeta}>
        {atMax ? (
          <>Höchste Stufe erreicht · {status.totalXp} XP gesamt</>
        ) : (
          <>
            Noch {status.xpToNext} XP bis Level {status.level + 1} · {status.totalXp} XP gesamt
          </>
        )}
      </p>
    </Card>
  );
}
