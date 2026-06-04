/**
 * MultiSelect — design-system §6.2. Chips for selected values (removable); used for filters and
 * role/module grants. A Popover of checkable options + chip display. Tokens only.
 */
import { Plus, X } from 'lucide-react';
import { Checkbox } from './Checkbox';
import { Popover } from './Popover';
import styles from './MultiSelect.module.css';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Add…' }: MultiSelectProps) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <div className={styles.wrap}>
      {value.map((v) => (
        <span className={styles.chip} key={v}>
          {labelFor(v)}
          <button type="button" className={styles.remove} aria-label={`Remove ${labelFor(v)}`} onClick={() => toggle(v)}>
            <X size={13} />
          </button>
        </span>
      ))}
      <Popover
        trigger={
          <button type="button" className={styles.add}>
            <Plus size={14} />
            {placeholder}
          </button>
        }
      >
        <div className={styles.options}>
          {options.map((o) => (
            <Checkbox
              key={o.value}
              label={o.label}
              checked={value.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
            />
          ))}
        </div>
      </Popover>
    </div>
  );
}
