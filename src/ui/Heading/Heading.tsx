/**
 * Heading component for structured document hierarchy.
 */

import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './heading.module.css';

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

const HeadingLevel = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
} as const;

/**
 * Semantic heading component with appropriate font sizes.
 * Always use correct semantic level for document structure.
 */
export function Heading({
  level,
  children,
  className,
}: HeadingProps): React.JSX.Element {
  const Component = HeadingLevel[level] as keyof JSX.IntrinsicElements;

  return (
    <Component
      className={cn(styles.heading, styles[`level${level}`], className)}
    >
      {children}
    </Component>
  );
}
