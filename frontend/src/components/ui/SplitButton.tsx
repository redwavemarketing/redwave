/**
 * SplitButton — design-system §6.1. A primary action + a dropdown of related actions (e.g. Export ▾).
 * Composes Button + DropdownMenu. Tokens only.
 */
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';
import { DropdownMenu, type MenuEntry } from './DropdownMenu';
import { IconButton } from './IconButton';
import styles from './SplitButton.module.css';

export interface SplitButtonProps {
  label: ReactNode;
  onClick?: () => void;
  items: MenuEntry[];
  variant?: ButtonVariant;
}

export function SplitButton({ label, onClick, items, variant = 'secondary' }: SplitButtonProps) {
  return (
    <span className={styles.group}>
      <Button variant={variant} onClick={onClick} className={styles.main}>
        {label}
      </Button>
      <DropdownMenu
        items={items}
        trigger={
          <IconButton
            label="More actions"
            icon={<ChevronDown size={16} />}
            variant={variant === 'primary' ? 'ghost' : 'outline'}
            className={styles.toggle}
          />
        }
      />
    </span>
  );
}
