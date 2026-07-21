import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/ui/cn';
import { useFieldControlProps } from './FormField';
import styles from './controls.module.css';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, rows = 3, ...rest },
  ref,
) {
  const fieldProps = useFieldControlProps();
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(styles.input, styles.textarea, className)}
      {...fieldProps}
      {...rest}
    />
  );
});
