'use client';

import { useState, useRef, useCallback } from 'react';
import { startJob, checkJobStatus } from '@/lib/task-client';
import type { AskResult } from '@/types/llm';

export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type UseMissionChatParams = {
  role: 'explorer' | 'cadet' | 'scholar';
  mission: string;
};

// --- Configuration ---
const POLLING_INTERVAL_MS = 1500;
const JOB_TIMEOUT_MS = 30_000; // 30 seconds

export function useMissionChat({ role, mission }: UseMissionChatParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
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

      const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: prompt };
      const stellaMessageId = `stella-${Date.now()}`;
      const stellaPlaceholder: Message = { id: stellaMessageId, role: 'stella', text: '' };

      setMessages((prev) => [...prev, newUserMessage, stellaPlaceholder]);

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const jobPayload = {
          type: 'ask' as const,
          payload: { prompt, context, role, mission },
        };

        const jobId = await startJob(jobPayload);

        const started = Date.now();
        while (Date.now() - started < JOB_TIMEOUT_MS) {
          if (ac.signal.aborted) {
            setMessages((prev) => prev.filter((msg) => msg.id !== stellaMessageId));
            return;
          }

          const status = await checkJobStatus(jobId);

          // =================================================================
          // --- UPDATED & SIMPLIFIED LOGIC ---
          // =================================================================
          if (status.status === 'completed') {
            // We now check for the 'answer' property directly on the result object.
            // This correctly matches the data shape from the worker.
            if (status.result && 'answer' in status.result) {
              const askResult = status.result as AskResult;
              const finalAnswer = askResult.answer;

              setMessages((prev) =>
                prev.map((msg) => (msg.id === stellaMessageId ? { ...msg, text: finalAnswer } : msg)),
              );
              return; // Success!
            }
            // This error will now only be thrown if the result is truly malformed.
            throw new Error('Completed "ask" job returned an invalid result shape.');
          }

          if (status.status === 'failed') {
            throw new Error(status.error || 'The AI worker failed to process the request.');
          }

          await new Promise((r) => setTimeout(r, POLLING_INTERVAL_MS));
        }

        throw new Error('The request timed out. The AI may be busy. Please try again.');
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setMessages((prev) => prev.filter((msg) => msg.id !== stellaMessageId));
          return;
        }

        const errorMessageText = err instanceof Error ? err.message : 'An unexpected error occurred.';
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'error',
          text: `Connection failed.\n\nDetails: ${errorMessageText}`,
        };

        setMessages((prev) => prev.map((msg) => (msg.id === stellaMessageId ? errorMessage : msg)));
      } finally {
        setLoading(false);
      }
    },
    [role, mission, stop],
  );

  return { messages, loading, sendMessage, stop, reset };
}