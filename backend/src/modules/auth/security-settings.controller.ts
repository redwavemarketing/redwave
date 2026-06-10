/**
 * SecuritySettingsController — /v1/security-settings: the SA's MFA-enforcement policy.
 *
 * Read = `settings:view`, write = `settings:edit` (Super Admin). Sets the master `mfa_enforced` switch and
 * per-role `mfa_required` flags. — AUTH MFA, arch §security
 */
import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SecuritySettingsService } from './security-settings.service';
import { UpdateSecuritySettingsDto } from './dto/security-settings.dto';
import { SecuritySettingsResponse } from './dto/security-settings.response';

@ApiTags('Security Settings')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('security-settings')
export class SecuritySettingsController {
  constructor(private readonly settings: SecuritySettingsService) {}

  @Get()
  @RequirePermission('settings', 'view')
  @ApiOperation({ summary: 'Read the MFA-enforcement policy + per-role flags' })
  @ApiOkResponse({ type: SecuritySettingsResponse })
  get(): Promise<SecuritySettingsResponse> {
    return this.settings.get();
  }

  @Patch()
  @RequirePermission('settings', 'edit')
  @ApiOperation({ summary: 'Update the MFA-enforcement switch and/or per-role mfa_required flags' })
  @ApiOkResponse({ type: SecuritySettingsResponse })
  update(@Body() dto: UpdateSecuritySettingsDto, @CurrentUser('id') actorId: string): Promise<SecuritySettingsResponse> {
    return this.settings.update(dto, actorId);
  }
}
