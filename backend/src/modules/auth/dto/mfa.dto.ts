import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MfaVerifyDto {
  @ApiProperty({ description: 'The mfa_token returned by /auth/login when mfa_required is true.' })
  @IsString()
  @IsNotEmpty()
  mfa_token!: string;

  @ApiProperty({ description: 'A 6-digit TOTP code from the authenticator app, or a recovery code.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;
}

export class MfaCodeDto {
  @ApiProperty({ description: 'A 6-digit TOTP code (or a recovery code where allowed).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;
}
