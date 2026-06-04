/**
 * DropdownMenu — design-system §6.1/§6.5. Row overflow actions, split-button menus, etc. Radix
 * DropdownMenu styled with tokens (keyboard navigable, gated by permission at the call site).
 */
import * as RMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './DropdownMenu.module.css';

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export type MenuEntry = MenuAction | 'separator';

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: MenuEntry[];
  align?: 'start' | 'center' | 'end';
}

export function DropdownMenu({ trigger, items, align = 'end' }: DropdownMenuProps) {
  return (
    <RMenu.Root>
      <RMenu.Trigger asChild>{trigger}</RMenu.Trigger>
      <RMenu.Portal>
        <RMenu.Content className={styles.content} align={align} sideOffset={4}>
          {items.map((item, i) =>
            item === 'separator' ? (
              <RMenu.Separator key={i} className={styles.separator} />
            ) : (
              <RMenu.Item
                key={i}
                className={cx(styles.item, item.danger && styles.danger)}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                {item.label}
              </RMenu.Item>
            ),
          )}
        </RMenu.Content>
      </RMenu.Portal>
    </RMenu.Root>
  );
}
