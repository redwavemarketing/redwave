/**
 * Import mutations — stage, reconcile, commit. The UI does NO matching/commit logic: STAGE feeds rows and
 * the backend classifies; RECONCILE asks the backend to match/edit/ignore a row; COMMIT is the backend's
 * ATOMIC + IDEMPOTENT apply (#8) — gated server-side (422 while unreconciled). The generated `rows`/
 * `mapped_data` are broken `Record<string,never>`, so we cast the hand-written bodies at the boundary. All
 * invalidate the import cache. Toasts at the call site. Responses `never`-typed → cast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import type { components } from '../../../api/generated/schema';
import { importKeys } from './keys';
import type { CreateImportBody, ImportBatch, ReconcileBody } from '../import.types';

export function useStageImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateImportBody) =>
      unwrap<ImportBatch>(api.POST('/v1/imports', { body: body as unknown as components['schemas']['CreateImportDto'] })),
    onSuccess: () => qc.invalidateQueries({ queryKey: importKeys.all }),
  });
}

export function useReconcile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReconcileBody }) =>
      unwrap<ImportBatch>(api.POST('/v1/imports/{id}/reconcile', { params: { path: { id } }, body: body as unknown as components['schemas']['ReconcileDto'] })),
    onSuccess: () => qc.invalidateQueries({ queryKey: importKeys.all }),
  });
}

export function useCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => unwrap<ImportBatch>(api.POST('/v1/imports/{id}/commit', { params: { path: { id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: importKeys.all }),
  });
}
