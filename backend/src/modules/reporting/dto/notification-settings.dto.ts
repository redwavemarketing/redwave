import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsString, MaxLength, ValidateNested } from 'class-validator';

/** One per-event channel setting (Super Admin only; NO per-user override). — RPT-009/010 */
export class EventSettingInput {
  @ApiProperty({ example: 'rate_change' })
  @IsString()
  @MaxLength(60)
  event_type!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  in_app_enabled!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  email_enabled!: boolean;
}

export class UpdateNotificationSettingsDto {
  @ApiProperty({ type: [EventSettingInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EventSettingInput)
  settings!: EventSettingInput[];
}
