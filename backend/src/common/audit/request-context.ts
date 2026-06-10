/**
 * Per-request context (AsyncLocalStorage) — carries the actor's request IP through the async call chain so
 * the AuditService can stamp `ip_address` without threading the request into every service signature. A
 * single global middleware (wired in main.ts) opens the context for each request. — arch §security (audit)
 */
import { AsyncLocalStorage } from 'async_hooks';
import type { Request } from 'express';

export interface RequestContext {
  ip?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** The IP of the request currently being handled, or undefined outside a request (jobs, seeds, tests). */
export function currentIp(): string | undefined {
  return storage.getStore()?.ip;
}

/** Resolve the client IP, honouring the proxy hop (trust proxy is set). */
export function ipOfRequest(req: Request): string | undefined {
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0];
  return (first?.trim() || req.ip || undefined) ?? undefined;
}
