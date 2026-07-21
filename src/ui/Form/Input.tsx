import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/ui/cn';
import { useFieldControlProps } from './FormField';
import styles from './controls.module.css';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Text-like input. Inherits id/aria wiring from an enclosing FormField. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...rest },
  ref,
) {
  const fieldProps = useFieldControlProps();
  return (
    <input
      ref={ref}
      type={type}
      className={cn(styles.input, className)}
      {...fieldProps}
      {...rest}
    />
  );
});
