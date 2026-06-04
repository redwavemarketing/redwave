import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus, DocumentType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

/** Filters for the document list. Results are always visibility-scoped in the query (§5). */
export class ListDocumentsQuery {
  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  doc_type?: DocumentType;
}
