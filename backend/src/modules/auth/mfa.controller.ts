/**
 * MfaController — /v1/auth/mfa: self-service TOTP enrollment + management.
 *
 * Authenticated, own-scoped (no module permission — a user manages their OWN MFA). setup → enable (returns
 * recovery codes once) → optional disable. The login challenge itself is at /auth/mfa/verify (public).
 * — AUTH MFA
 */
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { SuccessResponse } from '../../common/dto/success.response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { MfaService } from './mfa.service';
import { MfaCodeDto } from './dto/mfa.dto';
import { MfaRecoveryCodesResponse, MfaSetupResponse, MfaStatusResponse } from './dto/mfa.response';

@ApiTags('Auth')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfa: MfaService) {}

  @Get('status')
  @ApiOperation({ summary: 'Whether the caller has MFA enabled' })
  @ApiOkResponse({ type: MfaStatusResponse })
  status(@CurrentUser('id') userId: string): Promise<MfaStatusResponse> {
    return this.mfa.status(userId);
  }

  @Post('setup')
  @HttpCode(200)
  @ApiOperation({ summary: 'Begin enrollment — returns the otpauth URL + QR (unconfirmed until /enable).' })
  @ApiOkResponse({ type: MfaSetupResponse })
  setup(@CurrentUser() user: AuthUser): Promise<MfaSetupResponse> {
    return this.mfa.setup(user.id, user.email);
  }

  @Post('enable')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirm enrollment with a first code → enable + return recovery codes (once).' })
  @ApiOkResponse({ type: MfaRecoveryCodesResponse })
  enable(@CurrentUser('id') userId: string, @Body() dto: MfaCodeDto): Promise<MfaRecoveryCodesResponse> {
    return this.mfa.enable(userId, dto.code);
  }

  @Post('disable')
  @HttpCode(200)
  @ApiOperation({ summary: 'Disable MFA (requires a current TOTP or recovery code).' })
  @ApiOkResponse({ type: SuccessResponse })
  async disable(@CurrentUser('id') userId: string, @Body() dto: MfaCodeDto): Promise<SuccessResponse> {
    await this.mfa.disable(userId, dto.code);
    return { success: true };
  }
}
