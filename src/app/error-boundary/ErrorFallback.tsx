import { Button } from '@/ui/Button/Button';
import { Icon } from '@/ui/Icon/Icon';
import styles from './ErrorFallback.module.css';

export interface ErrorFallbackProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * User-facing error screen. Friendly, non-technical, non-blaming (IA §13.5,
 * security §23). Technical detail is logged separately, never shown here.
 */
export function ErrorFallback({
  title = 'Etwas ist schiefgelaufen',
  description = 'Bitte versuche es erneut. Falls es weiterhin nicht klappt, versuche es später noch einmal.',
  onRetry,
  retryLabel = 'Erneut versuchen',
}: ErrorFallbackProps): React.JSX.Element {
  return (
    <div className={styles.wrap} role="alert">
      <span className={styles.icon} aria-hidden="true">
        <Icon name="info" size={40} />
      </span>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {onRetry ? (
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
