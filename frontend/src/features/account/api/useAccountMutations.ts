/**
 * Account mutations — request an HR-field change (creates a PENDING profile_change_request; never a live
 * write — SRS AUTH-011) and change password. On success they invalidate the account profile so the
 * pending banner / fresh state reflects immediately. Toasts are supplied by the caller via onSuccess/onError.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { accountKeys } from './keys';
import type { ChangePasswordBody, ProfileChangeRequestBody } from '../account.types';

export function useRequestProfileChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileChangeRequestBody) =>
      unwrap<unknown>(api.POST('/v1/account/profile-change-requests', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.all }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordBody) =>
      unwrap<{ success: true }>(api.POST('/v1/account/change-password', { body })),
  });
}
