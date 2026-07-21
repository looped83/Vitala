import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/Icon/Icon';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
}

/** Native checkbox with an accessible label. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, ...rest },
  ref,
) {
  return (
    <label className={cn(styles.wrap, className)}>
      <input ref={ref} id={id} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden="true">
        <Icon name="check" size={16} className={styles.check} />
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description ? <span className={styles.description}>{description}</span> : null}
      </span>
    </label>
  );
});
