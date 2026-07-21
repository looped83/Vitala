import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './Chip.module.css';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  /** Toggle state exposed as `aria-pressed` (accessibility §19.3). */
  pressed: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Toggle chip for multi-select choices (e.g. later nutrition building blocks).
 * Native <button> with `aria-pressed`.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { pressed, icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      className={cn(styles.chip, pressed && styles.pressed, className)}
      {...rest}
    >
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </button>
  );
});
