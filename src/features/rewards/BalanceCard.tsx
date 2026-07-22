import { Card } from '@/ui/Card/Card';
import { Badge } from '@/ui/Badge/Badge';
import { LIFE_AREAS, LIFE_AREA_LABEL } from '@/domain/activity/areas';
import {
  BALANCE_STAGE_LABEL,
  balanceStageDescription,
  type BalanceStage,
} from '@/domain/rewards/balance';
import type { WeeklyBalance } from '@/data/repositories/rewards';
import styles from './rewards.module.css';

export interface BalanceCardProps {
  balance: WeeklyBalance | null;
}

/**
 * Weekly balance (§35/§52). Describes the week neutrally — never grades it, no
 * negative stage, no red state (§36). Active areas are shown as text chips so
 * the information never relies on colour alone (§58).
 */
export function BalanceCard({ balance }: BalanceCardProps): React.JSX.Element {
  const stage = (balance?.stage ?? 0) as BalanceStage;
  return (
    <Card className={styles.balanceCard}>
      <div className={styles.balanceHead}>
        <p className={styles.levelHeading}>Wochenbalance</p>
        <Badge tone="neutral">{BALANCE_STAGE_LABEL[stage]}</Badge>
      </div>
      <p className={styles.balanceDesc}>{balanceStageDescription(stage)}</p>
      <ul className={styles.balanceAreas} aria-label="Bereiche dieser Woche">
        {LIFE_AREAS.map((area) => {
          const active = (balance?.byArea[area] ?? 0) > 0;
          return (
            <li key={area} className={styles.balanceArea} data-active={active}>
              <span aria-hidden>{active ? '●' : '○'}</span> {LIFE_AREA_LABEL[area]}
            </li>
          );
        })}
      </ul>
      {balance?.bonusGranted ? (
        <p className={styles.balanceBonus}>Balance-Bonus für diese Woche wurde vergeben.</p>
      ) : null}
    </Card>
  );
}
