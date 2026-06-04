/**
 * ReviewActions — Approve / Reject / Send-back for a submitted report (SRS EXP-006). Approve is immediate;
 * Reject and Send-back open a note dialog (optional reason). One endpoint: POST /{id}/approve with the
 * decision. Reused by the approval queue card and the detail page. Tokens only.
 */
import { useState } from 'react';
import { Button, FormField, Modal, Textarea, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useReviewReport } from '../api/useExpenseMutations';
import type { ReviewDecision } from '../expenses.types';

export function ReviewActions({ reportId, onDone }: { reportId: string; onDone?: () => void }) {
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const review = useReviewReport();
  const [noteFor, setNoteFor] = useState<null | 'reject' | 'send_back'>(null);
  const [note, setNote] = useState('');

  const decide = (decision: ReviewDecision, withNote?: string) =>
    review.mutate(
      { id: reportId, body: { decision, note: withNote || undefined } },
      {
        onSuccess: () => {
          toast({
            title: decision === 'approve' ? 'Report approved' : decision === 'reject' ? 'Report rejected' : 'Sent back',
            tone: 'success',
          });
          setNoteFor(null);
          setNote('');
          onDone?.();
        },
        onError,
      },
    );

  return (
    <>
      <Button variant="primary" onClick={() => decide('approve')} loading={review.isPending}>
        Approve
      </Button>
      <Button variant="secondary" onClick={() => setNoteFor('send_back')}>
        Send back
      </Button>
      <Button variant="destructive" onClick={() => setNoteFor('reject')}>
        Reject
      </Button>

      <Modal
        open={noteFor !== null}
        onOpenChange={(o) => !o && setNoteFor(null)}
        title={noteFor === 'reject' ? 'Reject report' : 'Send back for correction'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteFor(null)}>
              Cancel
            </Button>
            <Button
              variant={noteFor === 'reject' ? 'destructive' : 'primary'}
              loading={review.isPending}
              onClick={() => noteFor && decide(noteFor, note)}
            >
              {noteFor === 'reject' ? 'Reject' : 'Send back'}
            </Button>
          </>
        }
      >
        <FormField label="Reason" help="Optional — shown to the submitter.">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="What needs fixing?" />
        </FormField>
      </Modal>
    </>
  );
}
