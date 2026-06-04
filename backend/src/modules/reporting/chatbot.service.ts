/**
 * ChatbotService — the read-only NL assistant's SCOPED query layer. A prompt is mapped to ONE
 * allow-listed intent by the (stubbed) LLM, gated by `isToolAllowed`, then answered by calling the
 * SAME scoped DashboardsService methods — which take only the AuthUser and scope to the caller. No
 * rep_id ever flows from the prompt, so the chatbot CANNOT return another role's/rep's data regardless
 * of what is asked. The LLM never touches the DB. Conversation + messages are persisted. — SRS RPT-011, CLAUDE §5
 */
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopeService } from '../../common/scope/scope.service';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { DashboardsService } from './dashboards.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';
import { ChatTool, LLM_PROVIDER, LlmProvider } from './chatbot/llm.provider';
import { isToolAllowed } from './chatbot/tools';

const REFUSAL = "I can't answer that — it's outside what you're permitted to see.";

@Injectable()
export class ChatbotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: ScopeService,
    private readonly dashboards: DashboardsService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async query(dto: ChatbotQueryDto, user: AuthUser) {
    const { tool } = await this.llm.resolveIntent(dto.prompt);
    const scope = await this.scope.getRepScope(user);
    const allowed = isToolAllowed(tool, user, scope.level);

    // The tool is executed ONLY with the AuthUser — never with any id from the prompt. Scope is the
    // caller's; a forbidden/unknown intent never runs a query.
    const answer = allowed ? await this.runTool(tool, user) : REFUSAL;

    // Persist the exchange (audit trail of what was asked/answered).
    const conversation = await this.prisma.chatbotConversation.create({ data: { user_id: user.id } });
    await this.prisma.chatbotMessage.createMany({
      data: [
        { conversation_id: conversation.id, role: 'user', content: dto.prompt },
        { conversation_id: conversation.id, role: 'assistant', content: answer },
      ],
    });

    return { conversation_id: conversation.id, intent: tool, answer };
  }

  /** Each tool calls a SCOPED dashboard method with (user) only — scope is enforced inside. */
  private async runTool(tool: ChatTool, user: AuthUser): Promise<string> {
    switch (tool) {
      case 'my_sales_count': {
        const d = await this.dashboards.rep(user);
        return `You have ${d.internet_activations} internet activation(s) this period (Tier ${d.tier?.tier_number ?? '—'}).`;
      }
      case 'my_commission': {
        const d = await this.dashboards.rep(user);
        return `Your commission this period: $${d.commission.commission_70} (net payout $${d.commission.net_payout}).`;
      }
      case 'my_holdback': {
        const d = await this.dashboards.rep(user);
        return `You have $${d.holdback_pending_release} in holdback pending release.`;
      }
      case 'roster_summary': {
        const d = await this.dashboards.manager(user);
        return `Your roster has ${d.team_internet_activations} internet activation(s) and ${d.pending_validations} sale(s) pending validation.`;
      }
      case 'business_summary': {
        const d = await this.dashboards.business(user, {});
        return `Company: revenue $${d.revenue}, rep payout $${d.rep_payout}, net margin $${d.net_margin}.`;
      }
      default:
        return REFUSAL;
    }
  }
}
