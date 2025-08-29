// src/hooks/useMissionChat.ts
'use client';

import { useState, useRef, useCallback } from 'react';

// Add 'error' to the possible roles for a message
export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type UseMissionChatParams = {
  role: 'explorer' | 'cadet' | 'scholar';
  mission: string;
};

export function useMissionChat({ role, mission }: UseMissionChatParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const DEBUG = process.env.NEXT_PUBLIC_DEBUG_ASK === '1';

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const sendMessage = useCallback(async (prompt: string, context?: string) => {
    stop();
    setLoading(true);

    const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: prompt };
    const stellaMessageId = `stella-${Date.now()}`;
    const stellaPlaceholder: Message = { id: stellaMessageId, role: 'stella', text: '' };
    
    // Add both the user message and Stella's placeholder to the chat
    setMessages(prev => [...prev, newUserMessage, stellaPlaceholder]);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context, role, mission }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Failed to read error response.');
        throw new Error(`Server error (${res.status}): ${errorText.slice(0, 200)}`);
      }

      if (!res.body) throw new Error("Response body is empty.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (DEBUG) console.log('[ask:chunk]', chunk);
        
        setMessages(prev =>
          prev.map(msg =>
            msg.id === stellaMessageId ? { ...msg, text: msg.text + chunk } : msg
          )
        );
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // --- THIS IS THE KEY FIX ---
        // Instead of a separate error state, we replace Stella's placeholder
        // with a visible error message directly in the chat.
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'error',
          text: `Connection failed. Is the AI server running?\n\nDetails: ${err.message}`
        };
        setMessages(prev => prev.map(msg => msg.id === stellaMessageId ? errorMessage : msg));
      } else {
        // If the user stopped it, just remove the placeholder
        setMessages(prev => prev.filter(msg => msg.id !== stellaMessageId));
      }
    } finally {
      setLoading(false);
    }
  }, [role, mission, stop, DEBUG]);

  return { messages, loading, sendMessage, stop, reset };
}