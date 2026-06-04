/**
 * SignDeclineModal — the ROW-LEVEL sign/decline action. It's only opened for the current user when they are
 * the asked PENDING signer (findMyPendingSignature); the SERVER is the real gate (a non-signer → 403, an
 * already-closed request → 409 — both surfaced via the error toast). DECLINE IS TERMINAL — it ends the
 * request and marks the document declined. Tokens only.
 */
import { useState } from 'react';
import { Banner, Button, FormField, Input, Modal, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useSignRequest } from '../api/useDocumentMutations';
import styles from './documents.module.css';
import type { SignDecision } from '../documents.types';

interface Props {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
  decision: SignDecision;
}

export function SignDeclineModal({ open, onClose, requestId, decision }: Props) {
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const sign = useSignRequest();
  const [typedName, setTypedName] = useState('');
  const isSign = decision === 'sign';

  const onSubmit = () => {
    if (!requestId) return;
    sign.mutate(
      { requestId, body: { decision, ...(isSign && typedName.trim() ? { method: 'typed' } : {}) } },
      {
        onSuccess: () => {
          toast({ title: isSign ? 'Document signed' : 'Signature declined', tone: isSign ? 'success' : 'warning' });
          setTypedName('');
          onClose();
        },
        onError, // surfaces the server's row-level message (403 non-signer / 409 closed)
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !sign.isPending && onClose()}
      title={isSign ? 'Sign document' : 'Decline to sign'}
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={sign.isPending}>
            Cancel
          </Button>
          <Button variant={isSign ? 'primary' : 'destructive'} type="button" onClick={onSubmit} loading={sign.isPending} disabled={sign.isPending}>
            {isSign ? 'Sign' : 'Decline'}
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        {isSign ? (
          <>
            <p className={styles.note}>You are signing as the asked recipient. A signed copy is recorded; the original document is never modified.</p>
            <FormField label="Type your name (optional)" help="Records the method as a typed signature.">
              <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} placeholder="Your full name" maxLength={40} />
            </FormField>
          </>
        ) : (
          <Banner tone="danger" title="Declining is final">
            Declining ends this signature request and marks the document <strong>declined</strong>. No one can sign it afterwards. This can’t be undone.
          </Banner>
        )}
      </div>
    </Modal>
  );
}
