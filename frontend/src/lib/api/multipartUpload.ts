/**
 * multipartPost — a RAW multipart fetch (openapi-fetch doesn't model multipart well). Shared by every
 * file-upload path (documents, signed-copy upload, saved signatures, rep documents). Injects the bearer
 * from the in-memory session; base URL matches `api/client`; parses the contract error envelope into an
 * ApiError so callers' error toasts work uniformly.
 */
import { getAccessToken } from '../../api/auth-store';
import { getCsrfToken } from '../../auth/session';
import { ApiError } from './apiError';

export async function multipartPost<T>(path: string, form: FormData): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL?.trim() || '';
  const token = getAccessToken();
  // A mutating POST → carry the session cookie + the double-submit CSRF header (the global CSRF guard
  // checks it), plus the bearer access token. — arch §security
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: form,
  });
  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    let details: unknown;
    try {
      const body = (await res.json()) as { error?: { message?: string; details?: unknown } };
      message = body.error?.message ?? message;
      details = body.error?.details;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message, details);
  }
  return (await res.json()) as T;
}
