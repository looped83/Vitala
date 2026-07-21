import { Outlet } from 'react-router-dom';
import { SkipLink } from '@/ui/a11y/SkipLink';
import { AppErrorBoundary } from '@/app/error-boundary/AppErrorBoundary';
import { PreferencesSync } from '@/features/settings/PreferencesSync';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import styles from './AppLayout.module.css';

/**
 * Responsive application shell (spec §15). Skip link → header → sidebar
 * (desktop) / bottom nav (mobile) → main content. Content errors are caught by
 * a boundary scoped to the main area so navigation stays usable.
 */
export function AppLayout(): React.JSX.Element {
  return (
    <div className={styles.shell}>
      <PreferencesSync />
      <SkipLink />
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main id="main-content" className={styles.main} tabIndex={-1}>
          <div className={styles.content}>
            <AppErrorBoundary>
              <Outlet />
            </AppErrorBoundary>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
