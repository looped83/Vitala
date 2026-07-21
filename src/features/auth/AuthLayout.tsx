import type { ReactNode } from 'react';
import { Icon } from '@/ui/Icon/Icon';
import styles from './AuthLayout.module.css';

/** Centered, calm layout for the public auth pages (login / reset). */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}): React.JSX.Element {
  return (
    <main className={styles.wrap} id="main-content">
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <Icon name="shield" size={28} />
          </span>
          <span className={styles.appName}>Vitala</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </main>
  );
}
