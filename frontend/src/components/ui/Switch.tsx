/**
 * Switch — design-system §6.2. Boolean settings (e.g. email channel per event). Radix primitive styled
 * with tokens; immediate effect (the consumer shows a toast). Optional inline label.
 */
import * as RSwitch from '@radix-ui/react-switch';
import { useId } from 'react';
import { cx } from './cx';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  'aria-label'?: string;
}

export function Switch({ checked, defaultChecked, onCheckedChange, disabled, label, id, ...rest }: SwitchProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <span className={styles.row}>
      <RSwitch.Root
        id={fieldId}
        className={styles.track}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        {...rest}
      >
        <RSwitch.Thumb className={styles.thumb} />
      </RSwitch.Root>
      {label && (
        <label htmlFor={fieldId} className={cx(styles.label, disabled && styles.disabled)}>
          {label}
        </label>
      )}
    </span>
  );
}
