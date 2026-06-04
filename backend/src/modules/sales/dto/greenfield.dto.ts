import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Confirm or clear the greenfield flag (PROPOSED two-step, SRS §17.2). Recomputes counts_toward_tally
 * on the sale's internet items. Allowed only before the sale enters a pay run.
 */
export class SetGreenfieldDto {
  @ApiProperty({
    description: 'true = confirmed greenfield (internet excluded from tally); false = cleared.',
  })
  @IsBoolean()
  is_greenfield!: boolean;
}
