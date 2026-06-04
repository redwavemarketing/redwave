/**
 * UsersService — admin user management: create users (hashed password), edit/deactivate,
 * and assign roles. This is the ADMIN flow (gated by users:* permissions) and writes directly;
 * it is distinct from the self-service profile-change-review flow in the Account module. — AUTH-005/008
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { USER_PUBLIC_SELECT } from '../../common/util/user-public';
import { CreateUserDto, SetUserRolesDto, UpdateUserDto } from './dto/user.dto';

const USER_WITH_ROLES_SELECT = {
  ...USER_PUBLIC_SELECT,
  user_roles: { select: { role: { select: { id: true, name: true } } } },
} as const;

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      select: USER_WITH_ROLES_SELECT,
      orderBy: { created_at: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_WITH_ROLES_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto, actorId: string) {
    const password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password_hash,
          full_name: dto.full_name,
          phone: dto.phone,
          avatar_url: dto.avatar_url,
          theme_preference: 'system',
          status: 'active',
        },
      });
      if (dto.role_ids?.length) {
        await tx.userRole.createMany({
          data: dto.role_ids.map((role_id) => ({ user_id: user.id, role_id })),
          skipDuplicates: true,
        });
      }
      return user;
    });
    await this.audit.log({
      actorId,
      entityType: 'users',
      entityId: created.id,
      action: 'create',
      // never log the password / hash
      after: { email: created.email, full_name: created.full_name, role_ids: dto.role_ids ?? [] },
    });
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const before = await this.prisma.user.findUnique({
      where: { id },
      select: { full_name: true, phone: true, avatar_url: true, status: true },
    });
    if (!before) {
      throw new NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        full_name: dto.full_name,
        phone: dto.phone,
        avatar_url: dto.avatar_url,
        status: dto.status,
      },
      select: { full_name: true, phone: true, avatar_url: true, status: true },
    });
    await this.audit.log({
      actorId,
      entityType: 'users',
      entityId: id,
      action: dto.status && dto.status !== before.status ? 'deactivate' : 'update',
      before,
      after: updated,
    });
    return this.findOne(id);
  }

  async setRoles(id: string, dto: SetUserRolesDto, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, user_roles: { select: { role_id: true } } },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const before = user.user_roles.map((ur) => ur.role_id);
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { user_id: id } }),
      this.prisma.userRole.createMany({
        data: dto.role_ids.map((role_id) => ({ user_id: id, role_id })),
        skipDuplicates: true,
      }),
    ]);
    await this.audit.log({
      actorId,
      entityType: 'users',
      entityId: id,
      action: 'update',
      before: { role_ids: before },
      after: { role_ids: dto.role_ids },
    });
    return this.findOne(id);
  }
}
