import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Enter a clawback against a PAID sale_item (one with a frozen snapshot). — SRS CLAW-001/002
 * The amount defaults to the exact amount originally paid (rate + incentive) from the snapshot;
 * `reported_date` is stored for the record only and drives NO logic (no 30/60-day math — #6).
 */
export class CreateClawbackDto {
  @ApiProperty({ description: 'The cancelled, already-paid sale_item to claw back.' })
  @IsUUID()
  sale_item_id!: string;

  @ApiProperty({ example: 'Customer cancelled within contract window.' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  reason!: string;

  @ApiProperty({
    example: '2026-03-15',
    description: 'Client-reported cancellation date (record only; drives no logic).',
  })
  @Matches(DATE, { message: 'reported_date must be a YYYY-MM-DD date' })
  reported_date!: string;

  @ApiPropertyOptional({
    example: '30.00',
    description:
      'Override the snapshot-derived amount (editable with permission). Decimal string, never float.',
  })
  @IsOptional()
  @IsString()
  @Matches(MONEY, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount?: string;
}
