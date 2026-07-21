import { Icon } from '@/ui/Icon/Icon';
import { LIFE_AREA_META } from '@/domain/activity/areas';
import type { LifeArea } from '@/domain/activity/areas';
import { lifeAreaColorVar } from '@/ui/tokens';
import { AREA_ICON } from './areaIcons';
import styles from './LifeAreaBadge.module.css';

export interface LifeAreaBadgeProps {
  area: LifeArea;
  /** Show only the icon (label read by screen readers). */
  iconOnly?: boolean;
  size?: number;
}

/**
 * Life-area indicator: coloured dot + icon + text label. Colour is never the
 * sole signal (accessibility §33) — the icon and text always carry the meaning.
 */
export function LifeAreaBadge({
  area,
  iconOnly = false,
  size = 16,
}: LifeAreaBadgeProps): React.JSX.Element {
  const meta = LIFE_AREA_META[area];
  return (
    <span className={styles.badge} style={{ ['--area-color' as string]: lifeAreaColorVar[area] }}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={AREA_ICON[area]} size={size} />
      </span>
      {iconOnly ? <span className={styles.srOnly}>{meta.label}</span> : <span>{meta.label}</span>}
    </span>
  );
}
