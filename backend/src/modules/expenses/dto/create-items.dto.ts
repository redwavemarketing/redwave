/**
 * Create one or several expense ITEMS in one call (item-first; no report wrapper required). — SRS §11
 * Each item's submitter is the caller, status starts `submitted`, rep defaults to the caller's linked
 * rep, and the pay period is DERIVED from each item's own `expense_date` (same-cycle payout, EXP-009).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { ExpenseItemInput } from './expense-item.input';

export class CreateExpenseItemsDto {
  @ApiPropertyOptional({
    description: 'Rep these items are for; defaults to the submitter’s linked rep.',
  })
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiProperty({ type: [ExpenseItemInput], description: 'One or more items to submit together.' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemInput)
  items!: ExpenseItemInput[];
}
