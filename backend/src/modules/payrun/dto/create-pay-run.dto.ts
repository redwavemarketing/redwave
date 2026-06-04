import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePayRunDto {
  @ApiProperty({ description: 'The pay period to run (must be pre-loaded).' })
  @IsUUID()
  pay_period_id!: string;
}
