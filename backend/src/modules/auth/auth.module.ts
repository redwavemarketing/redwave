/**
 * AuthModule — authentication + the global RBAC guards.
 *
 * Registers the two global guards in order: JwtAuthGuard (authenticate) THEN PermissionsGuard
 * (authorize). Because they are APP_GUARD providers they apply to every route in every module.
 * TokenService is exported for any module that needs to mint tokens. — arch §7, SRS AUTH-006
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CsrfGuard } from '../../common/security/csrf.guard';
import { AuthController } from './auth.controller';
import { MfaController } from './mfa.controller';
import { SessionsController } from './sessions.controller';
import { SecuritySettingsController } from './security-settings.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { RefreshSessionService } from './refresh-session.service';
import { MfaService } from './mfa.service';
import { SecuritySettingsService } from './security-settings.service';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, MfaController, SessionsController, SecuritySettingsController],
  providers: [
    AuthService,
    TokenService,
    RefreshSessionService,
    MfaService,
    SecuritySettingsService,
    PasswordResetService,
    // Order matters: authenticate, then authorize, then CSRF-check mutating requests.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [TokenService, RefreshSessionService, MfaService, PasswordResetService],
})
export class AuthModule {}
