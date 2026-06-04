import { ApiPropertyOptional } from '@nestjs/swagger';
import { ImportBatchStatus, ImportSourceType, ImportType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

/** Filters for the import/migration history list. — SRS §15 (IMP-009) */
export class ListImportsQuery {
  @ApiPropertyOptional({ enum: ImportBatchStatus })
  @IsOptional()
  @IsEnum(ImportBatchStatus)
  status?: ImportBatchStatus;

  @ApiPropertyOptional({ enum: ImportSourceType })
  @IsOptional()
  @IsEnum(ImportSourceType)
  source_type?: ImportSourceType;

  @ApiPropertyOptional({ enum: ImportType })
  @IsOptional()
  @IsEnum(ImportType)
  import_type?: ImportType;
}
