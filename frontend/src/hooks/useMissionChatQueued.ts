'use client';

import { useCallback, useRef, useState } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type Params = {
  role: 'explorer' | 'cadet' | 'scholar';
  mission: string; // topic title
};

type EnqueueSuccess = { accepted: true; jobId: string };
type EnqueueError = { error: string };
type EnqueueRes = EnqueueSuccess | EnqueueError;

type PollCompleted = {
  state: 'completed';
  result?: { answer?: string } | { type?: string; result?: { answer?: string } };
};
type PollOngoing = { state: 'waiting' | 'active' | 'delayed' | 'paused' };
type PollFailed = { state: 'failed'; error?: string };
type PollRes = PollCompleted | PollOngoing | PollFailed;

export function useMissionChatQueued({ role, mission }: Params) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const sendMessage = useCallback(
    async (prompt: string, context?: string) => {
      stop();
      setLoading(true);

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: prompt };
      const stellaId = `s-${Date.now()}`;
      setMessages((prev) => [...prev, userMsg, { id: stellaId, role: 'stella', text: '' }]);

      try {
        // Enqueue ask
        const enq = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, context, role, mission }),
        });

        const enqJson: EnqueueRes = await enq.json();

        // [FIXED] Perform type-safe error checking in two distinct steps.
        // Step 1: Check for an application-level error within the JSON response body.
        // The 'in' operator acts as a type guard.
        if ('error' in enqJson) {
          // Inside this block, TypeScript knows enqJson is of type EnqueueError.
          throw new Error(enqJson.error || 'Enqueue operation failed with an unspecified error.');
        }

        // Step 2: If the body format is not an error, then check the HTTP status.
        if (!enq.ok) {
          throw new Error(`Enqueue failed with HTTP status ${enq.status}`);
        }

        // If both checks pass, TypeScript correctly infers that enqJson must be of type EnqueueSuccess.
        const jobId = enqJson.jobId;

        // Poll for the result
        let backoff = 400;
        while (true) {
          const ac = new AbortController();
          abortRef.current = ac;

          const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`, {
            signal: ac.signal,
            headers: { Accept: 'application/json' },
          });

          const data: PollRes = await res.json();

          if (data.state === 'completed') {
            let answer = '';
            if (data.result) {
              if ('answer' in data.result && typeof data.result.answer === 'string') {
                answer = data.result.answer;
              } else if (
                'result' in data.result &&
                data.result.result &&
                'answer' in data.result.result &&
                typeof data.result.result.answer === 'string'
              ) {
                answer = data.result.result.answer;
              }
            }

            setMessages((prev) =>
              prev.map((m) => (m.id === stellaId ? { ...m, text: answer || '(no answer)' } : m))
            );
            setLoading(false);
            return;
          }

          if (data.state === 'failed') {
            const errMsg = data.error || 'The tutor failed to answer.';
            setMessages((prev) =>
              prev.map((m) => (m.id === stellaId ? { id: `e-${Date.now()}`, role: 'error', text: errMsg } : m))
            );
            setLoading(false);
            return;
          }

          await new Promise((r) => setTimeout(r, backoff));
          backoff = Math.min(2000, Math.floor(backoff * 1.5));
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        setMessages((prev) =>
          prev.map((m) => (m.id === stellaId ? { id: `e-${Date.now()}`, role: 'error', text: message } : m))
        );
        setLoading(false);
      }
    },
    [role, mission, stop]
  );

  return { messages, loading, sendMessage, stop, reset };
}