import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum SignDecision {
  sign = 'sign',
  decline = 'decline',
}

/**
 * A recipient signs or declines their signature on a request. — SRS DOC-003
 * The actual e-signature PROVIDER is STUBBED; we record the signature event (status, method, IP,
 * timestamp) so a real provider can plug in later (CLAUDE §12).
 */
export class SignDto {
  @ApiProperty({ enum: SignDecision })
  @IsEnum(SignDecision)
  decision!: SignDecision;

  @ApiPropertyOptional({ example: 'typed', description: 'Signature method (typed / drawn / …).' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  method?: string;
}
