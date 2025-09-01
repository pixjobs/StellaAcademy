'use client';

import { type Dispatch, type SetStateAction } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Square } from 'lucide-react';

// The props are now updated to accept `value` and `setValue` from the parent component.
// This makes it a "controlled component" and fixes the TypeScript error.
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
  placeholder = 'Ask a follow-up question…',
}: ChatInputProps) {
  // The internal state `useState` has been removed. The component is now controlled by its parent.

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
        id="chat-input" // Important for focus logic in the parent component
        className="flex-1 resize-none rounded-lg bg-background border border-input
                   px-3 py-2 text-sm font-sans
                   ring-offset-background placeholder:text-muted-foreground
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
                   disabled:opacity-60 pr-12" // Added padding-right to make space for the button
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
            className="p-2 rounded-md text-gold hover:bg-gold/20 disabled:text-slate-600 disabled:bg-transparent transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}