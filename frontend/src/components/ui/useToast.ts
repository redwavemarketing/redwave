import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './toast-context';

/** Trigger transient toasts. Must be used within a ToastProvider. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
