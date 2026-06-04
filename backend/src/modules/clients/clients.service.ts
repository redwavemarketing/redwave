/**
 * ClientsService — program-partner CRUD with soft-deactivate. — SRS CLNT-001/006
 * Reuses the Auth patterns: PrismaService + explicit AuditService logging on mutations.
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateClientDto, ListClientsQuery, UpdateClientDto } from './dto/client.dto';

/** Build the is_active filter for list endpoints (default: active only). */
export function activeStatusWhere(status: 'active' | 'inactive' | 'all' | undefined): {
  is_active?: boolean;
} {
  if (status === 'all') {
    return {};
  }
  return { is_active: status === 'inactive' ? false : true };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(query: ListClientsQuery) {
    return this.prisma.client.findMany({
      where: activeStatusWhere(query.status),
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async create(dto: CreateClientDto, actorId: string) {
    try {
      const client = await this.prisma.client.create({
        data: {
          client_code: dto.client_code,
          name: dto.name,
          market: dto.market,
          supplies_mpu_id: dto.supplies_mpu_id,
          is_active: true,
        },
      });
      await this.audit.log({
        actorId,
        entityType: 'clients',
        entityId: client.id,
        action: 'create',
        after: { client_code: client.client_code, name: client.name, market: client.market },
      });
      return client;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('client_code already exists'); // never reused — CLNT-001
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateClientDto, actorId: string) {
    const before = await this.findOne(id);
    try {
      const updated = await this.prisma.client.update({
        where: { id },
        data: {
          client_code: dto.client_code,
          name: dto.name,
          market: dto.market,
          supplies_mpu_id: dto.supplies_mpu_id,
          is_active: dto.is_active,
        },
      });
      await this.audit.log({
        actorId,
        entityType: 'clients',
        entityId: id,
        // Deactivation is a soft status change — the row is preserved (CLNT-006).
        action: dto.is_active === false && before.is_active ? 'deactivate' : 'update',
        before,
        after: updated,
      });
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('client_code already exists');
      }
      throw error;
    }
  }
}
