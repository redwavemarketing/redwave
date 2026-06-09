/**
 * IncentiveService — incentive/spiff CRUD. `per_activation` is fully supported (the engine computes
 * it). `target_based` is MODELED but DEFERRED (CLAUDE §12): it can be created/stored, but the engine
 * does not yet apply it — pending Redwave confirmation of its exact rule. — SRS COMM-005
 */
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { dateOnly } from '../../common/effective-dating';
import { CreateIncentiveDto, ListIncentivesQuery, UpdateIncentiveDto } from './dto/incentive.dto';

@Injectable()
export class IncentiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(query: ListIncentivesQuery) {
    const where = query.status && query.status !== 'all' ? { status: query.status } : {};
    return this.prisma.incentive.findMany({ where, orderBy: { window_start: 'desc' } });
  }

  async create(dto: CreateIncentiveDto, actorId: string) {
    // target_based is deferred but still modeled; it requires a target_count to be meaningful.
    if (
      dto.target_type === 'target_based' &&
      (dto.target_count === undefined || dto.target_count === null)
    ) {
      throw new UnprocessableEntityException('target_based incentives require target_count');
    }
    if (dateOnly(dto.window_end).getTime() < dateOnly(dto.window_start).getTime()) {
      throw new UnprocessableEntityException('window_end cannot be before window_start');
    }
    if (dto.scope_client_id) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.scope_client_id },
        select: { id: true },
      });
      if (!client) {
        throw new UnprocessableEntityException('scope_client_id does not exist');
      }
    }

    const created = await this.prisma.incentive.create({
      data: {
        name: dto.name,
        scope_client_id: dto.scope_client_id ?? null,
        scope_product_type: dto.scope_product_type ?? null,
        target_type: dto.target_type,
        target_count: dto.target_count ?? null,
        window_start: dateOnly(dto.window_start),
        window_end: dateOnly(dto.window_end),
        amount: dto.amount, // decimal STRING → Prisma Decimal
        status: 'active',
        created_by: actorId,
      },
    });
    await this.audit.log({
      actorId,
      entityType: 'incentives',
      entityId: created.id,
      action: 'create',
      after: {
        name: created.name,
        target_type: created.target_type,
        amount: dto.amount,
        // Flag so it's clear in the trail that a target_based incentive is not engine-applied yet.
        engine_deferred: created.target_type === 'target_based',
      },
    });
    return created;
  }

  async update(id: string, dto: UpdateIncentiveDto, actorId: string) {
    const before = await this.prisma.incentive.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('Incentive not found');
    }
    const updated = await this.prisma.incentive.update({
      where: { id },
      data: { name: dto.name, amount: dto.amount, status: dto.status },
    });
    await this.audit.log({
      actorId,
      entityType: 'incentives',
      entityId: id,
      action: dto.status === 'ended' && before.status !== 'ended' ? 'end' : 'update',
      before: { name: before.name, amount: before.amount.toString(), status: before.status },
      after: { name: updated.name, amount: updated.amount.toString(), status: updated.status },
    });
    return updated;
  }

  /** Delete an incentive that was NEVER applied (no sale_item references it). A referenced incentive is part
   *  of a frozen pay snapshot — end it instead (status). — #2 */
  async remove(id: string, actorId: string) {
    const incentive = await this.prisma.incentive.findUnique({ where: { id } });
    if (!incentive) {
      throw new NotFoundException('Incentive not found');
    }
    const referenced = await this.prisma.saleItem.count({ where: { incentive_id: id } });
    if (referenced > 0) {
      throw new UnprocessableEntityException('This incentive has been applied to paid items — end it instead of deleting');
    }
    await this.prisma.incentive.delete({ where: { id } });
    await this.audit.log({
      actorId,
      entityType: 'incentives',
      entityId: id,
      action: 'delete',
      before: { name: incentive.name, status: incentive.status },
    });
  }
}
