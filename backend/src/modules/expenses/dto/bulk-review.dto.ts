/**
 * Bulk approve / reject / send-back of expense ITEMS. — SRS EXP-006
 * Each id is reviewed independently with the same decision + note; non-pending items are skipped.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ReviewDecision } from './review.dto';

export class BulkReviewDto {
  @ApiProperty({ type: [String], description: 'Expense-item ids to review together.' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids!: string[];

  @ApiProperty({ enum: ReviewDecision })
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @ApiPropertyOptional({ description: 'Optional note (reason for rejection / send-back).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
