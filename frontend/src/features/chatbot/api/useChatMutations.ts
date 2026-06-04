/**
 * Chatbot mutation — send a prompt to the authenticated-only, scoped endpoint and get back the text answer.
 * This is the feature's ONLY network call: the UI does NO data access of its own (the backend is structurally
 * leak-proof — the LLM gets intent only, the tools take only the AuthUser). The page appends the response to
 * its session-only conversation state. Response `never`-typed → cast. Toast at the call site (real errors only).
 */
import { useMutation } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import type { ChatResponse, ChatbotQueryBody } from '../chatbot.types';

export function useChatQuery() {
  return useMutation({
    mutationFn: (body: ChatbotQueryBody) => unwrap<ChatResponse>(api.POST('/v1/chatbot/query', { body })),
  });
}
