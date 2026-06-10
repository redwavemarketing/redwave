import { Global, Module } from '@nestjs/common';
import { MailerService } from './mailer.service';

/**
 * EmailModule — supplies the app-wide MailerService (Resend, env-gated graceful). @Global so auth/users can
 * inject it for transactional mail (invite / reset / temp password) without re-importing. — AUTH-002
 */
@Global()
@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class EmailModule {}
