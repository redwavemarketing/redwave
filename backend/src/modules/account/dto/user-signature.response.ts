import { ApiProperty } from '@nestjs/swagger';
import { SignatureMethod } from '@prisma/client';

/** A saved reusable signature (the private file_path is NOT exposed — bytes come via /file-url). */
export class UserSignatureResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'My signature' })
  label!: string;

  @ApiProperty({ enum: SignatureMethod })
  method!: SignatureMethod;

  @ApiProperty()
  is_default!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at!: string;
}
