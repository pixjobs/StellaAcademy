// src/lib/llm-client.ts
export type AskResultEnvelope =
  | { type: 'ask'; result: { answer: string } }
  | { answer?: string } // in case you ever return a bare answer

export function extractAskAnswer(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (p.type === 'ask' && p.result && typeof (p.result as any).answer === 'string') {
    return (p.result as any).answer as string;
  }
  if (typeof p.answer === 'string') return p.answer as string;
  return null;
}
