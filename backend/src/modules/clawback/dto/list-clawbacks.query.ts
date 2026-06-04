import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClawbackStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListClawbacksQuery {
  @ApiPropertyOptional({ enum: ClawbackStatus })
  @IsOptional()
  @IsEnum(ClawbackStatus)
  status?: ClawbackStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rep_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sale_id?: string;
}
