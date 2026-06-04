/**
 * Account query hooks — the user's profile (with the change-pending flag) and their own request history.
 * TanStack Query over the typed client via `unwrap<T>()` (the playbook, CLAUDE §13). Responses are
 * `never`-typed in the contract → cast to the hand-written types in account.types.ts.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import { accountKeys } from './keys';
import type { AccountProfile, MyProfileRequest } from '../account.types';

export function useAccountProfile() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: () => unwrap<AccountProfile>(api.GET('/v1/account/profile')),
  });
}

export function useMyProfileRequests(enabled = true) {
  return useQuery({
    queryKey: accountKeys.myRequests(),
    queryFn: () => unwrap<MyProfileRequest[]>(api.GET('/v1/account/profile-change-requests')),
    enabled,
  });
}
