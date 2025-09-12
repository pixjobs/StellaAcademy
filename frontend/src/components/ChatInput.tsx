'use client';

import { type Dispatch, type SetStateAction } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatInputProps = {
  onSend: (prompt: string) => void;
  onStop: () => void;
  isLoading: boolean;
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  placeholder?: string;
};

export default function ChatInput({
  onSend,
  onStop,
  isLoading,
  value,
  setValue,
  placeholder = 'Ask Stella a follow-up question…',
}: ChatInputProps) {
  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-center">
      <TextareaAutosize
        id="chat-input"
        className={cn(
          // --- THIS IS THE NEW "LIQUID GLASS" STYLE ---
          "flex-1 resize-none rounded-lg border bg-white/5 border-white/10 backdrop-blur-lg",
          "px-3 py-2 text-sm font-sans text-slate-100",
          "placeholder:text-slate-400 disabled:opacity-60 pr-12",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        aria-label="Type your message"
        maxRows={5}
        rows={1}
      />

      <div className="absolute right-2 flex items-center">
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="p-2 rounded-md text-slate-300 hover:bg-red-900/50 hover:text-red-300 transition-colors"
            aria-label="Stop generation"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim()}
            className={cn(
              // --- LIQUID GLASS BUTTON STYLE ---
              "p-2 rounded-md transition-colors",
              "text-slate-300 hover:bg-white/10 hover:text-white",
              "disabled:text-slate-600 disabled:bg-transparent disabled:cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}