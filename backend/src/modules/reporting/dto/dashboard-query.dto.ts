import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Business-dashboard filters (RPT-005). Super Admin only; applied as `sale_date` bounds server-side. */
export class DashboardQuery {
  @ApiPropertyOptional({ description: 'Restrict to one pay period.' })
  @IsOptional()
  @IsUUID()
  pay_period_id?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @Matches(DATE, { message: 'date_from must be a YYYY-MM-DD date' })
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @Matches(DATE, { message: 'date_to must be a YYYY-MM-DD date' })
  date_to?: string;
}
