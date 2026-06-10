import { ApiProperty } from '@nestjs/swagger';
import { SignatureMethod } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Create a saved reusable signature (private + own-scoped). The image is uploaded as multipart; the
 * `label`/`method` come as form fields alongside it. — SRS §13 (saved signature)
 */
export class CreateUserSignatureDto {
  @ApiProperty({ example: 'My signature' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  @ApiProperty({ enum: SignatureMethod, description: 'How it was captured: drawn / typed / uploaded.' })
  @IsEnum(SignatureMethod)
  method!: SignatureMethod;
}
