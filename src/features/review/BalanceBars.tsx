import { LIFE_AREAS, LIFE_AREA_LABEL } from '@/domain/activity/areas';
import { lifeAreaColorVar } from '@/ui/tokens';
import type { AreaTotals } from '@/domain/review/aggregate';
import styles from './BalanceBars.module.css';

export interface BalanceBarsProps {
  totals: AreaTotals;
}

/**
 * Accessible balance display (spec §33/§46). Rendered as a definition list with
 * text values, not a colour-only chart — every value is announced. Bars are a
 * visual aid; colour is never the sole signal. No grade, no "too little".
 */
export function BalanceBars({ totals }: BalanceBarsProps): React.JSX.Element {
  const max = Math.max(1, ...LIFE_AREAS.map((a) => totals.byArea[a]));
  return (
    <dl className={styles.list}>
      {LIFE_AREAS.map((area) => {
        const value = totals.byArea[area];
        const pct = Math.round((value / max) * 100);
        return (
          <div key={area} className={styles.row}>
            <dt className={styles.label}>{LIFE_AREA_LABEL[area]}</dt>
            <dd className={styles.value}>
              <span className={styles.track} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{ width: `${pct}%`, ['--bar-color' as string]: lifeAreaColorVar[area] }}
                />
              </span>
              <span className={styles.count}>
                {value} {value === 1 ? 'Eintrag' : 'Einträge'}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
