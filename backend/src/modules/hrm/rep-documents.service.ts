/**
 * RepDocumentsService — rep documents (contracts, IDs). Stores the object-storage REFERENCE
 * (file_url) + metadata; the actual multipart upload → S3 is stubbed/deferred (arch §11, §12).
 * Document file_urls are sensitive (identity docs) and gated on hrm:edit. — SRS HRM-005/008
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { canSeeSensitive } from './reps.service';
import { CreateRepDocumentDto } from './dto/rep-document.dto';

@Injectable()
export class RepDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(repId: string, user: AuthUser) {
    await this.assertRepExists(repId);
    const docs = await this.prisma.repDocument.findMany({
      where: { rep_id: repId },
      orderBy: { uploaded_at: 'desc' },
    });
    const canSee = canSeeSensitive(user);
    // Hide the file reference from view-only callers; metadata stays visible. — HRM-008
    return docs.map((doc) => (canSee ? doc : { ...doc, file_url: null }));
  }

  async create(repId: string, dto: CreateRepDocumentDto, actorId: string) {
    await this.assertRepExists(repId);
    const doc = await this.prisma.repDocument.create({
      data: { rep_id: repId, doc_type: dto.doc_type, file_url: dto.file_url },
    });
    // Do not log file_url (identity docs are sensitive).
    await this.audit.log({
      actorId,
      entityType: 'rep_documents',
      entityId: doc.id,
      action: 'create',
      after: { rep_id: repId, doc_type: doc.doc_type },
    });
    return doc;
  }

  private async assertRepExists(repId: string): Promise<void> {
    const rep = await this.prisma.rep.findUnique({ where: { id: repId }, select: { id: true } });
    if (!rep) {
      throw new NotFoundException('Rep not found');
    }
  }
}
