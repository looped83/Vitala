/**
 * Resource cost display (building costs, mission rewards, etc).
 */

import type { ResourceKey } from '@/domain/rewards/constants';
import { RESOURCE_META } from '@/domain/rewards/display';
import styles from './rewards.module.css';

interface ResourceCostProps {
  resource: ResourceKey;
  amount: number;
  size?: 'small' | 'medium';
}

/**
 * Shows a single resource cost with icon and amount.
 * Used in building catalogs, mission rewards, etc.
 */
export function ResourceCost({
  resource,
  amount,
  size = 'small',
}: ResourceCostProps): React.JSX.Element {
  const meta = RESOURCE_META[resource];

  return (
    <div className={styles.costDisplay} data-size={size}>
      <span className={styles.icon} title={meta.label}>
        {meta.symbol}
      </span>
      <span className={styles.amount}>{amount}</span>
    </div>
  );
}
