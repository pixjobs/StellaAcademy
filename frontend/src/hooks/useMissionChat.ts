'use client';

import { useState, useRef, useCallback } from 'react';

// The 'error' role allows displaying errors directly in the chat flow.
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
    } catch (err: unknown) { // FIX: Catch the error as 'unknown' for type safety.
      
      // We create a safe variable for the error message.
      let errorMessageText = 'An unexpected error occurred.';

      // Safely check if the caught value is an Error instance.
      if (err instanceof Error) {
        // If it's an AbortError, the user cancelled the request, so we handle it gracefully.
        if (err.name === 'AbortError') {
          // Remove Stella's placeholder message.
          setMessages(prev => prev.filter(msg => msg.id !== stellaMessageId));
          // Exit the catch block early.
          return;
        }
        // For all other errors, we can safely use the message property.
        errorMessageText = err.message;
      } else if (typeof err === 'string') {
        // Handle cases where a plain string might be thrown.
        errorMessageText = err;
      }
      
      // Create a structured error message to display in the chat.
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        text: `Connection failed. Is the AI server running?\n\nDetails: ${errorMessageText}`
      };
      
      // Replace Stella's placeholder with the error message.
      setMessages(prev => prev.map(msg => msg.id === stellaMessageId ? errorMessage : msg));

    } finally {
      setLoading(false);
    }
  }, [role, mission, stop, DEBUG]);

  return { messages, loading, sendMessage, stop, reset };
}