/**
 * StepIndicator — a small, non-interactive wizard progress display (Stage → Reconcile → Commit). The page
 * computes each step's state from the batch status; this just renders. Tokens only (no Stepper in the
 * foundation, so it's hand-built per §13).
 */
import { Check } from 'lucide-react';
import { cx } from '../../../components/ui';
import styles from './import.module.css';

export type StepState = 'done' | 'current' | 'upcoming';
export interface Step {
  label: string;
  state: StepState;
}

export function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className={styles.stepper} role="list" aria-label="Import progress">
      {steps.map((s, i) => (
        <div className={styles.step} key={s.label} role="listitem">
          <div className={cx(styles.step, s.state === 'done' && styles.stepDone, s.state === 'current' && styles.stepCurrent)}>
            <span className={styles.stepCircle}>{s.state === 'done' ? <Check size={15} aria-hidden /> : i + 1}</span>
            <span className={styles.stepLabel}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <span className={styles.stepConnector} aria-hidden />}
        </div>
      ))}
    </div>
  );
}
