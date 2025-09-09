// src/lib/llm-client.ts
export type AskResultEnvelope =
  | { type: 'ask'; result: { answer: string } }
  | { answer?: string } // in case you ever return a bare answer

export function extractAskAnswer(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const p = payload as Record<string, unknown>;

  // Case 1: ask-type payloads with nested result.answer
  if (p.type === 'ask' && typeof p.result === 'object' && p.result !== null) {
    const result = p.result as Record<string, unknown>;
    if (typeof result.answer === 'string') {
      return result.answer;
    }
  }

  // Case 2: direct answer at the top level
  if (typeof p.answer === 'string') {
    return p.answer;
  }

  return null;
}