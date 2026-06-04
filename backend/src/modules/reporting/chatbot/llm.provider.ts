/**
 * LLM provider seam — the chatbot's natural-language → INTENT boundary. The provider returns ONLY an
 * allow-listed intent (never ids, never SQL, never raw data access). The real Gemini integration
 * rebinds `LLM_PROVIDER` later; the `StubLlmProvider` here is a deterministic keyword router so the
 * scoped tool layer (the real security surface) can be built and tested without a key. — SRS RPT-011, CLAUDE §12
 *
 * SECURITY: because the provider yields only an intent enum (no rep_id), a prompt asking for another
 * rep's data can at most resolve to a `my_*` intent, which the tool then scopes to the CALLER. The LLM
 * can never widen scope.
 */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

/** The fixed, scoped tool set the chatbot can route to. No free-form queries. */
export type ChatTool =
  | 'my_sales_count'
  | 'my_commission'
  | 'my_holdback'
  | 'roster_summary'
  | 'business_summary'
  | 'unknown';

export interface ChatIntent {
  tool: ChatTool;
}

export interface LlmProvider {
  /** Map a free-text prompt to ONE allow-listed intent. Pure routing — no ids, no SQL, no data. */
  resolveIntent(prompt: string): Promise<ChatIntent>;
}

/** Deterministic keyword router standing in for Gemini (real provider rebinds the token). */
export class StubLlmProvider implements LlmProvider {
  async resolveIntent(prompt: string): Promise<ChatIntent> {
    const p = prompt.toLowerCase();
    if (/\b(company|business|org|total revenue|payout|margin)\b/.test(p)) return { tool: 'business_summary' };
    if (/\b(roster|team|my reps|my distributors)\b/.test(p)) return { tool: 'roster_summary' };
    if (/\b(holdback|held|release)\b/.test(p)) return { tool: 'my_holdback' };
    if (/\b(commission|earn|earning|pay|paid|net)\b/.test(p)) return { tool: 'my_commission' };
    if (/\b(sale|sales|count|activation|tier)\b/.test(p)) return { tool: 'my_sales_count' };
    return { tool: 'unknown' };
  }
}
