/**
 * FieldConfigService — the configurable expense-category catalogue (expense_field_configs).
 * Each row sets a category's label, whether it requires a receipt, and whether it is active.
 * Items remain bound to the ExpenseCategory enum, so a key beyond the 7 enum values is
 * catalogue-only until an enum migration adds it (CLAUDE §12). — SRS EXP-009
 */
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { CreateFieldConfigDto } from './dto/field-config.dto';

@Injectable()
export class FieldConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.expenseFieldConfig.findMany({ orderBy: { category_key: 'asc' } });
  }

  async create(dto: CreateFieldConfigDto, user: AuthUser) {
    try {
      const config = await this.prisma.expenseFieldConfig.create({
        data: {
          category_key: dto.category_key,
          label: dto.label,
          requires_receipt: dto.requires_receipt,
          is_active: dto.is_active ?? true,
          created_by: user.id,
        },
      });
      await this.audit.log({
        actorId: user.id,
        entityType: 'expense_field_configs',
        entityId: config.id,
        action: 'create',
        after: {
          category_key: config.category_key,
          requires_receipt: config.requires_receipt,
          is_active: config.is_active,
        },
      });
      return config;
    } catch (error) {
      // @unique(category_key) backstop — a duplicate key is a conflict, not a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`category '${dto.category_key}' already exists`);
      }
      throw error;
    }
  }
}
