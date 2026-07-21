import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'primary' | 'success' | 'info';
  className?: string;
}

/** Small, quiet label for titles / milestones (design-system §18.4). */
export function Badge({ children, tone = 'neutral', className }: BadgeProps): React.JSX.Element {
  return <span className={cn(styles.badge, styles[tone], className)}>{children}</span>;
}
