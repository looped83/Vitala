import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/Icon/Icon';
import type { IconName } from '@/ui/Icon/Icon';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'attention';

const TONE_ICON: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  attention: 'error',
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children: ReactNode;
  /** For error/validation summaries that should be announced. */
  role?: 'status' | 'alert';
  className?: string;
}

/**
 * Status message combining icon + text (never colour alone, accessibility
 * §19.5). Use `role="alert"` for errors that must be announced.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  role = 'status',
  className,
}: AlertProps): React.JSX.Element {
  return (
    <div className={cn(styles.alert, styles[tone], className)} role={role}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={TONE_ICON[tone]} size={20} />
      </span>
      <div className={styles.body}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <div className={styles.text}>{children}</div>
      </div>
    </div>
  );
}
