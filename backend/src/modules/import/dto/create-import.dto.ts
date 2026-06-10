import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportSourceType, ImportType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/;

/**
 * Create a staged import batch from an uploaded file. — SRS §15 (IMP-003/011)
 * Multipart: the Excel/CSV `file` + these metadata form fields. The server parses, cleans, auto-maps
 * (or applies `field_mapping_id`), classifies, and stages — nothing touches live tables until commit.
 * `reconcile_total` is the OPERATOR-PROVIDED source total used to gate a balance migration (IMP-007).
 */
export class CreateImportDto {
  @ApiProperty({ enum: ImportSourceType, example: 'client_report' })
  @IsEnum(ImportSourceType)
  source_type!: ImportSourceType;

  @ApiProperty({ enum: ImportType, example: 'sales' })
  @IsEnum(ImportType)
  import_type!: ImportType;

  @ApiPropertyOptional({ description: 'Client scope (required for client_report).' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'A saved field mapping to apply (else the server auto-suggests one).' })
  @IsOptional()
  @IsUUID()
  field_mapping_id?: string;

  @ApiPropertyOptional({
    example: '48200.00',
    description: 'Operator-provided source total (required to commit a balance migration). Decimal string.',
  })
  @IsOptional()
  @Matches(MONEY, { message: 'reconcile_total must be a decimal string with up to 2 decimal places' })
  reconcile_total?: string;
}
