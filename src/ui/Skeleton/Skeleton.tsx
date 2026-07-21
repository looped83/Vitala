import { cn } from '@/ui/cn';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

/**
 * Placeholder block for loading lists/cards. Purely decorative
 * (`aria-hidden`); the pulse animation is disabled under reduced motion.
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-sm)',
  className,
}: SkeletonProps): React.JSX.Element {
  return (
    <span
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
