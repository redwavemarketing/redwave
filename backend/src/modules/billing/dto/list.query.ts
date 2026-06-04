import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Filters for the statement / invoice history lists. — SRS BILL-005 */
export class ListBillingQuery {
  @ApiPropertyOptional({ description: 'Filter by client.' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Filter by pay period.' })
  @IsOptional()
  @IsUUID()
  pay_period_id?: string;
}
