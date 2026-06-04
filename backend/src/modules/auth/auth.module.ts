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
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    // Order matters: authenticate before authorizing.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [TokenService],
})
export class AuthModule {}
