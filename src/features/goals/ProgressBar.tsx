import { computeProgress, formatValue } from '@/domain/goals/progress';
import type { LifeArea } from '@/domain/activity/areas';
import { lifeAreaColorVar } from '@/ui/tokens';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  target: number;
  /** Accessible name (e.g. the goal title). */
  label: string;
  area?: LifeArea;
}

/**
 * Accessible progress bar (accessibility §46). Uses role="progressbar" with
 * aria-value* so the value is announced; colour is never the only signal — the
 * numeric value is always rendered as text alongside. Fills to at most 100 %,
 * marks "übertroffen" as a state, never a red failure.
 */
export function ProgressBar({ value, target, label, area }: ProgressBarProps): React.JSX.Element {
  const p = computeProgress(value, target);
  const color = area ? lifeAreaColorVar[area] : 'var(--color-accent)';
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(value, target)}
      aria-valuetext={`${formatValue(value)} von ${formatValue(target)}`}
      aria-label={label}
      data-reached={p.reached ? 'true' : undefined}
      data-exceeded={p.exceeded ? 'true' : undefined}
    >
      <span
        className={styles.fill}
        style={{ width: `${p.percent}%`, ['--bar-color' as string]: color }}
      />
    </div>
  );
}
