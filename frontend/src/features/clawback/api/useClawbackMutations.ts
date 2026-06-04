/**
 * Clawback mutation — create a recovery. The amount comes from the SERVER (engine calc off the frozen
 * snapshot) when omitted; the UI never computes it (#1/#6). A clawback flips the target item + its sale to
 * clawed_back, so we invalidate BOTH the clawback cache and the sales cache. Toasts at the call site;
 * 422 (not paid) / 409 (double) surface via useApiErrorToast. Response `never`-typed → cast.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { clawbackKeys } from './keys';
import type { Clawback, CreateClawbackBody } from '../clawback.types';

export function useCreateClawback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClawbackBody) => unwrap<Clawback>(api.POST('/v1/clawbacks', { body })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clawbackKeys.all });
      qc.invalidateQueries({ queryKey: ['sales'] }); // the item + sale flip to clawed_back
    },
  });
}
