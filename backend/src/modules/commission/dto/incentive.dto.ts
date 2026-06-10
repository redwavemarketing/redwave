import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncentiveStatus, IncentiveTargetType } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateIncentiveDto {
  @ApiProperty({ example: 'July VF Internet Spiff' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ description: 'Scope to a client; omit/null = all clients.' })
  @IsOptional()
  @IsUUID()
  scope_client_id?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'tv',
    description: 'Scope to a product-type catalogue key; omit/null = all.',
  })
  @IsOptional()
  @IsString()
  scope_product_type?: string;

  @ApiProperty({
    enum: IncentiveTargetType,
    description:
      'per_activation — bonus on each matching activation BEYOND target_count (null/0 = every activation). ' +
      'one_time — a single bonus once the rep reaches target_count matching activations (requires target_count).',
  })
  @IsEnum(IncentiveTargetType)
  target_type!: IncentiveTargetType;

  @ApiPropertyOptional({
    example: 5,
    description: 'The threshold. per_activation: pay beyond it (optional). one_time: reach it (required).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  target_count?: number;

  @ApiProperty({ example: '2026-07-01', description: 'YYYY-MM-DD inclusive.' })
  @Matches(DATE, { message: 'window_start must be a YYYY-MM-DD date' })
  window_start!: string;

  @ApiProperty({ example: '2026-07-31', description: 'YYYY-MM-DD inclusive.' })
  @Matches(DATE, { message: 'window_end must be a YYYY-MM-DD date' })
  window_end!: string;

  @ApiProperty({ example: '20.00', description: 'Per-activation bonus — exact decimal STRING.' })
  @Matches(MONEY, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount!: string;
}

export class UpdateIncentiveDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: '25.00' })
  @IsOptional()
  @Matches(MONEY, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount?: string;

  @ApiPropertyOptional({ enum: IncentiveStatus, description: 'Set ended to retire the incentive.' })
  @IsOptional()
  @IsEnum(IncentiveStatus)
  status?: IncentiveStatus;
}

export class ListIncentivesQuery {
  @ApiPropertyOptional({ enum: ['active', 'ended', 'all'], default: 'all' })
  @IsOptional()
  @IsIn(['active', 'ended', 'all'])
  status?: 'active' | 'ended' | 'all';
}
