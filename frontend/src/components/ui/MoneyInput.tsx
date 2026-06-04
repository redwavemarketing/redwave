/**
 * MoneyInput — design-system §6.2/§4. Money inputs use the mono tabular family, right-aligned, with a
 * fixed currency prefix so figures align and read cleanly. Tokens only.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './MoneyInput.module.css';

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Currency prefix shown inside the field (default "$"). */
  currency?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { currency = '$', className, disabled, ...rest },
  ref,
) {
  return (
    <div className={cx(styles.wrap, disabled && styles.disabled)}>
      <span className={styles.prefix} aria-hidden="true">
        {currency}
      </span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cx(styles.input, 'mono', className)}
        disabled={disabled}
        {...rest}
      />
    </div>
  );
});
