/**
 * Auth-cookie helpers — the refresh token + CSRF token cookies.
 *
 * The refresh token rides in an **httpOnly** cookie (`rw_refresh`) so JS can never read it (XSS can't
 * exfiltrate it). The CSRF token rides in a **readable** cookie (`rw_csrf`) the SPA echoes in the
 * `X-CSRF-Token` header (double-submit). Both are `SameSite=Lax`; `Secure` + `Domain` are applied ONLY in
 * production (dev runs over http://localhost through the Vite proxy, where Secure cookies wouldn't set and a
 * shared Domain is meaningless). — arch §security
 */
import { randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';
import type { ConfigService } from '@nestjs/config';

export const REFRESH_COOKIE = 'rw_refresh';
export const CSRF_COOKIE = 'rw_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const isProd = (config: ConfigService): boolean => config.get<string>('NODE_ENV') === 'production';

/** Shared cookie flags. Secure + Domain only in prod (api. / www. are same-site under the apex domain). */
function baseOptions(config: ConfigService): CookieOptions {
  const prod = isProd(config);
  const domain = config.get<string>('COOKIE_DOMAIN'); // e.g. .redwavemarketing.ca
  return {
    sameSite: 'lax',
    secure: prod,
    domain: prod && domain ? domain : undefined,
    path: '/',
  };
}

/** A fresh, URL-safe CSRF token (also doubles as a generic random token where needed). */
export function newCsrfToken(): string {
  return randomBytes(24).toString('base64url');
}

export function setRefreshCookie(res: Response, config: ConfigService, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(config), httpOnly: true, maxAge: maxAgeMs });
}

export function setCsrfCookie(res: Response, config: ConfigService, token: string, maxAgeMs: number): void {
  // readable by JS on purpose (double-submit): the SPA copies it into the X-CSRF-Token header.
  res.cookie(CSRF_COOKIE, token, { ...baseOptions(config), httpOnly: false, maxAge: maxAgeMs });
}

export function clearAuthCookies(res: Response, config: ConfigService): void {
  const opts = baseOptions(config);
  res.clearCookie(REFRESH_COOKIE, { ...opts, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...opts, httpOnly: false });
}

/** Parse a `ms`-style duration ('7d' / '15m' / '30s' / plain seconds) to milliseconds. */
export function parseDurationMs(value: string | undefined, fallbackMs: number): number {
  if (!value) return fallbackMs;
  const m = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!m) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n * 1000 : fallbackMs; // bare number = seconds
  }
  const n = Number(m[1]);
  const unit = m[2] ?? 's';
  const mult = unit === 'd' ? 86_400_000 : unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : 1000;
  return n * mult;
}
