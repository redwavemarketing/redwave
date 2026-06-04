import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * A rep document is stored as an object-storage REFERENCE (file_url) + metadata (arch §11).
 * The actual multipart upload → S3 is stubbed/deferred; callers pass an already-stored reference.
 */
export class CreateRepDocumentDto {
  @ApiProperty({ example: 'contract', description: 'e.g. contract, id, equipment_agreement.' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  doc_type!: string;

  @ApiProperty({ description: 'Object-storage reference (URL/key) of the stored file.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  file_url!: string;
}
