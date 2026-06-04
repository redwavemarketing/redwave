import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReviewDecision {
  approve = 'approve',
  reject = 'reject',
  send_back = 'send_back',
}

/**
 * Approver's decision on a submitted report. — SRS EXP-006
 * `approve` → status `approved` (sets approved_by/at; enters the pay-run net for its period).
 * `reject` / `send_back` → returned for correction (editable again).
 */
export class ReviewDto {
  @ApiProperty({ enum: ReviewDecision })
  @IsEnum(ReviewDecision)
  decision!: ReviewDecision;

  @ApiPropertyOptional({ description: 'Optional note (reason for rejection / send-back).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
