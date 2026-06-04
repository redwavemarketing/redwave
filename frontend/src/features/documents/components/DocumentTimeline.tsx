/**
 * DocumentTimeline — a composed activity feed from the document's nested requests + signatures (there is no
 * audit-log endpoint). Each row is an EVENT (requested / signed / declined) with a relative time; declines
 * carry no timestamp in the response (audit-only). DISPLAY only — it never re-derives the overall status.
 */
import { Avatar } from '../../../components/ui';
import { relativeTime } from '../../../lib/format/date';
import { buildTimeline } from '../documents.logic';
import styles from './documents.module.css';
import type { ResolvedUser } from '../api/useUserLookup';
import type { Document } from '../documents.types';

const VERB: Record<'requested' | 'signed' | 'declined', string> = {
  requested: 'requested signatures',
  signed: 'signed',
  declined: 'declined',
};

export function DocumentTimeline({ doc, resolve }: { doc: Document; resolve: (userId: string) => ResolvedUser }) {
  const events = buildTimeline(doc);
  if (events.length === 0) {
    return <p className={styles.note}>No activity yet.</p>;
  }
  return (
    <div className={styles.timeline}>
      {events.map((e) => {
        const u = resolve(e.actorId);
        return (
          <div key={e.key} className={styles.timelineRow}>
            <Avatar name={u.name} src={u.avatarUrl} size="sm" />
            <span className={styles.timelineText}>
              <strong>{u.label}</strong> {VERB[e.kind]}
            </span>
            <span className={styles.timelineTime}>{e.at ? relativeTime(e.at) : '—'}</span>
          </div>
        );
      })}
    </div>
  );
}
