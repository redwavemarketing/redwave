import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class RoleMfaDto {
  @ApiProperty({ description: 'Role id.' })
  @IsUUID()
  role_id!: string;

  @ApiProperty({ description: 'Whether members of this role must use MFA when enforcement is on.' })
  @IsBoolean()
  mfa_required!: boolean;
}

export class UpdateSecuritySettingsDto {
  @ApiPropertyOptional({ description: 'Master switch — when true, roles flagged mfa_required force enrollment at login.' })
  @IsOptional()
  @IsBoolean()
  mfa_enforced?: boolean;

  @ApiPropertyOptional({ type: () => [RoleMfaDto], description: 'Per-role MFA-required flags to set.' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleMfaDto)
  role_mfa?: RoleMfaDto[];
}
