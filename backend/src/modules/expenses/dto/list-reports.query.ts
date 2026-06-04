import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseReportStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Filters for the expense-report list. Results are always scope-restricted in the query (§5). */
export class ListReportsQuery {
  @ApiPropertyOptional({ enum: ExpenseReportStatus })
  @IsOptional()
  @IsEnum(ExpenseReportStatus)
  status?: ExpenseReportStatus;

  @ApiPropertyOptional({ description: 'Filter by rep.' })
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiPropertyOptional({ description: 'Filter by a client tagged on any item.' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Filter by pay period.' })
  @IsOptional()
  @IsUUID()
  pay_period_id?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'Reports whose week_start ≥ this date.' })
  @IsOptional()
  @Matches(DATE, { message: 'from must be a YYYY-MM-DD date' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'Reports whose week_start ≤ this date.' })
  @IsOptional()
  @Matches(DATE, { message: 'to must be a YYYY-MM-DD date' })
  to?: string;
}
