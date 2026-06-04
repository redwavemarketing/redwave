/**
 * Drawer / side panel — design-system §6.5. Detail or quick-edit without leaving the list (e.g. sale
 * detail). Radix Dialog rendered as a right side-sheet, styled with tokens (focus trap + Esc).
 */
import * as RDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from './IconButton';
import styles from './Drawer.module.css';

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onOpenChange, trigger, title, children, footer }: DrawerProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className={styles.overlay} />
        <RDialog.Content className={styles.content}>
          <div className={styles.header}>
            <RDialog.Title className={styles.title}>{title}</RDialog.Title>
            <RDialog.Close asChild>
              <IconButton label="Close" icon={<X size={18} />} />
            </RDialog.Close>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
