import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications.module';
import { DashboardsController, LeaderboardController } from './dashboards.controller';
import { NotificationsController, NotificationSettingsController } from './notifications.controller';
import { ChatbotController } from './chatbot.controller';
import { DashboardsService } from './dashboards.service';
import { LeaderboardService } from './leaderboard.service';
import { ChatbotService } from './chatbot.service';
import { LLM_PROVIDER, StubLlmProvider } from './chatbot/llm.provider';

/**
 * ReportingModule — the read-layer: four role-scoped dashboards, the counts-only leaderboard, the
 * notification API, and the scoped read-only chatbot. Read-only over existing data — no money recompute,
 * no schema change. Imports NotificationsModule (NotificationsService + the email/emitter stubs); binds
 * the chatbot LLM stub. Every read is scoped server-side. — SRS §14, arch §6.12
 */
@Module({
  imports: [NotificationsModule],
  controllers: [
    DashboardsController,
    LeaderboardController,
    NotificationsController,
    NotificationSettingsController,
    ChatbotController,
  ],
  providers: [
    DashboardsService,
    LeaderboardService,
    ChatbotService,
    { provide: LLM_PROVIDER, useClass: StubLlmProvider }, // real Gemini rebinds this later
  ],
})
export class ReportingModule {}
