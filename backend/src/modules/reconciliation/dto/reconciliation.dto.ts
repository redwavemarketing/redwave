import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StatementReconciliationQuery {
  @ApiProperty()
  @IsUUID()
  client_id!: string;

  @ApiProperty()
  @IsUUID()
  pay_period_id!: string;
}
