/**
 * Skeleton — design-system §7 (loading). A shimmering placeholder block matching the eventual layout
 * (not a bare spinner). Static when prefers-reduced-motion. Tokens only.
 */
import { cx } from './cx';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1em', radius, className }: SkeletonProps) {
  return (
    <span
      className={cx(styles.skeleton, className)}
      style={{ width, height, ...(radius ? { borderRadius: radius } : {}) }}
      aria-hidden="true"
    />
  );
}
