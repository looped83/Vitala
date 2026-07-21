import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/ui/cn';
import { Spinner } from '@/ui/Spinner/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables interaction; announces busy state. */
  loading?: boolean;
  /** Optional leading icon (decorative — label carries the meaning). */
  leadingIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * Primary interactive control. Always a native <button> (accessibility §19.1).
 * Minimum height 44px (touch target). See docs/design-system-implementation.md.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    fullWidth = false,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      // eslint-disable-next-line react/button-has-type
      type={type}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true">
          <Spinner size="sm" />
        </span>
      ) : leadingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
});
