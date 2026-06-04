import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

/**
 * Batch-validate the selected sales from the validation queue (queue bulk-select — NOT a file
 * upload). Client-report file ingestion + MPU matching belongs to the Import module, which will
 * drive the same validate logic. — SRS SALE-007 (queue portion)
 */
export class BulkValidateDto {
  @ApiProperty({
    type: [String],
    description: 'Sale ids to validate. Non-entered sales are reported, not thrown.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  sale_ids!: string[];
}
