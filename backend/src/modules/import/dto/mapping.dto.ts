import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportSourceType } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Save a reusable column→field mapping for a client/source. — SRS §15 IMP-002 */
export class CreateMappingDto {
  @ApiProperty({ example: 'RF Now monthly report' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: ImportSourceType })
  @IsEnum(ImportSourceType)
  source_type!: ImportSourceType;

  @ApiPropertyOptional({ description: 'Optional client scope.' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: '`{ systemField: sourceColumn }`.',
    example: { mpu_id: 'MPU #' },
  })
  @IsObject()
  mapping_json!: Record<string, string>;
}

export class UpdateMappingDto {
  @ApiPropertyOptional({ example: 'RF Now monthly report' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @IsOptional()
  @IsObject()
  mapping_json?: Record<string, string>;
}

export class ListMappingsQuery {
  @ApiPropertyOptional({ enum: ImportSourceType })
  @IsOptional()
  @IsEnum(ImportSourceType)
  source_type?: ImportSourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  client_id?: string;
}
