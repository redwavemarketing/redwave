import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const MONEY = /^\d+(\.\d{1,2})?$/;

/** Ad-hoc Super Admin bonus on a draft pay-run line. — SRS PAY-006 */
export class SetBonusDto {
  @ApiProperty({
    example: '50.00',
    description: 'Bonus amount — exact decimal STRING, never a float.',
  })
  @IsString()
  @Matches(MONEY, { message: 'amount must be a decimal string with up to 2 decimal places' })
  amount!: string;

  @ApiPropertyOptional({ description: 'Reason / note for the bonus.' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
