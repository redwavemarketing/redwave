/**
 * Create one or several expense ITEMS INTO a folder (report-as-folder, EXP-001). Each item's submitter is
 * the caller, status starts `draft` (the folder is submitted as a unit later), the rep is inherited from the
 * folder, and the pay period is DERIVED from each item's own `expense_date` (same-cycle payout, EXP-009).
 */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { ExpenseItemInput } from './expense-item.input';

export class CreateExpenseItemsDto {
  @ApiProperty({ description: 'The report folder these items belong to (EXP-001). The item inherits the folder’s rep.' })
  @IsUUID()
  expense_report_id!: string;

  @ApiProperty({ type: [ExpenseItemInput], description: 'One or more items to add to the folder.' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemInput)
  items!: ExpenseItemInput[];
}
