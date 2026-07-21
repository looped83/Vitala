import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name — icon-only controls have no visible text. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'quiet' | 'surface';
}

/**
 * Icon-only button. `label` is mandatory and applied as `aria-label`
 * (accessibility §19.3). Minimum 44×44px touch target.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={cn(styles.iconButton, styles[variant], className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
});
