import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExportFormat } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

/**
 * Request an expense export. — SRS EXP-010
 * Produces a stored {@link ExpenseExport} record with a (currently stubbed) `file_url`; the real
 * PDF/Excel generation is deferred (CLAUDE §12), like the HRM document upload.
 */
export class CreateExportDto {
  @ApiProperty({ enum: ExportFormat, example: 'excel' })
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @ApiPropertyOptional({ description: 'Restrict to one client.' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Restrict to one pay period.' })
  @IsOptional()
  @IsUUID()
  pay_period_id?: string;
}
