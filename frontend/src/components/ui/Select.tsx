/**
 * Select — design-system §6.2. Radix Select (native-feeling, keyboard-navigable) styled with tokens.
 * Used for client, product, field manager, etc. (A search filter for >8 options is part of the
 * enhanced combobox, deferred to its feature session.)
 */
import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cx } from './cx';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

export function Select({ options, value, defaultValue, onValueChange, placeholder = 'Select…', disabled, id, ...rest }: SelectProps) {
  return (
    <RSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
      <RSelect.Trigger id={id} className={styles.trigger} {...rest}>
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon className={styles.triggerIcon}>
          <ChevronDown size={16} />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content className={styles.content} position="popper" sideOffset={4}>
          <RSelect.Viewport className={styles.viewport}>
            {options.map((opt) => (
              <RSelect.Item key={opt.value} value={opt.value} disabled={opt.disabled} className={cx(styles.item)}>
                <RSelect.ItemText>{opt.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className={styles.itemIndicator}>
                  <Check size={15} />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
