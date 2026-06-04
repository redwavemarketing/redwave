/**
 * FormField — design-system §6.2. Wraps a control with a label above, optional helper text below, and
 * an inline error (danger, with icon + message) adjacent to the field. Associates label + descriptions
 * to the control via id/aria for accessibility (§9). Tokens only.
 */
import { AlertCircle } from 'lucide-react';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './FormField.module.css';

export interface FormFieldProps {
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, help, error, required, children, className }: FormFieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'data-invalid': error ? '' : undefined,
      })
    : children;

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
      {help && !error && (
        <p className={styles.help} id={helpId}>
          {help}
        </p>
      )}
      {error && (
        <p className={styles.error} id={errorId}>
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
