import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

/** Re-apply a `{ systemField: sourceColumn }` mapping to a staged batch's raw rows. — SRS §15 IMP-002 */
export class RemapDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'The `{ systemField: sourceColumn }` mapping to apply.',
    example: { mpu_id: 'MPU #', sale_date: 'Sale Date' },
  })
  @IsObject()
  mapping_json!: Record<string, string>;
}
