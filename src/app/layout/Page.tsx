import { useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from './Page.module.css';

export interface PageProps {
  /** Sets document.title (unique page titles, accessibility §19.1). */
  documentTitle: string;
  /** Visible page heading — each page has exactly one <h1>. */
  heading: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  /** Constrain to a narrow reading width (forms/auth). */
  narrow?: boolean;
  children: ReactNode;
}

/** Standard page frame: sets the title, renders the single h1, and lays out. */
export function Page({
  documentTitle,
  heading,
  intro,
  actions,
  narrow = false,
  children,
}: PageProps): React.JSX.Element {
  useEffect(() => {
    document.title = `${documentTitle} · Vitala`;
  }, [documentTitle]);

  return (
    <div className={narrow ? styles.narrow : styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{heading}</h1>
          {intro ? <p className={styles.intro}>{intro}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
