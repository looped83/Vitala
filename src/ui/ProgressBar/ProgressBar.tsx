/**
 * Progress bar component for showing completion status.
 */

import { cn } from '@/ui/cn';
import styles from './progressbar.module.css';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
  aria?: {
    label?: string;
    valueText?: string;
  };
}

/**
 * Horizontal progress bar showing completion percentage.
 * Accessible with ARIA attributes.
 */
export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  className,
  aria,
}: ProgressBarProps): React.JSX.Element {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(styles.container, className)}
      role="progressbar"
      aria-label={aria?.label || 'Progress'}
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={aria?.valueText || `${Math.round(percentage)}%`}
    >
      <div className={cn(styles.track)}>
        <div
          className={cn(styles.fill, styles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={styles.label}>{Math.round(percentage)}%</span>
      )}
    </div>
  );
}
