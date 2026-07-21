import { Spinner } from '@/ui/Spinner/Spinner';
import styles from './RouteLoading.module.css';

/** Centered full-viewport loading state for auth/route resolution. */
export function RouteLoading({ label = 'Wird geladen …' }: { label?: string }): React.JSX.Element {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <Spinner size="lg" />
      <p className={styles.label}>{label}</p>
    </div>
  );
}
