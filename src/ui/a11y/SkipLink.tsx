import styles from './SkipLink.module.css';

/**
 * "Skip to content" link — first focusable element on the page. Visually hidden
 * until focused (accessibility §19.2). Target must render an element with the
 * matching id (the app shell's <main id="main-content">).
 */
export function SkipLink({
  targetId = 'main-content',
  children = 'Zum Inhalt springen',
}: {
  targetId?: string;
  children?: string;
}): React.JSX.Element {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      {children}
    </a>
  );
}
