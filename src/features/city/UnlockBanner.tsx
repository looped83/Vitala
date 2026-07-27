import { Alert } from '@/ui/Alert/Alert';
import { Button } from '@/ui/Button/Button';
import type { RegionDefinition } from '@/domain/city/types';
import styles from './city.module.css';

export interface UnlockBannerProps {
  regions: RegionDefinition[];
  onDismiss: () => void;
}

/**
 * Calm, one-time notice for newly unlocked regions (§33). No auto camera moves,
 * no full-screen takeover, no urgency — a static message with a dismiss that
 * records acknowledgement server-side. Renders nothing when nothing is new.
 */
export function UnlockBanner({ regions, onDismiss }: UnlockBannerProps): React.JSX.Element | null {
  if (regions.length === 0) return null;
  const names = regions.map((r) => r.title).join(', ');
  const single = regions.length === 1;

  return (
    <Alert tone="success" role="status" title="Eure Stadt ist gewachsen">
      <div className={styles.unlockBanner}>
        <div className={styles.unlockText}>
          <span>
            {single
              ? 'Ein neuer Stadtbereich wurde freigeschaltet: '
              : 'Neue Stadtbereiche wurden freigeschaltet: '}
            {names}.
          </span>
          <span>Er bleibt euch dauerhaft erhalten.</span>
        </div>
        <Button variant="secondary" onClick={onDismiss}>
          Verstanden
        </Button>
      </div>
    </Alert>
  );
}
