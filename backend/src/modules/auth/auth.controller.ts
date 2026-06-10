/**
 * AuthController — /v1/auth: login, mfa/verify, refresh, logout, me + the public forgot/reset endpoints.
 *
 * The refresh token rides in an httpOnly cookie (`rw_refresh`, rotated each refresh); the CSRF token rides
 * in a readable cookie (`rw_csrf`). login & refresh therefore use `@Res({ passthrough: true })` to set
 * cookies. Pre-auth routes are `@CsrfExempt` (no CSRF cookie exists yet). — arch §security
 */
import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { SuccessResponse } from '../../common/dto/success.response';
import { Public } from '../../common/decorators/public.decorator';
import { CsrfExempt } from '../../common/security/csrf-exempt.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  parseDurationMs,
  setCsrfCookie,
  setRefreshCookie,
} from '../../common/security/cookie.util';
import { ConfigService } from '@nestjs/config';
import { AuthService, LoginOutcome } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { LoginResponse, MeResponse, RefreshResponse } from './dto/auth.response';

@ApiTags('Auth')
@ApiErrorResponses()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @CsrfExempt()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate with email + password',
    description:
      'Public. On success sets the rw_refresh (httpOnly) + rw_csrf cookies and returns { access_token }. ' +
      'If the user has MFA enabled, returns { mfa_required: true, mfa_token } instead — redeem it at /auth/mfa/verify.',
  })
  @ApiOkResponse({ type: LoginResponse })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const outcome = await this.auth.login(dto.email, dto.password, req);
    return this.emit(outcome, res);
  }

  @Public()
  @CsrfExempt()
  @Post('mfa/verify')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Complete the MFA challenge',
    description: 'Public. Exchanges the mfa_token + a TOTP/recovery code for a full session (sets the cookies).',
  })
  @ApiOkResponse({ type: LoginResponse })
  async verifyMfa(@Body() dto: MfaVerifyDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    const outcome = await this.auth.verifyMfa(dto.mfa_token, dto.code, req);
    return this.emit(outcome, res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rotate the refresh cookie for a new access token',
    description: 'Public (cookie-authenticated). Reads the rw_refresh cookie, rotates it, and returns a new access token. Invalid/expired/reused → 401.',
  })
  @ApiOkResponse({ type: RefreshResponse })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<RefreshResponse> {
    const presented = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    const tokens = await this.auth.refresh(presented, req);
    this.setSessionCookies(res, tokens.refresh_token, tokens.csrf_token);
    return { access_token: tokens.access_token };
  }

  @Public()
  @CsrfExempt()
  @Post('forgot-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Request a password-reset email',
    description: 'Public. Always returns success (no account enumeration); emails a reset link for an active account.',
  })
  @ApiOkResponse({ type: SuccessResponse })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.passwordReset.forgot(dto.email);
    return { success: true };
  }

  @Public()
  @CsrfExempt()
  @Post('reset-password')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Set a new password from a reset/invite token',
    description: 'Public. Consumes the emailed token (single-use, expiring) and sets the new password (strength-checked). Invalid/expired → 422.',
  })
  @ApiOkResponse({ type: SuccessResponse })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordReset.reset(dto.token, dto.new_password);
    return { success: true };
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out',
    description: 'Requires authentication. Revokes this device’s refresh session and clears the cookies.',
  })
  @ApiOkResponse({ type: SuccessResponse })
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(user);
    clearAuthCookies(res, this.config);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current user + effective permissions',
    description: 'Requires authentication. Returns the profile, roles, and union of permissions.',
  })
  @ApiOkResponse({ type: MeResponse })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }

  /** Turn a login/mfa outcome into the HTTP response: set session cookies, or hand back the MFA challenge. */
  private emit(outcome: LoginOutcome, res: Response): LoginResponse {
    if (outcome.kind === 'mfa_required') {
      return { mfa_required: true, mfa_token: outcome.mfa_token };
    }
    this.setSessionCookies(res, outcome.refresh_token, outcome.csrf_token);
    return {
      access_token: outcome.access_token,
      csrf_token: outcome.csrf_token,
      must_change_password: outcome.must_change_password,
      mfa_enrollment_required: outcome.mfa_enrollment_required,
    };
  }

  private setSessionCookies(res: Response, refreshToken: string, csrfToken: string): void {
    const maxAge = parseDurationMs(this.config.get<string>('JWT_REFRESH_TTL', '7d'), 7 * 86_400_000);
    setRefreshCookie(res, this.config, refreshToken, maxAge);
    setCsrfCookie(res, this.config, csrfToken, maxAge);
  }
}
