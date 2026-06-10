import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Self-service forgot-password — always returns success (no account enumeration). — AUTH-002 */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'jane@redwave.local' })
  @IsEmail()
  email!: string;
}

/** Consume a reset/invite token + set a new password (strength-checked server-side). */
export class ResetPasswordDto {
  @ApiProperty({ description: 'The token from the emailed link.' })
  @IsString()
  @MinLength(1)
  token!: string;

  @ApiProperty({ writeOnly: true, minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  new_password!: string;
}
