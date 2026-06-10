import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationQuery } from '../../../common/pagination/pagination.query';

/** Filters for the Super-Admin audit view (on top of page/limit/sort/search). — arch §security (audit) */
export class AuditQueryDto extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Filter by acting user id.' })
  @IsOptional()
  @IsUUID()
  actor_id?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. pay_runs, clawbacks, security_settings).' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entity_type?: string;

  @ApiPropertyOptional({ description: 'Filter by a specific record id (powers the per-record History tab).' })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({ description: 'Filter by action (create / update / finalize / access_denied …).' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  action?: string;

  @ApiPropertyOptional({ description: 'Inclusive start date (YYYY-MM-DD).' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Inclusive end date (YYYY-MM-DD).' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
