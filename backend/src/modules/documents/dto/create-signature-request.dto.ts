import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignatureFieldType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** One signature field placed on the PDF (where/what a recipient signs). Coordinates are normalized
 *  fractions 0..1 of the page (top-left origin). — SRS DOC-003 */
export class SignatureFieldInput {
  @ApiProperty({ enum: SignatureFieldType, example: 'signature' })
  @IsEnum(SignatureFieldType)
  type!: SignatureFieldType;

  @ApiProperty({ description: 'Which recipient must fill this field (∈ recipient_user_ids).' })
  @IsUUID('4')
  recipient_user_id!: string;

  @ApiProperty({ example: 0, description: '0-based page index.' })
  @IsInt()
  @Min(0)
  page!: number;

  @ApiProperty({ example: 0.1, description: 'Left, fraction of page width (0..1).' })
  @IsNumber()
  @Min(0)
  @Max(1)
  x!: number;

  @ApiProperty({ example: 0.8, description: 'Top, fraction of page height (0..1).' })
  @IsNumber()
  @Min(0)
  @Max(1)
  y!: number;

  @ApiProperty({ example: 0.25, description: 'Width fraction (0..1).' })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  w!: number;

  @ApiProperty({ example: 0.06, description: 'Height fraction (0..1).' })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  h!: number;
}

/**
 * Share a document + request a signature from one or many recipients, optionally placing signature
 * fields. — SRS DOC-002/003. Sharing IS requesting a signature (no separate shares table); the recipients
 * become the document's "shared-with" set for visibility. No fields → a single click-to-sign (as before).
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

  @ApiPropertyOptional({ type: [SignatureFieldInput], description: 'Where/what each recipient signs.' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SignatureFieldInput)
  fields?: SignatureFieldInput[];
}
