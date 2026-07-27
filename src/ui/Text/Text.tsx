/**
 * Text component for semantic typography.
 */

import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './text.module.css';

interface TextProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  as?: 'p' | 'span' | 'div';
}

/**
 * Flexible text component for typography hierarchy.
 */
export function Text({
  children,
  variant = 'primary',
  size = 'medium',
  className,
  as: Component = 'p',
}: TextProps): React.JSX.Element {
  return (
    <Component
      className={cn(
        styles.text,
        styles[variant],
        styles[size],
        className,
      )}
    >
      {children}
    </Component>
  );
}
