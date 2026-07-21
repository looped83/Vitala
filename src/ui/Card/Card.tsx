import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Slightly raised surface with shadow. */
  elevated?: boolean;
  padding?: 'md' | 'lg' | 'none';
}

export function Card({
  elevated = false,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(styles.card, elevated && styles.elevated, styles[`pad-${padding}`], className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}): React.JSX.Element {
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {action ? <div className={styles.headerAction}>{action}</div> : null}
    </div>
  );
}
