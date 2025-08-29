// src/components/ChatInput.tsx
'use client';

import { useState } from 'react';

type ChatInputProps = {
  onSend: (prompt: string) => void;
  onStop: () => void;
  isLoading: boolean;
};

export default function ChatInput({ onSend, onStop, isLoading }: ChatInputProps) {
  const [q, setQ] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim() && !isLoading) {
      onSend(q);
      setQ(''); // Clear the input after sending
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
      <input
        className="flex-1 rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-mint disabled:opacity-50"
        placeholder="Ask a follow-up question..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={isLoading}
      />
      <button
        disabled={isLoading || !q.trim()}
        className="btn-pixel font-pixel text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Wait…' : 'Send'}
      </button>
      {isLoading && (
        <button
          type="button"
          onClick={onStop}
          className="btn-pixel font-pixel text-xs bg-red-600/70 border-red-400/60"
        >
          Stop
        </button>
      )}
    </form>
  );
}