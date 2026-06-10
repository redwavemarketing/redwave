/**
 * SessionsController — /v1/auth/sessions: a user sees and revokes their OWN active devices.
 *
 * Authenticated, own-scoped (no module permission — these are the caller's sessions). Revoking a session
 * takes effect immediately (the guard rejects any access token whose `sid` is revoked). SA force-logout of
 * ANOTHER user lives in the Users module (`users:edit`). — AUTH MFA / sessions, arch §security
 */
import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponses } from '../../common/errors/api-error-responses.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { RefreshSessionService } from './refresh-session.service';
import { SessionResponse } from './dto/session.response';

@ApiTags('Auth')
@ApiBearerAuth()
@ApiErrorResponses()
@Controller('auth/sessions')
export class SessionsController {
  constructor(private readonly sessions: RefreshSessionService) {}

  @Get()
  @ApiOperation({ summary: "List the caller's active sessions (devices)" })
  @ApiOkResponse({ type: SessionResponse, isArray: true })
  list(@CurrentUser() user: AuthUser) {
    return this.sessions.listForUser(user.id, user.sid);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke one of the caller’s sessions (immediate logout of that device)' })
  @ApiNoContentResponse()
  async revoke(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string): Promise<void> {
    await this.sessions.revoke(id, userId);
  }
}
