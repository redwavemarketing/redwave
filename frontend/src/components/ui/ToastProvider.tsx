/**
 * ToastProvider + useToast — design-system §6.5/§9. Transient success/error feedback, announced to
 * screen readers (Radix Toast = aria-live). Tones map to semantic status. Tokens only.
 */
import * as RToast from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cx } from './cx';
import { IconButton } from './IconButton';
import { ToastContext, type ToastOptions, type ToastTone } from './toast-context';
import styles from './Toast.module.css';

interface ToastItem extends ToastOptions {
  id: number;
}

const ICONS: Record<ToastTone, ReactNode> = {
  info: <Info size={18} aria-hidden />,
  success: <CheckCircle2 size={18} aria-hidden />,
  warning: <AlertTriangle size={18} aria-hidden />,
  danger: <XCircle size={18} aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    setItems((prev) => [...prev, { id: counter.current, tone: 'info', ...options }]);
  }, []);

  const remove = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <RToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((t) => {
          const tone = t.tone ?? 'info';
          return (
            <RToast.Root
              key={t.id}
              className={cx(styles.toast, styles[tone])}
              onOpenChange={(open) => !open && remove(t.id)}
            >
              <span className={styles.icon}>{ICONS[tone]}</span>
              <div className={styles.content}>
                <RToast.Title className={styles.title}>{t.title}</RToast.Title>
                {t.description && (
                  <RToast.Description className={styles.desc}>{t.description}</RToast.Description>
                )}
              </div>
              <RToast.Close asChild>
                <IconButton label="Dismiss" icon={<X size={16} />} size="sm" />
              </RToast.Close>
            </RToast.Root>
          );
        })}
        <RToast.Viewport className={styles.viewport} />
      </RToast.Provider>
    </ToastContext.Provider>
  );
}
