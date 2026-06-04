import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Upload a document. — SRS DOC-001
 * The binary upload is STUBBED (the service mints a `original_file_url` reference); the real
 * object-storage upload is deferred (CLAUDE §12), like HRM/Expenses/Billing.
 */
export class CreateDocumentDto {
  @ApiProperty({ example: 'Compensation Agreement 2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: DocumentType, example: 'compensation_agreement' })
  @IsEnum(DocumentType)
  doc_type!: DocumentType;
}
