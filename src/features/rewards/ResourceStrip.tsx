import { RESOURCE_DISPLAY_ORDER, RESOURCE_META } from '@/domain/rewards/display';
import type { ResourceKey } from '@/domain/rewards/constants';
import styles from './rewards.module.css';

export interface ResourceStripProps {
  balances: Record<ResourceKey, number>;
  /** Show the "used later for the city" explainer (§50/§53). */
  showHint?: boolean;
  /** Restrict to a subset (e.g. only earned resources on Today). */
  keys?: readonly ResourceKey[];
}

/**
 * Household resource balances (§50). Icon + name + value together — never a
 * bare symbol or colour (§58). Wraps into compact cards rather than a wide
 * horizontal scroll on mobile (responsive §59).
 */
export function ResourceStrip({
  balances,
  showHint = false,
  keys = RESOURCE_DISPLAY_ORDER,
}: ResourceStripProps): React.JSX.Element {
  return (
    <div>
      <ul className={styles.resourceGrid} aria-label="Ressourcenbestände">
        {keys.map((key) => {
          const meta = RESOURCE_META[key];
          return (
            <li key={key} className={styles.resourceCard}>
              <span className={styles.resourceIcon} aria-hidden>
                {meta.symbol}
              </span>
              <span className={styles.resourceValue}>{balances[key] ?? 0}</span>
              <span className={styles.resourceLabel}>{meta.label}</span>
            </li>
          );
        })}
      </ul>
      {showHint ? (
        <p className={styles.resourceHint}>
          Diese Ressourcen werden später für den Ausbau eurer Stadt verwendet.
        </p>
      ) : null}
    </div>
  );
}
