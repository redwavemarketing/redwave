/**
 * RefreshSessionService — persisted, rotating, revocable refresh-token sessions.
 *
 * One row per device/login. The cookie value is `<sessionId>.<secret>`; only `sha256(secret)` is stored.
 * Each /auth/refresh ROTATES the secret on the SAME row (so "active sessions" = logins, not per-rotation),
 * updates `last_used_at`/ip, and re-issues the cookie. Presenting a secret that ≠ the stored hash is a
 * REUSE of a rotated/stolen token → the session is revoked (breach detection). Access + refresh tokens
 * carry `sid` = the session id; the JwtAuthGuard rejects any token whose session is revoked/expired, so a
 * revoke (self, SA force-logout) takes effect immediately — not only at the next refresh. — arch §security
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { parseDurationMs } from '../../common/security/cookie.util';

const sha256 = (v: string): string => createHash('sha256').update(v).digest('hex');

export interface IssuedSession {
  /** The cookie value: `<sessionId>.<secret>`. */
  token: string;
  /** The session id (goes into the access/refresh token `sid` claim). */
  sid: string;
}

export interface RotatedSession extends IssuedSession {
  userId: string;
}

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Refresh-session lifetime in ms (mirrors JWT_REFRESH_TTL; default 7d). */
  ttlMs(): number {
    return parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL', '7d'), 7 * 86_400_000);
  }

  /** Create a new session for a login. Returns the cookie token + the sid for the access token. */
  async issue(userId: string, req?: Request): Promise<IssuedSession> {
    const secret = randomBytes(32).toString('base64url');
    const session = await this.prisma.refreshSession.create({
      data: {
        user_id: userId,
        token_hash: sha256(secret),
        user_agent: userAgentOf(req),
        ip_address: ipOf(req),
        expires_at: new Date(Date.now() + this.ttlMs()),
      },
      select: { id: true },
    });
    return { token: `${session.id}.${secret}`, sid: session.id };
  }

  /** Rotate a presented refresh token. Throws 401 on missing/invalid/expired/revoked; revokes on reuse. */
  async rotate(presented: string | undefined, req?: Request): Promise<RotatedSession> {
    const { sid, secret } = splitToken(presented);
    const session = await this.prisma.refreshSession.findUnique({ where: { id: sid } });
    if (!session || session.revoked_at || session.expires_at.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.token_hash !== sha256(secret)) {
      // A secret that doesn't match the current one = an old/rotated token replayed → revoke the session.
      await this.prisma.refreshSession.update({ where: { id: sid }, data: { revoked_at: new Date() } });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    const next = randomBytes(32).toString('base64url');
    await this.prisma.refreshSession.update({
      where: { id: sid },
      data: {
        token_hash: sha256(next),
        last_used_at: new Date(),
        ip_address: ipOf(req) ?? session.ip_address,
        user_agent: userAgentOf(req) ?? session.user_agent,
      },
    });
    return { token: `${sid}.${next}`, sid, userId: session.user_id };
  }

  /** Is this session usable right now? Used by the guard for immediate `sid`-revocation. */
  async isActive(sid: string): Promise<boolean> {
    const s = await this.prisma.refreshSession.findUnique({
      where: { id: sid },
      select: { revoked_at: true, expires_at: true },
    });
    return !!s && !s.revoked_at && s.expires_at.getTime() >= Date.now();
  }

  /** Revoke one session. When `userId` is given, only the owner may revoke it (else 401). */
  async revoke(sid: string, userId?: string): Promise<void> {
    const s = await this.prisma.refreshSession.findUnique({ where: { id: sid }, select: { user_id: true } });
    if (!s) return;
    if (userId && s.user_id !== userId) throw new UnauthorizedException();
    await this.prisma.refreshSession.updateMany({
      where: { id: sid, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }

  /** Force-logout: revoke every live session for a user (SA action / deactivation). */
  async revokeAllForUser(userId: string): Promise<number> {
    const r = await this.prisma.refreshSession.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return r.count;
  }

  /** List a user's live sessions (most-recent first), marking the caller's current one. */
  async listForUser(userId: string, currentSid?: string | null) {
    const now = new Date();
    const sessions = await this.prisma.refreshSession.findMany({
      where: { user_id: userId, revoked_at: null, expires_at: { gte: now } },
      orderBy: { last_used_at: 'desc' },
      select: {
        id: true,
        user_agent: true,
        ip_address: true,
        created_at: true,
        last_used_at: true,
        expires_at: true,
      },
    });
    return sessions.map((s) => ({ ...s, is_current: s.id === currentSid }));
  }
}

function splitToken(presented: string | undefined): { sid: string; secret: string } {
  const [sid, secret] = (presented ?? '').split('.');
  if (!sid || !secret) throw new UnauthorizedException('Invalid refresh token');
  return { sid, secret };
}

function ipOf(req?: Request): string | undefined {
  if (!req) return undefined;
  const fwd = req.headers['x-forwarded-for'];
  const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(',')[0];
  return (first?.trim() || req.ip || undefined) ?? undefined;
}

function userAgentOf(req?: Request): string | undefined {
  const ua = req?.headers['user-agent'];
  return (Array.isArray(ua) ? ua[0] : ua) || undefined;
}
