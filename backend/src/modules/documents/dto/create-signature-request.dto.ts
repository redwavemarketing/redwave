import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Share a document + request a signature from one or many recipients. — SRS DOC-002
 * Sharing IS requesting a signature (the schema has no separate shares table); the recipients become
 * the document's "shared-with" set for visibility.
 */
export class CreateSignatureRequestDto {
  @ApiProperty({ type: [String], description: 'User ids to request a signature from (≥1).' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  recipient_user_ids!: string[];

  @ApiPropertyOptional({ example: 'Please review and sign by Friday.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Optional due date (record only).' })
  @IsOptional()
  @Matches(DATE, { message: 'due_date must be a YYYY-MM-DD date' })
  due_date?: string;
}
