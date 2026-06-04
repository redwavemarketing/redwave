/**
 * ProfileReviewPage — the reviewer's queue of pending profile-change requests (SRS AUTH-011/012). The
 * queue is SCOPED SERVER-SIDE by routing (the UI never filters); a 403 or missing permission renders
 * AccessDenied. Each request is a ReviewRequestCard (current → proposed + approve/reject). — design-system §10.6
 */
import { PageHeader } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { isForbidden } from '../../../lib/api/apiError';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { useReviewQueue } from '../api/useProfileReview';
import { ReviewRequestCard } from '../components/ReviewRequestCard';
import styles from '../admin.module.css';

export default function ProfileReviewPage() {
  const canApprove = useCan('profile:approve');
  const q = useReviewQueue(canApprove);

  if (!canApprove || isForbidden(q.error)) {
    return <AccessDenied message="Reviewing profile changes requires the profile approve permission." />;
  }

  const rows = q.data ?? [];
  return (
    <div className={styles.page}>
      <PageHeader
        title="Profile change reviews"
        subtitle="Requests routed to you. Approve to apply the change; reject to discard it."
      />
      <DataState
        isLoading={q.isLoading}
        isError={q.isError}
        isEmpty={rows.length === 0}
        onRetry={() => q.refetch()}
        emptyNode={<p className="mono">No pending profile changes.</p>}
      >
        <div className={styles.queue}>
          {rows.map((r) => (
            <ReviewRequestCard key={r.id} request={r} />
          ))}
        </div>
      </DataState>
    </div>
  );
}
