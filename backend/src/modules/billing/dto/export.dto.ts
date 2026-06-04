import { ApiProperty } from '@nestjs/swagger';
import { ExportFormat } from '@prisma/client';
import { IsEnum } from 'class-validator';

/**
 * Render a statement/invoice to a file. — SRS BILL-002/003
 * Generation is stubbed (the `file_url` reference is updated); the real PDF/Excel render is deferred
 * (CLAUDE §12), like the HRM/Expenses exports.
 */
export class BillingExportDto {
  @ApiProperty({ enum: ExportFormat, example: 'excel' })
  @IsEnum(ExportFormat)
  format!: ExportFormat;
}
