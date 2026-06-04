/**
 * RepEquipmentService — equipment assigned to a rep with a deposit and a lifecycle state.
 * deposit_amount is exact Decimal (arrives as a decimal string — never float, #1). State moves
 * assigned → returned / withheld. — SRS HRM-006
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RepEquipment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateRepEquipmentDto, UpdateRepEquipmentDto } from './dto/rep-equipment.dto';

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const todayUtc = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};
const iso = (date: Date): string => date.toISOString().slice(0, 10);

@Injectable()
export class RepEquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(repId: string) {
    await this.assertRepExists(repId);
    return this.prisma.repEquipment.findMany({
      where: { rep_id: repId },
      orderBy: { assigned_date: 'desc' },
    });
  }

  async assign(repId: string, dto: CreateRepEquipmentDto, actorId: string) {
    await this.assertRepExists(repId);
    const equipment = await this.prisma.repEquipment.create({
      data: {
        rep_id: repId,
        equipment_type: dto.equipment_type,
        identifier: dto.identifier,
        deposit_amount: dto.deposit_amount, // decimal STRING → Prisma Decimal (exact; never float)
        assigned_date: dateOnly(dto.assigned_date),
        status: 'assigned',
        returned_date: null,
      },
    });
    await this.audit.log({
      actorId,
      entityType: 'rep_equipment',
      entityId: equipment.id,
      action: 'create',
      after: this.auditView(equipment),
    });
    return equipment;
  }

  async update(id: string, dto: UpdateRepEquipmentDto, actorId: string) {
    const before = await this.prisma.repEquipment.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('Equipment not found');
    }

    const data: Prisma.RepEquipmentUncheckedUpdateInput = {};
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.status === 'returned') {
      // Returning sets the returned date (provided, or default today).
      data.returned_date = dto.returned_date ? dateOnly(dto.returned_date) : todayUtc();
    } else if (dto.returned_date !== undefined) {
      data.returned_date = dto.returned_date ? dateOnly(dto.returned_date) : null;
    }

    const updated = await this.prisma.repEquipment.update({ where: { id }, data });
    await this.audit.log({
      actorId,
      entityType: 'rep_equipment',
      entityId: id,
      action: 'update',
      before: this.auditView(before),
      after: this.auditView(updated),
    });
    return updated;
  }

  /** JSON-primitive projection for the audit log (Decimal → string, dates → 'YYYY-MM-DD'). */
  private auditView(e: RepEquipment) {
    return {
      equipment_type: e.equipment_type,
      identifier: e.identifier,
      deposit_amount: e.deposit_amount.toString(),
      assigned_date: iso(e.assigned_date),
      returned_date: e.returned_date ? iso(e.returned_date) : null,
      status: e.status,
    };
  }

  private async assertRepExists(repId: string): Promise<void> {
    const rep = await this.prisma.rep.findUnique({ where: { id: repId }, select: { id: true } });
    if (!rep) {
      throw new NotFoundException('Rep not found');
    }
  }
}
