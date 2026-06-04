import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, Matches, ValidateNested } from 'class-validator';
import { ExpenseItemInput } from './create-report.dto';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Edit an existing report. — SRS EXP-006/007
 * Items, when supplied, REPLACE the report's lines wholesale (km logs/stops re-derived). Who may
 * edit is gated in the service: pre-approval requires `expenses:edit`; after approval only a
 * Super Admin may edit.
 */
export class UpdateReportDto {
  @ApiPropertyOptional({ example: '2026-03-09' })
  @IsOptional()
  @Matches(DATE, { message: 'week_start must be a YYYY-MM-DD date' })
  week_start?: string;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @IsOptional()
  @Matches(DATE, { message: 'week_end must be a YYYY-MM-DD date' })
  week_end?: string;

  @ApiPropertyOptional({ type: [ExpenseItemInput], description: 'Replaces all lines when provided.' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemInput)
  items?: ExpenseItemInput[];
}
