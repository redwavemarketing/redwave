import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Set/replace a rep's activation target for a pay period (count goal — not money). */
export class SetSalesTargetDto {
  @ApiProperty({ description: 'The rep this target applies to.' })
  @IsUUID()
  rep_id!: string;

  @ApiProperty({ description: 'The pay period the target covers (stored as the period’s date range).' })
  @IsUUID()
  pay_period_id!: string;

  @ApiProperty({ example: 20, description: 'Target internet activations for the period.' })
  @IsInt()
  @Min(0)
  target_count!: number;
}

export class ListSalesTargetsQuery {
  @ApiPropertyOptional({ description: 'Restrict to one pay period.' })
  @IsOptional()
  @IsUUID()
  pay_period_id?: string;
}

export class SalesTargetResponse {
  @ApiProperty() id!: string;
  @ApiProperty({ type: String, nullable: true }) rep_id!: string | null;
  @ApiProperty({ example: 20 }) target_count!: number;
  @ApiProperty({ type: String, format: 'date-time' }) period_start!: string;
  @ApiProperty({ type: String, format: 'date-time' }) period_end!: string;
}
