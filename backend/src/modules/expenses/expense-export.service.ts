/**
 * ExpenseExportService — generate + record expense exports (expense_exports).
 * The actual PDF/Excel rendering + object-storage upload is DEFERRED (CLAUDE §12); we persist the
 * export request with the chosen filters and a stubbed `file_url`. — SRS EXP-010
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { CreateExportDto } from './dto/export.dto';

@Injectable()
export class ExpenseExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scope: ScopeService,
  ) {}

  list() {
    return this.prisma.expenseExport.findMany({ orderBy: { generated_at: 'desc' } });
  }

  async generate(dto: CreateExportDto, user: AuthUser) {
    const ext = dto.format === 'excel' ? 'xlsx' : 'pdf';
    const scope = dto.pay_period_id ?? dto.client_id ?? 'all';
    // Record the caller's rep-scope so the (deferred) server-side render only ever serialises rows the
    // caller may see — a manager exports only their roster, a rep only their own. The REAL file today is
    // generated client-side from the scope-enforced /v1/expense-items list. — CLAUDE §5 (PII), §12
    const repScope = await this.scope.getRepScope(user);
    const rep_scope = repScope.level === 'all' ? null : repScope.repIds;
    const export_ = await this.prisma.expenseExport.create({
      data: {
        generated_by: user.id,
        client_id: dto.client_id ?? null,
        pay_period_id: dto.pay_period_id ?? null,
        scope_filters: { client_id: dto.client_id ?? null, pay_period_id: dto.pay_period_id ?? null, rep_scope },
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
