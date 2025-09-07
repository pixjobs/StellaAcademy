'use client';

import { useCallback, useRef, useState } from 'react';

export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type Params = {
  role: 'explorer' | 'cadet' | 'scholar';
  mission: string;                 // topic title
};

type EnqueueRes =
  | { accepted: true; jobId: string }
  | { error: string };

type PollCompleted = {
  state: 'completed';
  result?: { answer?: string } | { type?: string; result?: { answer?: string } };
};
type PollOngoing = { state: 'waiting' | 'active' | 'delayed' | 'paused' };
type PollFailed   = { state: 'failed'; error?: string };
type PollRes = PollCompleted | PollOngoing | PollFailed;

export function useMissionChatQueued({ role, mission }: Params) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const sendMessage = useCallback(async (prompt: string, context?: string) => {
    stop();
    setLoading(true);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: prompt };
    const stellaId = `s-${Date.now()}`;
    setMessages(prev => [...prev, userMsg, { id: stellaId, role: 'stella', text: '' }]);

    try {
      // enqueue ask
      const enq = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, role, mission }),
      });
      const enqJson = (await enq.json()) as EnqueueRes;
      if (!enq.ok || !('accepted' in enqJson)) {
        throw new Error(('error' in enqJson && enqJson.error) || `Enqueue failed (${enq.status})`);
      }
      const jobId = (enqJson as any).jobId as string;

      // poll
      let backoff = 400;
      while (true) {
        const ac = new AbortController();
        abortRef.current = ac;

        const res = await fetch(`/api/llm/enqueue?id=${encodeURIComponent(jobId)}`, {
          signal: ac.signal,
          headers: { Accept: 'application/json' },
        });

        const data = (await res.json()) as PollRes;

        if (data.state === 'completed') {
          const answer =
            (data as any)?.result?.answer ??
            (data as any)?.result?.result?.answer ?? '';
          setMessages(prev =>
            prev.map(m => (m.id === stellaId ? { ...m, text: answer || '(no answer)' } : m))
          );
          setLoading(false);
          return;
        }

        if (data.state === 'failed') {
          const errMsg = data.error || 'The tutor failed to answer.';
          setMessages(prev =>
            prev.map(m => (m.id === stellaId ? { id: `e-${Date.now()}`, role: 'error', text: errMsg } : m))
          );
          setLoading(false);
          return;
        }

        // waiting/active/delayed/paused
        await new Promise(r => setTimeout(r, backoff));
        backoff = Math.min(2000, Math.floor(backoff * 1.5));
      }
    } catch (e: any) {
      setMessages(prev =>
        prev.map(m => (m.id === stellaId ? { id: `e-${Date.now()}`, role: 'error', text: e.message } : m))
      );
      setLoading(false);
    }
  }, [role, mission, stop]);

  return { messages, loading, sendMessage, stop, reset };
}
