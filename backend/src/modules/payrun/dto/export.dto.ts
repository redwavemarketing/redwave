import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

/** Configurable ADP export (no fixed external format imposed). — SRS PAY-010 */
export class ExportPayRunDto {
  @ApiPropertyOptional({ enum: ['csv', 'json'], default: 'csv', description: 'Export format.' })
  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json';
}
