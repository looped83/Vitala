import { NavLink } from 'react-router-dom';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/app/router/routes';
import type { NavItem } from '@/app/router/routes';
import { Icon } from '@/ui/Icon/Icon';
import { cn } from '@/ui/cn';
import styles from './Sidebar.module.css';

function SidebarLink({ item }: { item: NavItem }): React.JSX.Element {
  return (
    <li>
      <NavLink
        to={item.to}
        className={({ isActive }) => cn(styles.link, isActive && styles.active)}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon name={item.icon} size={22} />
        </span>
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

/** Desktop left navigation (IA §13.2). Hidden on small viewports. */
export function Sidebar(): React.JSX.Element {
  return (
    <nav className={styles.sidebar} aria-label="Hauptnavigation">
      <ul className={styles.list}>
        {PRIMARY_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </ul>
      <hr className={styles.divider} />
      <ul className={styles.list}>
        {SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </ul>
    </nav>
  );
}
