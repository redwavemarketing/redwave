/**
 * IconButton — design-system §6.1. Square, icon-only; an accessible label is REQUIRED (rendered as
 * aria-label + native title tooltip). Variants ghost/outline; sizes sm/md/lg. Tokens only.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible label (icon-only buttons must be labelled — §9). */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.iconBtn, styles[variant], styles[size], className)}
      {...rest}
    >
      {icon}
    </button>
  );
});
