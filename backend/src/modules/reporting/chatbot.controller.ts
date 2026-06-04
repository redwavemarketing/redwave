/**
 * ChatbotController — POST /v1/chatbot/query. — SRS RPT-011
 * Authenticated-only; the scoped tool layer enforces that the answer never exceeds the caller's scope
 * (a rep cannot retrieve another rep's data regardless of the prompt). The LLM is abstracted/stubbed.
 */
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/rbac/auth-user.type';
import { ChatbotService } from './chatbot.service';
import { ChatbotQueryDto } from './dto/chatbot-query.dto';

@ApiTags('Reporting & Dashboards')
@ApiBearerAuth()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post('query')
  @ApiOperation({
    summary: 'Ask the read-only assistant',
    description: 'Authenticated. Answers from Redwave data within the caller’s scope only; the LLM is stubbed.',
  })
  query(@Body() dto: ChatbotQueryDto, @CurrentUser() user: AuthUser) {
    return this.chatbot.query(dto, user);
  }
}
