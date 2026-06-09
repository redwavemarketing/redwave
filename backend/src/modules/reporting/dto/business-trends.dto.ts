import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Cross-period trends query (Super Admin). Bounded to the last N pay periods. */
export class BusinessTrendsQuery {
  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 24, description: 'How many recent pay periods to return.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  periods?: number = 6;
}
