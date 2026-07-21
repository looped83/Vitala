import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/Icon/Icon';
import { useFieldControlProps } from './FormField';
import styles from './controls.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: readonly SelectOption[];
  placeholder?: string;
}

/** Native <select> (accessibility §19.1 — prefer native controls). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className, ...rest },
  ref,
) {
  const fieldProps = useFieldControlProps();
  return (
    <div className={styles.selectWrap}>
      <select
        ref={ref}
        className={cn(styles.input, styles.select, className)}
        {...fieldProps}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className={styles.selectChevron} aria-hidden="true">
        <Icon name="chevronDown" size={18} />
      </span>
    </div>
  );
});
