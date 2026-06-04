/**
 * ProductsService — per-client products with soft-deactivate. No global catalogue: a product
 * always belongs to a client. product_type is immutable after creation. — SRS CLNT-002/006
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateProductDto, ListProductsQuery, UpdateProductDto } from './dto/product.dto';
import { activeStatusWhere } from './clients.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAllForClient(clientId: string, query: ListProductsQuery) {
    await this.assertClientExists(clientId);
    return this.prisma.product.findMany({
      where: { client_id: clientId, ...activeStatusWhere(query.status) },
      orderBy: { created_at: 'asc' },
    });
  }

  async create(clientId: string, dto: CreateProductDto, actorId: string) {
    await this.assertClientExists(clientId);
    const product = await this.prisma.product.create({
      data: {
        client_id: clientId, // attaches the product to the correct client — CLNT-002
        name: dto.name,
        product_type: dto.product_type,
        is_active: true,
      },
    });
    await this.audit.log({
      actorId,
      entityType: 'products',
      entityId: product.id,
      action: 'create',
      after: { client_id: clientId, name: product.name, product_type: product.product_type },
    });
    return product;
  }

  async update(id: string, dto: UpdateProductDto, actorId: string) {
    const before = await this.prisma.product.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundException('Product not found');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { name: dto.name, is_active: dto.is_active }, // product_type intentionally not editable
    });
    await this.audit.log({
      actorId,
      entityType: 'products',
      entityId: id,
      action: dto.is_active === false && before.is_active ? 'deactivate' : 'update',
      before,
      after: updated,
    });
    return updated;
  }

  private async assertClientExists(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }
}
