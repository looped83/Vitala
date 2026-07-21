import { useNavigate } from 'react-router-dom';
import { DropdownMenu } from '@/ui/Menu/DropdownMenu';
import { Avatar } from '@/ui/Avatar/Avatar';
import { Icon } from '@/ui/Icon/Icon';
import { Link } from '@/ui/Link/Link';
import { useMyProfile } from '@/features/profile/queries';
import { useCurrentHousehold } from '@/features/household/queries';
import { signOut } from '@/data/repositories/auth';
import { paths } from '@/app/router/routes';
import { logger } from '@/lib/logging/logger';
import styles from './Header.module.css';

/** Top bar: brand, household name, and the profile/settings/logout menu. */
export function Header(): React.JSX.Element {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const { data: current } = useCurrentHousehold();
  const displayName = profile?.display_name?.trim() || 'Profil';

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
    } catch {
      logger.warn('logout_failed');
    }
    navigate(paths.login, { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={paths.today} variant="quiet" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <Icon name="shield" size={22} />
          </span>
          <span className={styles.appName}>Vitala</span>
        </Link>

        <div className={styles.right}>
          {current ? (
            <span className={styles.household} title={current.household.name}>
              {current.household.name}
            </span>
          ) : null}
          <DropdownMenu
            label="Profilmenü"
            trigger={({ ref, ...props }) => (
              <button ref={ref} type="button" className={styles.avatarButton} {...props}>
                <Avatar name={displayName} size="sm" />
                <span className={styles.avatarName}>{displayName}</span>
                <Icon name="chevronDown" size={16} />
              </button>
            )}
            items={[
              {
                id: 'profile',
                label: 'Profil',
                icon: <Icon name="profile" size={18} />,
                onSelect: () => navigate(paths.profile),
              },
              {
                id: 'settings',
                label: 'Einstellungen',
                icon: <Icon name="settings" size={18} />,
                onSelect: () => navigate(paths.settings),
              },
              {
                id: 'logout',
                label: 'Abmelden',
                icon: <Icon name="logout" size={18} />,
                tone: 'danger',
                onSelect: () => void handleLogout(),
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
