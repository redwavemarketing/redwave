/**
 * Placeholder — a stand-in for a control deferred to its feature session (Combobox/autocomplete,
 * full Date-range picker). Renders a clearly non-interactive, labelled field so the showcase shows
 * where it goes without shipping a half-built control. Tokens only.
 */
import type { ReactNode } from 'react';
import styles from './Placeholder.module.css';

export interface PlaceholderProps {
  icon: ReactNode;
  label: string;
  note: string;
}

export function Placeholder({ icon, label, note }: PlaceholderProps) {
  return (
    <div className={styles.box} aria-disabled="true">
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{label}</span>
      <span className={styles.note}>{note}</span>
    </div>
  );
}
