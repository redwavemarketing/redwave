/**
 * ExpenseExportService — generate + record expense exports (expense_exports).
 * The actual PDF/Excel rendering + object-storage upload is DEFERRED (CLAUDE §12); we persist the
 * export request with the chosen filters and a stubbed `file_url`. — SRS EXP-010
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { CreateExportDto } from './dto/export.dto';

@Injectable()
export class ExpenseExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.expenseExport.findMany({ orderBy: { generated_at: 'desc' } });
  }

  async generate(dto: CreateExportDto, user: AuthUser) {
    const ext = dto.format === 'excel' ? 'xlsx' : 'pdf';
    const scope = dto.pay_period_id ?? dto.client_id ?? 'all';
    const export_ = await this.prisma.expenseExport.create({
      data: {
        generated_by: user.id,
        client_id: dto.client_id ?? null,
        pay_period_id: dto.pay_period_id ?? null,
        scope_filters: { client_id: dto.client_id ?? null, pay_period_id: dto.pay_period_id ?? null },
        format: dto.format,
        // Stubbed object-storage reference — real generation/upload deferred (CLAUDE §12).
        file_url: `s3://redwave-exports/expenses/${scope}.${ext}`,
      },
    });
    await this.audit.log({
      actorId: user.id,
      entityType: 'expense_exports',
      entityId: export_.id,
      action: 'export',
      after: { format: dto.format, client_id: dto.client_id ?? null, pay_period_id: dto.pay_period_id ?? null },
    });
    return export_;
  }
}
