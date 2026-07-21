import { createContext, useContext, useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import { Icon } from '@/ui/Icon/Icon';
import styles from './FormField.module.css';

interface FieldContextValue {
  fieldId: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
  isRequired: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Access the enclosing FormField's ids/state so a control can wire
 * `aria-describedby`, `aria-invalid` and `aria-required` automatically
 * (accessibility §19.6). Returns null when used outside a FormField.
 */
// eslint-disable-next-line react-refresh/only-export-components -- hooks co-located with FormField
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext);
}

/** Compute the control props (id, aria-*) a field control should spread. */
// eslint-disable-next-line react-refresh/only-export-components -- hooks co-located with FormField
export function useFieldControlProps(): {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
  'aria-required': boolean | undefined;
} {
  const ctx = useContext(FieldContext);
  const fallbackId = useId();
  if (!ctx) {
    return {
      id: fallbackId,
      'aria-describedby': undefined,
      'aria-invalid': undefined,
      'aria-required': undefined,
    };
  }
  const describedBy = [ctx.hasError ? ctx.errorId : null, ctx.descriptionId]
    .filter(Boolean)
    .join(' ');
  return {
    id: ctx.fieldId,
    'aria-describedby': describedBy.length > 0 ? describedBy : undefined,
    'aria-invalid': ctx.hasError || undefined,
    'aria-required': ctx.isRequired || undefined,
  };
}

export interface FormFieldProps {
  label: string;
  /** Longer helper text; wired via aria-describedby. */
  description?: ReactNode;
  /** Field error message; wired via aria-describedby + aria-invalid. */
  error?: string;
  required?: boolean;
  /** Hide the visible label (still read by screen readers). */
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Accessible field wrapper: visible <label>, optional description, field-level
 * error with icon + text (never colour alone, accessibility §19.5). Provides
 * ids to the enclosed control via context.
 */
export function FormField({
  label,
  description,
  error,
  required = false,
  hideLabel = false,
  className,
  children,
}: FormFieldProps): React.JSX.Element {
  const base = useId();
  const value = useMemo<FieldContextValue>(
    () => ({
      fieldId: `${base}-field`,
      descriptionId: `${base}-description`,
      errorId: `${base}-error`,
      hasError: Boolean(error),
      isRequired: required,
    }),
    [base, error, required],
  );

  return (
    <FieldContext.Provider value={value}>
      <div className={cn(styles.field, className)}>
        <label
          htmlFor={value.fieldId}
          className={cn(styles.label, hideLabel && styles.hiddenLabel)}
        >
          {label}
          {required ? (
            <span className={styles.required}>
              {' '}
              *<span className={styles.srOnly}> (Pflichtfeld)</span>
            </span>
          ) : null}
        </label>
        {children}
        {description ? (
          <p id={value.descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={value.errorId} className={styles.error} role="alert">
            <Icon name="warning" size={16} />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}
