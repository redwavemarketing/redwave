import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Validate an Entered sale (entered → validated). Validation is an approval gate and NEVER changes
 * the sale's pay period. The admin may optionally confirm/clear greenfield in the same action
 * (PROPOSED two-step, SRS §17.2). — SRS SALE-005/006
 */
export class ValidateSaleDto {
  @ApiPropertyOptional({
    description: 'Optional: confirm (true) or clear (false) greenfield while validating.',
  })
  @IsOptional()
  @IsBoolean()
  is_greenfield?: boolean;
}
