/**
 * EquipmentController — /v1/equipment/{id}. Equipment state transition (assigned → returned /
 * withheld). — arch §6.2
 */
import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RepEquipmentService } from './rep-equipment.service';
import { UpdateRepEquipmentDto } from './dto/rep-equipment.dto';

@ApiTags('HRM / Reps')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipment: RepEquipmentService) {}

  @Patch(':id')
  @RequirePermission('hrm', 'edit')
  @ApiOperation({
    summary: 'Update equipment state',
    description: 'Requires hrm:edit. Transition to returned (sets returned_date) or withheld.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRepEquipmentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.equipment.update(id, dto, actorId);
  }
}
