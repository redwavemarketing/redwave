import { ApiPropertyOptional } from '@nestjs/swagger';
import { HoldbackReleaseStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListHoldbackQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiPropertyOptional({ enum: HoldbackReleaseStatus })
  @IsOptional()
  @IsEnum(HoldbackReleaseStatus)
  status?: HoldbackReleaseStatus;
}
