/**
 * LoadingSpinner — the branded loading animation (the Redwave "LOADING" hand). The SVG is INLINED via
 * svgr (`?react`, the Logo convention) so its gray "LOADING" ink can theme via `currentColor` (the
 * wrapper's `color` token) — legible on both themes — while the blue hand keeps its own colours. The
 * SMIL animation (bouncing letters) plays as-is. The art already reads "LOADING", so callers add NO
 * separate text label. Used for genuine full-area spinner spots (route Suspense, session boot); table
 * skeletons / button spinner / chatbot dots are purpose-built and stay as they are. — §13
 */
import LoadingArt from '../../assets/brand/loading.svg?react';
import { cx } from './cx';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  /** sm = inline, md = default, lg = full-page / boot. */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible status label. */
  label?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', label = 'Loading', className }: LoadingSpinnerProps) {
  return (
    <span className={cx(styles.wrap, styles[size], className)} role="status" aria-label={label}>
      <LoadingArt className={styles.art} aria-hidden focusable={false} />
    </span>
  );
}
