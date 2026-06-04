/**
 * RolesService — role CRUD, the module×action grant matrix, and the catalogue used by the
 * Role Builder. Effective permissions for a user are the union of their roles' grants. — AUTH-003/004/005
 *
 * Guards in code:
 *  • Built-in (is_system) roles cannot be deleted. — AUTH-003
 *  • Built-in roles cannot be renamed (RBAC keys off role names like 'Super Admin'); description
 *    edits are allowed.
 *  NOTE: the data model has no role status column, so "deactivate a role" (AUTH-003) is not
 *  modeled here — custom roles are removed via DELETE. Flagged for confirmation.
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { permissionKey } from '../../common/rbac/permissions.util';
import { CreateRoleDto, SetRolePermissionsDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        is_system: true,
        created_at: true,
        _count: { select: { role_permissions: true, user_roles: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        is_system: true,
        created_at: true,
        role_permissions: {
          select: {
            permission: {
              select: { id: true, action: true, module: { select: { key: true } } },
            },
          },
        },
      },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const { role_permissions, ...rest } = role;
    return {
      ...rest,
      permissions: role_permissions.map((rp) => ({
        id: rp.permission.id,
        key: permissionKey(rp.permission.module.key, rp.permission.action),
      })),
    };
  }

  async create(dto: CreateRoleDto, actorId: string) {
    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name: dto.name,
          description: dto.description,
          is_system: false,
          created_by: actorId,
        },
      });
      if (dto.permission_ids?.length) {
        await tx.rolePermission.createMany({
          data: dto.permission_ids.map((pid) => ({ role_id: created.id, permission_id: pid })),
          skipDuplicates: true,
        });
      }
      return created;
    });
    await this.audit.log({
      actorId,
      entityType: 'roles',
      entityId: role.id,
      action: 'create',
      after: {
        name: role.name,
        description: role.description,
        permission_ids: dto.permission_ids ?? [],
      },
    });
    return this.findOne(role.id);
  }

  async update(id: string, dto: UpdateRoleDto, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    // Renaming a built-in role would break name-based RBAC checks. — AUTH-003
    if (role.is_system && dto.name && dto.name !== role.name) {
      throw new ConflictException('Built-in roles cannot be renamed');
    }
    const updated = await this.prisma.role.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
    await this.audit.log({
      actorId,
      entityType: 'roles',
      entityId: id,
      action: 'update',
      before: { name: role.name, description: role.description },
      after: { name: updated.name, description: updated.description },
    });
    return this.findOne(id);
  }

  async setPermissions(id: string, dto: SetRolePermissionsDto, actorId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: { id: true, role_permissions: { select: { permission_id: true } } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const before = role.role_permissions.map((rp) => rp.permission_id);
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { role_id: id } }),
      this.prisma.rolePermission.createMany({
        data: dto.permission_ids.map((pid) => ({ role_id: id, permission_id: pid })),
        skipDuplicates: true,
      }),
    ]);
    await this.audit.log({
      actorId,
      entityType: 'roles',
      entityId: id,
      action: 'update',
      before: { permission_ids: before },
      after: { permission_ids: dto.permission_ids },
    });
    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.is_system) {
      throw new ConflictException('Built-in roles cannot be deleted'); // AUTH-003
    }
    // No cascade in schema — remove the role's grants and assignments first.
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { role_id: id } }),
      this.prisma.userRole.deleteMany({ where: { role_id: id } }),
      this.prisma.role.delete({ where: { id } }),
    ]);
    await this.audit.log({
      actorId,
      entityType: 'roles',
      entityId: id,
      action: 'delete',
      before: { name: role.name },
    });
  }

  /** The module catalogue for the Role Builder matrix. */
  listModules() {
    return this.prisma.module.findMany({
      select: { id: true, key: true, name: true, description: true },
      orderBy: { key: 'asc' },
    });
  }

  /** The full permission grid (module × action) for the Role Builder matrix. */
  async listPermissions() {
    const permissions = await this.prisma.permission.findMany({
      select: { id: true, action: true, module: { select: { id: true, key: true } } },
      orderBy: [{ module: { key: 'asc' } }, { action: 'asc' }],
    });
    return permissions.map((p) => ({
      id: p.id,
      module_id: p.module.id,
      module_key: p.module.key,
      action: p.action,
      key: permissionKey(p.module.key, p.action),
    }));
  }
}
