/**
 * UploadDocumentModal — create a document (documents:create). The binary upload is STUBBED (§12): the body
 * sends ONLY {title, doc_type}; the server mints the `original_file_url` reference. The FileUpload is cosmetic
 * (models the "attach a file" step) and sends nothing. On success → the new document's detail page.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, Button, FileUpload, FormField, Input, Modal, Select, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useUploadDocument } from '../api/useDocumentMutations';
import { DOC_TYPE_LABELS } from '../documents.types';
import styles from './documents.module.css';
import type { DocType } from '../documents.types';

const TYPE_OPTIONS = (Object.keys(DOC_TYPE_LABELS) as DocType[]).map((v) => ({ value: v, label: DOC_TYPE_LABELS[v] }));

export function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const upload = useUploadDocument();
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocType>('compensation_agreement');

  const onSubmit = () => {
    if (!title.trim()) return;
    upload.mutate(
      { title: title.trim(), doc_type: docType },
      {
        onSuccess: (doc) => {
          toast({ title: 'Document created', tone: 'success' });
          setTitle('');
          onClose();
          navigate(`/documents/${doc.id}`);
        },
        onError,
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && !upload.isPending && onClose()}
      title="New document"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={upload.isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={onSubmit} loading={upload.isPending} disabled={upload.isPending || !title.trim()}>
            Create document
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        <FormField label="Title" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Compensation Agreement 2026" maxLength={200} />
        </FormField>
        <FormField label="Type">
          <Select options={TYPE_OPTIONS} value={docType} onValueChange={(v) => setDocType(v as DocType)} />
        </FormField>
        <FormField label="File" help="Attaching a file is stubbed for now — the document reference is created server-side.">
          <FileUpload accept=".pdf" multiple={false} hint="PDF — upload wiring deferred (§12)" />
        </FormField>
        <Banner tone="info" title="Stubbed upload">
          The binary upload is deferred — creating the document records its metadata + a reference. You can then request signatures.
        </Banner>
      </div>
    </Modal>
  );
}
