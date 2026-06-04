import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class SaleItemInput {
  @ApiProperty({ description: 'A product belonging to the sale’s client (active).' })
  @IsUUID()
  product_id!: string;
}

export class CreateSaleDto {
  @ApiProperty({ description: 'The client (must be an existing active client).' })
  @IsUUID()
  client_id!: string;

  @ApiPropertyOptional({
    description: 'Rep the sale belongs to. Defaults to the caller’s own rep; scope-authorized.',
  })
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiPropertyOptional({
    example: '2026-01-10',
    description: 'YYYY-MM-DD. Defaults to today. GOVERNS the pay period.',
  })
  @IsOptional()
  @Matches(DATE, { message: 'sale_date must be a YYYY-MM-DD date' })
  sale_date?: string;

  @ApiPropertyOptional({
    example: '2026-01-15',
    description: 'YYYY-MM-DD. Reference only — drives no logic.',
  })
  @IsOptional()
  @Matches(DATE, { message: 'activation_date must be a YYYY-MM-DD date' })
  activation_date?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  customer_name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  province_state!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  postal_code!: string;

  @ApiPropertyOptional({
    description: 'Client house ID, where supplied (some clients do not provide one).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mpu_id?: string;

  @ApiPropertyOptional({
    description: 'Rep’s greenfield REQUEST at entry; an admin confirms/clears at validation.',
  })
  @IsOptional()
  @IsBoolean()
  is_greenfield?: boolean;

  @ApiProperty({ type: [SaleItemInput], description: 'One or more products on this sale.' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  items!: SaleItemInput[];
}
