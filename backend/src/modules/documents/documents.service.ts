/**
 * DocumentsService — upload, share/request-signature, list, and detail for documents.
 *
 * Sharing a document IS creating a signature request (the schema has no separate shares table); the
 * recipients become the document's "shared-with" set for visibility. The binary upload is STUBBED
 * (a `original_file_url` reference is minted; real object storage deferred, CLAUDE §12). Visibility is
 * scoped in the QUERY — a user sees only documents they own or are a recipient of (Admin/Super Admin
 * see all). Owns documents + signature_requests + document_signatures. — SRS DOC-001/002, §5
 */
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { BUILTIN_ROLES } from '../../common/rbac/rbac.constants';
import { StorageService, UploadedFile } from '../../common/storage/storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { ListDocumentsQuery } from './dto/list-documents.query';
import { recomputeDocumentStatus } from './status.recompute';
import { NOTIFICATION_EMITTER, NotificationEmitter } from '../../common/notifications/notification-emitter';

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const isAdmin = (user: AuthUser): boolean =>
  user.isSuperAdmin || user.roleNames.includes(BUILTIN_ROLES.ADMIN);

/** Filename-safe slug for a download name (keeps the user's title recognizable). */
const slug = (title: string): string =>
  title.replace(/[^a-zA-Z0-9._ -]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'document';

const DETAIL_INCLUDE = {
  signature_requests: {
    include: {
      document_signatures: {
        select: {
          id: true,
          recipient_user_id: true,
          status: true,
          signed_file_url: true,
          signed_at: true,
          method: true,
        },
      },
      signature_fields: {
        select: { id: true, recipient_user_id: true, type: true, page: true, x: true, y: true, w: true, h: true },
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: { created_at: 'asc' },
  },
} as const satisfies Prisma.DocumentInclude;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    @Inject(NOTIFICATION_EMITTER) private readonly emitter: NotificationEmitter,
  ) {}

  // ── Upload (real object storage; the original is never mutated, DOC-001/004) ──────────
  async upload(dto: CreateDocumentDto, file: UploadedFile, user: AuthUser) {
    const stored = await this.storage.upload('documents', file); // returns the object PATH (or local:// ref)
    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        doc_type: dto.doc_type,
        owner_user_id: user.id,
        original_file_url: stored.path, // the object path — re-signed on read; set once, never mutated
        status: 'draft',
      },
    });
    await this.audit.log({
      actorId: user.id,
      entityType: 'documents',
      entityId: document.id,
      action: 'create',
      after: { title: dto.title, doc_type: dto.doc_type, status: 'draft', stored: stored.stored },
    });
    return document;
  }

  // ── Access-controlled file URLs (re-check visibility, then mint a short-TTL signed URL) ──
  async fileUrl(id: string, user: AuthUser): Promise<{ url: string; filename: string }> {
    const doc = await this.findOne(id, user); // 404 if not visible — no leak
    const url = await this.storage.signedUrl(doc.original_file_url);
    if (!url) {
      throw new NotFoundException('the document file is not available (storage not configured)');
    }
    return { url, filename: `${slug(doc.title)}.pdf` };
  }

  async completedFileUrl(id: string, user: AuthUser): Promise<{ url: string; filename: string }> {
    const doc = await this.findOne(id, user); // visibility-gated
    const req = await this.prisma.signatureRequest.findFirst({
      where: { document_id: id, completed_file_path: { not: null } },
      orderBy: { created_at: 'desc' },
      select: { completed_file_path: true },
    });
    const url = req?.completed_file_path ? await this.storage.signedUrl(req.completed_file_path) : null;
    if (!url) {
      throw new NotFoundException('no completed (all-signatures) copy is available yet');
    }
    return { url, filename: `${slug(doc.title)}-signed.pdf` };
  }

  // ── Share / request signature ──────────────────────────────────────────────────────
  async requestSignature(documentId: string, dto: CreateSignatureRequestDto, user: AuthUser) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, owner_user_id: true, title: true },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    // Only the owner (or an admin) may share/request signatures on a document. — DOC-002 (row-level)
    if (document.owner_user_id !== user.id && !isAdmin(user)) {
      await this.audit.log({
        actorId: user.id,
        entityType: 'documents',
        entityId: documentId,
        action: 'access_denied',
        after: { reason: 'only the document owner may request signatures' },
      });
      throw new ForbiddenException('only the document owner may request signatures');
    }

    const recipients = [...new Set(dto.recipient_user_ids)];
    if (recipients.length !== dto.recipient_user_ids.length) {
      throw new UnprocessableEntityException('recipient_user_ids must not contain duplicates');
    }

    // Every placed field must target a recipient of THIS request. — DOC-003
    const fields = dto.fields ?? [];
    const recipientSet = new Set(recipients);
    for (const field of fields) {
      if (!recipientSet.has(field.recipient_user_id)) {
        throw new UnprocessableEntityException('a signature field targets a non-recipient');
      }
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.signatureRequest.create({
        data: {
          document_id: documentId,
          requested_by: user.id,
          message: dto.message ?? null,
          due_date: dto.due_date ? dateOnly(dto.due_date) : null,
          status: 'pending',
          document_signatures: {
            create: recipients.map((recipient_user_id) => ({
              recipient_user_id,
              status: 'pending',
            })),
          },
          signature_fields: {
            create: fields.map((f) => ({
              recipient_user_id: f.recipient_user_id,
              type: f.type,
              page: f.page,
              x: f.x.toString(),
              y: f.y.toString(),
              w: f.w.toString(),
              h: f.h.toString(),
            })),
          },
        },
        include: { document_signatures: true, signature_fields: true },
      });
      await recomputeDocumentStatus(tx, documentId); // → 'shared'
      return created;
    });

    await this.audit.log({
      actorId: user.id,
      entityType: 'signature_requests',
      entityId: request.id,
      action: 'share',
      after: { document_id: documentId, recipient_user_ids: recipients, status: 'pending' },
    });

    // Notify each recipient of the pending request (best-effort). — DOC-006/RPT-009
    for (const recipientId of recipients) {
      await this.emitter.emit({
        eventType: 'signature_requested',
        userId: recipientId,
        title: 'A document needs your signature',
        body: dto.message ?? `${user.full_name} asked you to sign ${document.title}.`,
        relatedEntityType: 'documents', // deep-links to the document so the recipient can sign
        relatedEntityId: documentId,
        variables: { requester_name: user.full_name, document_name: document.title },
      });
    }
    return request;
  }

  // ── Reads (visibility-scoped) ────────────────────────────────────────────────────────
  list(query: ListDocumentsQuery, user: AuthUser) {
    return this.prisma.document.findMany({
      where: {
        AND: [
          this.visibilityWhere(user),
          ...(query.status ? [{ status: query.status }] : []),
          ...(query.doc_type ? [{ doc_type: query.doc_type }] : []),
          ...(query.pending_signatures ? [{ signature_requests: { some: { status: 'pending' as const } } }] : []),
        ],
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    const document = await this.prisma.document.findFirst({
      where: { AND: [{ id }, this.visibilityWhere(user)] },
      include: DETAIL_INCLUDE,
    });
    if (!document) {
      throw new NotFoundException('Document not found'); // 404 on not-visible — no existence leak
    }
    return document;
  }

  /** Owner OR recipient-of-any-request; Admin/Super Admin see all. Scope is in the query (§5). */
  private visibilityWhere(user: AuthUser): Prisma.DocumentWhereInput {
    if (isAdmin(user)) {
      return {};
    }
    return {
      OR: [
        { owner_user_id: user.id },
        {
          signature_requests: {
            some: { document_signatures: { some: { recipient_user_id: user.id } } },
          },
        },
      ],
    };
  }
}
