import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './RadioGroup.module.css';

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  /** Optional leading visual (decorative). */
  icon?: ReactNode;
}

export interface RadioGroupProps<T extends string> {
  legend: string;
  /** Hide the legend visually while keeping it for screen readers. */
  hideLegend?: boolean;
  name?: string;
  value: T;
  options: ReadonlyArray<RadioOption<T>>;
  onValueChange: (value: T) => void;
  /** Lay options out in a row (default) or as a stacked list. */
  orientation?: 'row' | 'stack';
  className?: string;
}

/**
 * Accessible radio group using a native fieldset/legend and radio inputs
 * (accessibility §19.1). Controlled via `value` / `onValueChange`.
 */
export function RadioGroup<T extends string>({
  legend,
  hideLegend = false,
  name,
  value,
  options,
  onValueChange,
  orientation = 'row',
  className,
}: RadioGroupProps<T>): React.JSX.Element {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  return (
    <fieldset className={cn(styles.fieldset, className)}>
      <legend className={cn(styles.legend, hideLegend && styles.hiddenLegend)}>{legend}</legend>
      <div className={cn(styles.options, orientation === 'stack' && styles.stack)}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(styles.option, checked && styles.optionChecked)}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                onChange={() => onValueChange(option.value)}
                className={styles.input}
              />
              {option.icon ? (
                <span className={styles.icon} aria-hidden="true">
                  {option.icon}
                </span>
              ) : null}
              <span className={styles.text}>
                <span className={styles.label}>{option.label}</span>
                {option.description ? (
                  <span className={styles.description}>{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
