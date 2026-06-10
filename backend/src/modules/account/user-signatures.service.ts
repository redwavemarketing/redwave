/**
 * UserSignaturesService — a user's saved, reusable signatures (private + OWN-SCOPED). Every query is
 * scoped to `user.id`; one signature is the default (used to pre-fill the signing view). The image lives
 * in private object storage under `signatures/{userId}/…` and is served only via a short-TTL signed URL
 * minted by the own-scoped /file-url endpoint — never a public path. — SRS §13 (saved signature)
 *
 * No module permission: managing your own signatures is authenticated + own-scoped (like change-password).
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { StorageService, UploadedFile } from '../../common/storage/storage.service';
import { CreateUserSignatureDto } from './dto/user-signature.dto';

@Injectable()
export class UserSignaturesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  /** The caller's own saved signatures (default first, then newest). */
  list(user: AuthUser) {
    return this.prisma.userSignature.findMany({
      where: { user_id: user.id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
      select: { id: true, label: true, method: true, is_default: true, created_at: true },
    });
  }

  /** Save a new signature image. The first one a user saves becomes their default. */
  async create(dto: CreateUserSignatureDto, file: UploadedFile, user: AuthUser) {
    const stored = await this.storage.upload(`signatures/${user.id}`, file);
    const existing = await this.prisma.userSignature.count({ where: { user_id: user.id } });
    const created = await this.prisma.userSignature.create({
      data: {
        user_id: user.id,
        label: dto.label,
        method: dto.method,
        file_path: stored.path,
        is_default: existing === 0, // first saved signature is the default
      },
      select: { id: true, label: true, method: true, is_default: true, created_at: true },
    });
    await this.audit.log({
      actorId: user.id,
      entityType: 'user_signatures',
      entityId: created.id,
      action: 'create',
      after: { label: dto.label, method: dto.method, is_default: created.is_default, stored: stored.stored },
    });
    return created;
  }

  /** Make one of the caller's signatures the default (unsets the others, atomically). */
  async setDefault(id: string, user: AuthUser) {
    const sig = await this.prisma.userSignature.findFirst({ where: { id, user_id: user.id } });
    if (!sig) {
      throw new NotFoundException('signature not found');
    }
    await this.prisma.$transaction([
      this.prisma.userSignature.updateMany({ where: { user_id: user.id }, data: { is_default: false } }),
      this.prisma.userSignature.update({ where: { id }, data: { is_default: true } }),
    ]);
    await this.audit.log({ actorId: user.id, entityType: 'user_signatures', entityId: id, action: 'edit', after: { is_default: true } });
    return { id, label: sig.label, method: sig.method, is_default: true, created_at: sig.created_at.toISOString() };
  }

  /** Delete one of the caller's signatures. If it was the default, the newest remaining becomes default. */
  async remove(id: string, user: AuthUser) {
    const sig = await this.prisma.userSignature.findFirst({ where: { id, user_id: user.id } });
    if (!sig) {
      throw new NotFoundException('signature not found');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.userSignature.delete({ where: { id } });
      if (sig.is_default) {
        const next = await tx.userSignature.findFirst({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
          select: { id: true },
        });
        if (next) {
          await tx.userSignature.update({ where: { id: next.id }, data: { is_default: true } });
        }
      }
    });
    await this.audit.log({ actorId: user.id, entityType: 'user_signatures', entityId: id, action: 'delete' });
    return { success: true };
  }

  /** A short-TTL signed URL for the caller's OWN signature image (404 for anyone else / unconfigured). */
  async fileUrl(id: string, user: AuthUser): Promise<{ url: string; filename: string }> {
    const sig = await this.prisma.userSignature.findFirst({ where: { id, user_id: user.id }, select: { file_path: true } });
    if (!sig) {
      throw new NotFoundException('signature not found');
    }
    const url = await this.storage.signedUrl(sig.file_path);
    if (!url) {
      throw new NotFoundException('the signature image is not available (storage not configured)');
    }
    return { url, filename: `signature.png` };
  }
}
