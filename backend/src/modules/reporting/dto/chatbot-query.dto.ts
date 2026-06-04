import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** A natural-language question to the read-only chatbot. — SRS RPT-011 */
export class ChatbotQueryDto {
  @ApiProperty({ example: 'How many sales do I have this period?' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  prompt!: string;
}
