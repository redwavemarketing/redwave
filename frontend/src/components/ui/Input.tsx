/**
 * Input — design-system §6.2. 38px text/number input; danger border on invalid (set by FormField via
 * data-invalid). Number/money inputs should use MoneyInput for mono + right-align. Tokens only.
 */
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './Input.module.css';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(styles.input, className)} {...rest} />;
});
