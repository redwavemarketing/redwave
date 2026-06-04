/**
 * API error handling — the reusable error surface for every screen. `ApiError` carries the HTTP status
 * + a human message extracted from the backend; `useApiErrorToast` shows it as a danger toast. Mutations
 * pass their `onError` here; queries surface errors via DataState. (RBAC denials come back as 403/409/422
 * from the server — the real gate — regardless of any UI gating; CLAUDE §5.)
 */
import { useCallback } from 'react';
import { useToast } from '../../components/ui';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** The parsed error response body, when present — e.g. a 422's structured `{ unpriced: [...] }`. */
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** True when a thrown query/mutation error is a server 403 (an ApiError carries the HTTP status). */
export function isForbidden(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: unknown }).status === 403;
}

/**
 * Returns a handler that surfaces any thrown error (ApiError or otherwise) as a danger toast. Its
 * signature is `(err) => void` so it drops straight into a React Query mutation `onError` (extra
 * args — variables/context — are ignored) and into any `.catch()`. Pass an optional fallback message
 * to the hook for the rare error without a server message.
 */
export function useApiErrorToast(fallback = 'Something went wrong. Please try again.') {
  const { toast } = useToast();
  return useCallback(
    (err: unknown) => {
      const description = err instanceof Error && err.message ? err.message : fallback;
      toast({ title: 'Error', description, tone: 'danger' });
    },
    [toast, fallback],
  );
}
