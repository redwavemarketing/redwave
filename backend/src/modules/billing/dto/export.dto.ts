import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/**
 * Render a statement to a recorded export file. — SRS BILL-002 + QuickBooks export.
 * `excel` = the client statement workbook; `quickbooks` = a QuickBooks-mappable CSV (no tax, CAD).
 * (Invoice export is always PDF, so it needs no body.)
 */
export class StatementExportDto {
  @ApiProperty({ enum: ['excel', 'quickbooks'], example: 'excel' })
  @IsIn(['excel', 'quickbooks'])
  format!: 'excel' | 'quickbooks';
}
