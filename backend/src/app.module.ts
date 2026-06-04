/**
 * Root application module.
 *
 * Infrastructure: ConfigModule (.env), PrismaModule (DB), HealthModule (/health),
 * AuditModule + ScopeModule (global cross-cutting RBAC services).
 * Domain (Auth & RBAC): AuthModule (also registers the global guards), UsersModule,
 * RolesModule, AccountModule.
 *
 * The remaining 11 domain modules are registered here as they are built (CLAUDE §6 build order).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './common/audit/audit.module';
import { ScopeModule } from './common/scope/scope.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AccountModule } from './modules/account/account.module';
import { ClientsModule } from './modules/clients/clients.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { CommissionModule } from './modules/commission/commission.module';
import { SalesModule } from './modules/sales/sales.module';
import { ClawbackModule } from './modules/clawback/clawback.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { PayRunModule } from './modules/payrun/payrun.module';
import { BillingModule } from './modules/billing/billing.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ImportModule } from './modules/import/import.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuditModule,
    ScopeModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AccountModule,
    ClientsModule,
    HrmModule,
    CommissionModule,
    SalesModule,
    ClawbackModule,
    ExpensesModule,
    PayRunModule,
    BillingModule,
    DocumentsModule,
    ImportModule,
    ReportingModule,
  ],
})
export class AppModule {}
