import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

/** Filters for the caller's own notification list. */
export class ListNotificationsQuery {
  @ApiPropertyOptional({ description: 'Filter by read/unread.' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  is_read?: boolean;
}
