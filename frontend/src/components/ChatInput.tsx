// src/components/ChatInput.tsx
'use client';

import { useState } from 'react';

type ChatInputProps = {
  onSend: (prompt: string) => void;
  onStop: () => void;
  isLoading: boolean;
  placeholder?: string;
};

export default function ChatInput({
  onSend,
  onStop,
  isLoading,
  placeholder = 'Ask a follow-up question…',
}: ChatInputProps) {
  const [q, setQ] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = q.trim();
    if (!msg || isLoading) return;
    onSend(msg);
    setQ('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5 mt-2">
      <input
        className="flex-1 rounded-md bg-slate-800/70 border border-slate-700
                   px-2.5 py-1.5 text-[13px] font-pixel tracking-wide
                   outline-none focus:border-mint placeholder:text-slate-500
                   disabled:opacity-50"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={isLoading}
        aria-label="Type your message"
      />

      <button
        type="submit"
        disabled={isLoading || !q.trim()}
        className="px-2.5 py-1.5 rounded-md font-pixel text-[11px]
                   bg-sky-900/70 border border-sky-400/35 text-cyan-100
                   hover:bg-sky-800/70 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Send message"
      >
        {isLoading ? 'Wait…' : 'Send'}
      </button>

      {isLoading && (
        <button
          type="button"
          onClick={onStop}
          className="px-2.5 py-1.5 rounded-md font-pixel text-[11px]
                     bg-red-700/70 border border-red-400/60 text-red-100"
          aria-label="Stop generation"
        >
          Stop
        </button>
      )}
    </form>
  );
}
