import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, Matches } from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateFlatRateDto {
  @ApiProperty({
    enum: ProductType,
    description: 'Flat-rated product. internet is tiered (not allowed here).',
  })
  @IsEnum(ProductType)
  product_type!: ProductType;

  @ApiProperty({ example: '30.00', description: 'Exact decimal STRING — never a float.' })
  @Matches(MONEY, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount!: string;

  @ApiProperty({ example: '2026-07-01', description: 'YYYY-MM-DD; must be today or future.' })
  @Matches(DATE, { message: 'effective_from must be a YYYY-MM-DD date' })
  effective_from!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(DATE, { message: 'effective_to must be a YYYY-MM-DD date' })
  effective_to?: string;
}

export class ListFlatRatesQuery {
  @ApiPropertyOptional({ enum: ['past', 'current', 'pending', 'all'], default: 'all' })
  @IsOptional()
  @IsIn(['past', 'current', 'pending', 'all'])
  status?: 'past' | 'current' | 'pending' | 'all';
}
