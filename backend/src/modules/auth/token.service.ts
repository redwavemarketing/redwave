/**
 * TokenService — signs/verifies the access JWT and the short-lived MFA challenge JWT.
 *
 * The ACCESS token is a stateless JWT carrying `sub` (user id) + `sid` (refresh-session id). The REFRESH
 * token is NOT a JWT — it's an opaque, rotating, DB-backed secret (see RefreshSessionService); the cookie
 * carries it. The MFA challenge token is a 5-minute JWT proving "password verified, awaiting 2FA".
 *
 * `verifyAccess` accepts the current secret OR an optional `*_OLD` secret, enabling zero-downtime JWT-secret
 * rotation (sign with the new secret; keep verifying tokens signed with the old one until they expire).
 * Immediate revocation is enforced by the guard via the `sid` session check. — SRS AUTH-001/008, arch §security
 */
import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  type: 'access' | 'mfa';
  /** Refresh-session id — present on access tokens; absent on the MFA challenge. */
  sid?: string;
}

// `expiresIn` accepts a number (seconds) or a `ms` string like '15m' / '5m'; config gives a plain string.
type ExpiresIn = JwtSignOptions['expiresIn'];

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Access token: `sub` + `sid` (the session the guard checks for revocation). */
  signAccess(userId: string, sid: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'access', sid },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as ExpiresIn,
      },
    );
  }

  /** Verify an access token against the current secret, then any `*_OLD` rotation secret. */
  verifyAccess(token: string): Promise<TokenPayload> {
    return this.verifyWithSecrets(token, this.accessSecrets());
  }

  /** A 5-minute challenge token issued after the password step, redeemed by /auth/mfa/verify. */
  signMfaChallenge(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'mfa' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('MFA_CHALLENGE_TTL', '5m') as ExpiresIn,
      },
    );
  }

  async verifyMfaChallenge(token: string): Promise<TokenPayload> {
    const payload = await this.verifyWithSecrets(token, this.accessSecrets());
    if (payload.type !== 'mfa') throw new Error('Not an MFA challenge token');
    return payload;
  }

  private accessSecrets(): string[] {
    const primary = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const old = this.config.get<string>('JWT_ACCESS_SECRET_OLD');
    return old ? [primary, old] : [primary];
  }

  private async verifyWithSecrets(token: string, secrets: string[]): Promise<TokenPayload> {
    let lastError: unknown;
    for (const secret of secrets) {
      try {
        return await this.jwt.verifyAsync<TokenPayload>(token, { secret });
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError ?? new Error('Token verification failed');
  }
}
