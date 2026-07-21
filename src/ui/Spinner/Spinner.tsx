import { cn } from '@/ui/cn';
import { VisuallyHidden } from '@/ui/a11y/VisuallyHidden';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  /** Accessible label. When omitted the spinner is purely decorative. */
  label?: string;
  className?: string;
}

/**
 * Loading indicator. Under reduced motion the ring stops spinning (handled
 * globally) but stays visible as a static state (accessibility §19.8).
 */
export function Spinner({ size = 'md', label, className }: SpinnerProps): React.JSX.Element {
  return (
    <span
      className={cn(styles.spinner, styles[size], className)}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className={styles.ring} />
      {label ? <VisuallyHidden>{label}</VisuallyHidden> : null}
    </span>
  );
}
