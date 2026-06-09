import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { RepsController } from './reps.controller';
import { EquipmentController } from './equipment.controller';
import { RepsService } from './reps.service';
import { RepDocumentsService } from './rep-documents.service';
import { RepEquipmentService } from './rep-equipment.service';

@Module({
  imports: [StorageModule],
  controllers: [RepsController, EquipmentController],
  providers: [RepsService, RepDocumentsService, RepEquipmentService],
  exports: [RepsService, RepDocumentsService, RepEquipmentService],
})
export class HrmModule {}
