/**
 * Checkbox — design-system §6.2. Radix primitive (accessible, keyboard) styled with tokens. Supports
 * the indeterminate state for table 'select all'. Optional inline label.
 */
import * as RCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { useId } from 'react';
import { cx } from './cx';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  'aria-label'?: string;
}

export function Checkbox({ checked, defaultChecked, onCheckedChange, disabled, label, id, ...rest }: CheckboxProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <span className={styles.row}>
      <RCheckbox.Root
        id={fieldId}
        className={styles.box}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        {...rest}
      >
        <RCheckbox.Indicator className={styles.indicator}>
          {checked === 'indeterminate' ? <Minus size={14} /> : <Check size={14} />}
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      {label && (
        <label htmlFor={fieldId} className={cx(styles.label, disabled && styles.disabled)}>
          {label}
        </label>
      )}
    </span>
  );
}
