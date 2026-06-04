import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'General Manager' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Initial permission ids to grant.' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  permission_ids?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Rename the role. Built-in roles cannot be renamed.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class SetRolePermissionsDto {
  @ApiProperty({
    type: [String],
    description: 'The complete set of permission ids the role should hold.',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  permission_ids!: string[];
}
