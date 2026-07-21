import { NavLink } from 'react-router-dom';
import { PRIMARY_NAV } from '@/app/router/routes';
import { Icon } from '@/ui/Icon/Icon';
import { cn } from '@/ui/cn';
import styles from './BottomNav.module.css';

/**
 * Mobile bottom tab bar (IA §13.1). Five primary destinations, each with icon
 * AND label (never icon-only), active state via aria-current, ≥44px targets,
 * safe-area aware.
 */
export function BottomNav(): React.JSX.Element {
  return (
    <nav className={styles.nav} aria-label="Hauptnavigation">
      <ul className={styles.list}>
        {PRIMARY_NAV.map((item) => (
          <li key={item.to} className={styles.item}>
            <NavLink
              to={item.to}
              className={({ isActive }) => cn(styles.link, isActive && styles.active)}
            >
              <span className={styles.icon} aria-hidden="true">
                <Icon name={item.icon} size={24} />
              </span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
