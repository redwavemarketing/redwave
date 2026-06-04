/**
 * Modal / dialog — design-system §6.5. Radix Dialog (traps focus, Esc, restores focus) styled with
 * tokens. Focused tasks + all confirmations. Destructive confirms should restate the consequence in
 * the body. Tokens only.
 */
import * as RDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { IconButton } from './IconButton';
import styles from './Modal.module.css';

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onOpenChange, trigger, title, description, children, footer, size = 'md' }: ModalProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RDialog.Trigger asChild>{trigger}</RDialog.Trigger>}
      <RDialog.Portal>
        <RDialog.Overlay className={styles.overlay} />
        <RDialog.Content className={cx(styles.content, styles[size])}>
          <div className={styles.header}>
            <RDialog.Title className={styles.title}>{title}</RDialog.Title>
            <RDialog.Close asChild>
              <IconButton label="Close" icon={<X size={18} />} />
            </RDialog.Close>
          </div>
          {description && <RDialog.Description className={styles.description}>{description}</RDialog.Description>}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

export const ModalClose = RDialog.Close;
