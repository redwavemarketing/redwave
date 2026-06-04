/** A titled block in the component showcase. Tokens only. */
import type { ReactNode } from 'react';
import styles from './Showcase.module.css';

export function ShowcaseSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description && <p className={styles.sectionDesc}>{description}</p>}
      </div>
      <div className={styles.row}>{children}</div>
    </section>
  );
}
