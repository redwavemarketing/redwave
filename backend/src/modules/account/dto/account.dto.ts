import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ThemePreference } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ writeOnly: true })
  @IsString()
  @MinLength(1)
  current_password!: string;

  @ApiProperty({ writeOnly: true, minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  new_password!: string;
}

export class SetThemeDto {
  @ApiProperty({
    enum: ThemePreference,
    description: 'Applies immediately — no review (AUTH-010).',
  })
  @IsEnum(ThemePreference)
  theme_preference!: ThemePreference;
}

/** A request to change profile HR fields. At least one field is required (validated in the service). */
export class ProfileChangeRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  avatar_url?: string;
}
