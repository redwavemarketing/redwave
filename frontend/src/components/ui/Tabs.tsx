/**
 * Tabs — design-system §6.5 (within a detail view, e.g. Rep: Profile / Documents / Equipment). Radix
 * Tabs styled with tokens; active tab uses the accent underline.
 */
import * as RTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
}

export function Tabs({ items, defaultValue, value, onValueChange, ariaLabel }: TabsProps) {
  return (
    <RTabs.Root
      className={styles.root}
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
    >
      <RTabs.List className={styles.list} aria-label={ariaLabel}>
        {items.map((item) => (
          <RTabs.Trigger key={item.value} value={item.value} className={styles.trigger}>
            {item.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {items.map((item) => (
        <RTabs.Content key={item.value} value={item.value} className={styles.content}>
          {item.content}
        </RTabs.Content>
      ))}
    </RTabs.Root>
  );
}
