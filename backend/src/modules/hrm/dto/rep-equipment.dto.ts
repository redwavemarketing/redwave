import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/; // exact decimal STRING (≤2 dp) — never a float (#1)
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateRepEquipmentDto {
  @ApiProperty({ example: 'iPad' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  equipment_type!: string;

  @ApiProperty({ example: 'SN-12345', description: 'Serial / asset tag.' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  identifier!: string;

  @ApiProperty({
    example: '250.00',
    description: 'Deposit held — exact decimal STRING, never a float.',
  })
  @IsString()
  @Matches(MONEY, {
    message: 'deposit_amount must be a decimal string with up to 2 decimal places',
  })
  deposit_amount!: string;

  @ApiProperty({ example: '2026-01-15', description: 'YYYY-MM-DD.' })
  @Matches(DATE, { message: 'assigned_date must be a YYYY-MM-DD date' })
  assigned_date!: string;
}

export class UpdateRepEquipmentDto {
  @ApiPropertyOptional({ enum: EquipmentStatus, description: 'assigned → returned / withheld.' })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiPropertyOptional({
    example: '2026-06-30',
    description: 'Defaults to today when status=returned.',
  })
  @IsOptional()
  @Matches(DATE, { message: 'returned_date must be a YYYY-MM-DD date' })
  returned_date?: string;
}
