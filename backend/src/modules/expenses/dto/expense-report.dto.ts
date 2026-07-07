/**
 * Report FOLDER request DTOs (report-as-folder, EXP-001). A rep creates + names a folder (default week =
 * the business week Mon–Sun, a label only) and adds items into it; the whole folder is submitted/reviewed
 * as a unit. The folder has no stored status — it's the derived aggregate of its items.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { PaginationQuery } from '../../../common/pagination/pagination.query';
import { ReviewDecision } from './review.dto';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateExpenseReportDto {
  @ApiProperty({ example: 'Week of 2026-07-06', description: 'The rep-given folder name (EXP-001a).' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '2026-07-06', description: 'Business-week start (Monday). A label only — items keep their own pay period.' })
  @Matches(DATE, { message: 'week_start must be a YYYY-MM-DD date' })
  week_start!: string;

  @ApiProperty({ example: '2026-07-12', description: 'Business-week end (Sunday).' })
  @Matches(DATE, { message: 'week_end must be a YYYY-MM-DD date' })
  week_end!: string;

  @ApiPropertyOptional({ description: 'Rep this folder is for; defaults to the submitter’s linked rep.' })
  @IsOptional()
  @IsUUID()
  rep_id?: string;
}

export class UpdateExpenseReportDto {
  @ApiPropertyOptional({ example: 'July field expenses' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '2026-07-06' })
  @IsOptional()
  @Matches(DATE, { message: 'week_start must be a YYYY-MM-DD date' })
  week_start?: string;

  @ApiPropertyOptional({ example: '2026-07-12' })
  @IsOptional()
  @Matches(DATE, { message: 'week_end must be a YYYY-MM-DD date' })
  week_end?: string;
}

/** Folder-level review = a bulk decision applied to the folder's reviewable (submitted|sent_back) items. */
export class ReviewReportDto {
  @ApiProperty({ enum: ReviewDecision, example: 'approve' })
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @ApiPropertyOptional({ description: 'Optional note recorded on each item.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** List/scope filters for the folder list (paginated + scoped). */
export class ListExpenseReportsQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Filter to a rep.' })
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiPropertyOptional({ description: "'true' → only folders with ≥1 item awaiting review (the approval queue)." })
  @IsOptional()
  @IsString()
  awaiting_review?: string;
}
