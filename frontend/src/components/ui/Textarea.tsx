/**
 * Textarea — design-system §6.2. Auto-grows to a max; optional character counter when maxLength is
 * set. Danger border on invalid (via data-invalid from FormField). Tokens only.
 */
import { forwardRef, useEffect, useRef, useState, type TextareaHTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './Textarea.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Max auto-grow height in px before scrolling (default 200). */
  maxHeight?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, maxHeight = 200, maxLength, onChange, value, defaultValue, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const [count, setCount] = useState(String(value ?? defaultValue ?? '').length);

  const setRefs = (el: HTMLTextAreaElement | null) => {
    innerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  const grow = () => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  useEffect(grow, [value, maxHeight]);

  return (
    <div className={styles.wrap}>
      <textarea
        ref={setRefs}
        className={cx(styles.textarea, className)}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setCount(e.target.value.length);
          grow();
          onChange?.(e);
        }}
        {...rest}
      />
      {maxLength != null && (
        <span className={cx(styles.counter, 'mono')}>
          {count}/{maxLength}
        </span>
      )}
    </div>
  );
});
