import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Generate a client statement / commission invoice for a client + pay period. — SRS BILL-002
 * The client id comes from the route (`/v1/clients/{id}/...`); the body carries the period.
 */
export class GenerateBillingDto {
  @ApiProperty({ description: 'The pay period to bill (governs which sales by sale_date, #7).' })
  @IsUUID()
  pay_period_id!: string;
}
