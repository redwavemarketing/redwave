import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * A rep document is uploaded as multipart (the file) + metadata. The file is stored to object storage
 * (the row keeps the object PATH, served via /file-url); sensitive file refs are gated on hrm:edit. — arch §11
 */
export class CreateRepDocumentDto {
  @ApiProperty({ example: 'contract', description: 'e.g. contract, id, equipment_agreement.' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  doc_type!: string;
}
