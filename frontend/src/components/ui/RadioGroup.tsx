/**
 * RadioGroup — design-system §6.2. Mutually exclusive small sets (e.g. Single trip / Round trip).
 * Radix primitive styled with tokens; large hit target; obvious selected state.
 */
import * as RRadio from '@radix-ui/react-radio-group';
import { useId } from 'react';
import styles from './RadioGroup.module.css';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  ariaLabel?: string;
}

export function RadioGroup({ options, value, defaultValue, onValueChange, name, ariaLabel }: RadioGroupProps) {
  const groupId = useId();
  return (
    <RRadio.Root
      className={styles.group}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const id = `${groupId}-${opt.value}`;
        return (
          <span className={styles.row} key={opt.value}>
            <RRadio.Item id={id} className={styles.item} value={opt.value} disabled={opt.disabled}>
              <RRadio.Indicator className={styles.indicator} />
            </RRadio.Item>
            <label htmlFor={id} className={styles.label}>
              {opt.label}
            </label>
          </span>
        );
      })}
    </RRadio.Root>
  );
}
