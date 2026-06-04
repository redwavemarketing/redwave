/**
 * TokenService — signs/verifies the access and refresh JWTs.
 *
 * Access and refresh tokens use SEPARATE secrets so a leaked access token cannot be replayed
 * as a refresh token. Tokens are stateless; immediate revocation is achieved by JwtAuthGuard
 * re-loading the user (and rejecting inactive accounts) on every request. — SRS AUTH-001/008
 */
import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh';
}

// `expiresIn` accepts a number (seconds) or a `ms` string like '15m' / '7d'. The value comes
// from config as a plain string, so cast it to the option's expected type.
type ExpiresIn = JwtSignOptions['expiresIn'];

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccess(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'access' },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m') as ExpiresIn,
      },
    );
  }

  signRefresh(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '7d') as ExpiresIn,
      },
    );
  }

  verifyRefresh(token: string): Promise<TokenPayload> {
    return this.jwt.verifyAsync<TokenPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
