/**
 * AuditService — appends to audit_log (who changed what, when, before/after).
 *
 * Called explicitly from service methods on create/update/delete/approve of auth & config
 * entities, and from PermissionsGuard on authorization denials. Explicit service-level logging
 * (rather than a magic interceptor) is used because only the service knows the accurate
 * before-state of an update. — SRS AUTH-006, CLAUDE §5
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  /** The acting user's id (audit_log.user_id). */
  actorId: string;
  /** Table/entity affected (audit_log.entity_type). */
  entityType: string;
  /** Row affected (audit_log.entity_id). */
  entityId: string;
  /** create / update / delete / approve / reject / access_denied / login / logout … */
  action: string;
  before?: unknown;
  after?: unknown;
}

const toJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull =>
  value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        user_id: entry.actorId,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        action: entry.action,
        before_json: toJson(entry.before),
        after_json: toJson(entry.after),
      },
    });
  }
}
