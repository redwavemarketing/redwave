/**
 * `unwrap` — the bridge between the openapi-fetch client and TanStack Query. openapi-fetch returns
 * `{ data, error, response }`; this throws an `ApiError` on a non-2xx (so React Query's `isError`
 * fires) and returns the parsed body otherwise. The cast to `T` is needed because the backend OpenAPI
 * declares no response schemas (so `data` is typed `never`) — callers pass the hand-written response
 * type. Remove the cast once the backend ships `@ApiResponse` DTOs (flagged follow-up). — CLAUDE §13
 */
import { ApiError } from '../api/apiError';

interface FetchResult {
  data?: unknown;
  error?: unknown;
  response: Response;
}

function messageFrom(error: unknown, response: Response): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (Array.isArray(m)) return m.join(', ');
    if (m) return String(m);
  }
  return response.statusText || `Request failed (${response.status})`;
}

export async function unwrap<T>(promise: Promise<FetchResult>): Promise<T> {
  const { data, error, response } = await promise;
  if (!response.ok) {
    // Carry the parsed body (e.g. a 422's structured `{ unpriced: [...] }`) so callers can surface details.
    throw new ApiError(response.status, messageFrom(error, response), error);
  }
  return data as T;
}
