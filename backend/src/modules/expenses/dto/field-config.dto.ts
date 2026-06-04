import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const KEY = /^[a-z][a-z0-9_]*$/;

/**
 * Create / configure an expense category in the catalogue. — SRS EXP-009
 * `requires_receipt` drives whether non-km items in this category must carry a receipt.
 * (Note: items are bound to the `ExpenseCategory` enum, so a new key beyond the 7 enum values is
 * catalogue-only until an enum migration adds it — flagged CLAUDE §12.)
 */
export class CreateFieldConfigDto {
  @ApiProperty({ example: 'parking', description: 'Snake_case category key (unique).' })
  @Matches(KEY, { message: 'category_key must be snake_case (lowercase letters, digits, underscores)' })
  @MaxLength(40)
  category_key!: string;

  @ApiProperty({ example: 'Parking' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  @ApiProperty({ example: true, description: 'Whether items in this category require a receipt.' })
  @IsBoolean()
  requires_receipt!: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
