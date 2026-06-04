import { Module } from '@nestjs/common';
import { NotificationsModule } from '../reporting/notifications.module';
import { DocumentsController } from './documents.controller';
import { SignatureRequestsController } from './signature-requests.controller';
import { DocumentsService } from './documents.service';
import { SignaturesService } from './signatures.service';

/**
 * DocumentsModule — document upload/share + the e-signature workflow (per-signer status + audit).
 * Binary upload + e-sign provider are STUBBED (file references only). No migration. Imports
 * NotificationsModule to satisfy the `NOTIFICATION_EMITTER` seam, so signature events become in-app
 * notifications (DOC-006/RPT-009) without coupling Documents to the Reporting feature code.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [DocumentsController, SignatureRequestsController],
  providers: [DocumentsService, SignaturesService],
})
export class DocumentsModule {}
