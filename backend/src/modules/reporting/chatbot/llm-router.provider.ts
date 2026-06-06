/**
 * LlmProviderRouter — the LLM_PROVIDER bound into the chatbot. Per call it reads the (briefly cached)
 * ChatbotConfig and delegates: when the config is ACTIVE + provider is 'gemini' + a GEMINI_API_KEY is
 * present → the real GeminiLlmProvider; otherwise → the deterministic StubLlmProvider. This lets the real
 * model be switched on/off by flipping ChatbotConfig.is_active (no redeploy). Resilient: a config-read
 * failure falls back to the stub. — SRS RPT-011, CLAUDE §12
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatIntent, LlmProvider, StubLlmProvider } from './llm.provider';
import { GeminiLlmProvider } from './gemini.provider';
import { ChatbotConfigCache } from './chatbot-config.cache';

@Injectable()
export class LlmProviderRouter implements LlmProvider {
  constructor(
    private readonly config: ConfigService,
    private readonly cache: ChatbotConfigCache,
    private readonly stub: StubLlmProvider,
    private readonly gemini: GeminiLlmProvider,
  ) {}

  async resolveIntent(prompt: string): Promise<ChatIntent> {
    let useGemini = false;
    try {
      const cfg = await this.cache.get();
      const apiKey = this.config.get<string>('GEMINI_API_KEY');
      useGemini = !!cfg?.is_active && cfg.provider === 'gemini' && !!apiKey;
    } catch {
      useGemini = false; // config read failed → fall back to the stub
    }
    return useGemini ? this.gemini.resolveIntent(prompt) : this.stub.resolveIntent(prompt);
  }
}
