// frontend/src/components/ChatDisplay.tsx
'use client';

import { useRef, useState, memo, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Bookmark, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { normalizeMathForMarkdown } from '@/utils/normalizeMath';

export type Message = { id: string; role: 'user' | 'stella' | 'error'; text: string };

type ChatDisplayProps = {
  messages: Message[];
  maxLength?: number;
  onCapture: (message: Message) => void;
  onCaptureFormula: (formula: string) => void;
};

const ROLE_STYLES = {
  bubble: {
    user:
      'bg-gradient-to-br from-sky-900/30 via-sky-800/20 to-emerald-700/20 ' +
      'border-sky-400/30 text-foreground shadow-sky-900/20',
    stella: 'bg-white/5 border-white/10 text-foreground shadow-black/20',
    error:
      'bg-destructive/80 border-destructive/90 text-destructive-foreground font-mono text-xs w-full text-center',
  },
  ring: {
    user: 'focus-visible:ring-sky-400/40',
    stella: 'focus-visible:ring-gold/40',
    error: 'focus-visible:ring-destructive/60',
  },
} as const;

export default function ChatDisplay({
  messages,
  maxLength = 600,
  onCapture,
  onCaptureFormula, // kept for API compatibility
}: ChatDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const container = scrollRef.current;
    const sentinel = bottomRef.current;
    if (!container || !sentinel) return;

    const io = new IntersectionObserver(
      (entries) => setAtBottom(entries[0]?.isIntersecting ?? true),
      { root: container, threshold: 1.0 }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!atBottom) return;
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, atBottom]);

  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (atBottom) bottomRef.current?.scrollIntoView({ block: 'end' });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [atBottom]);

  return (
    <div
      ref={scrollRef}
      className={clsx(
        'h-full w-full overflow-y-auto overscroll-contain',
        // ↓ tighter vertical spacing between messages
        'px-2 sm:px-3 space-y-2 sm:space-y-3 relative'
      )}
      style={{ overflowAnchor: 'auto' as any }}
    >
      {messages.length === 0 ? (
        <div className="text-muted-foreground font-sans text-[13.5px] sm:text-sm p-4 sm:p-6 text-center rounded-xl border border-white/10 bg-white/5">
          Ask Stella a question to get started...
        </div>
      ) : (
        messages.map((msg) => (
          <MessageRow key={msg.id} message={msg}>
            <MessageBubble message={msg} onCapture={onCapture} maxLength={maxLength} />
          </MessageRow>
        ))
      )}

      <div ref={bottomRef} className="h-0 w-full" />

      {!atBottom && (
        <button
          type="button"
          onClick={jumpToBottom}
          className={clsx(
            'sticky bottom-3 ml-auto mr-2 sm:mr-3',
            'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]', // ↓ smaller chip
            'bg-slate-900/70 border-white/10 text-slate-100 shadow-md backdrop-blur',
            'hover:bg-slate-900/80 transition-colors'
          )}
          aria-label="Scroll to latest"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          New messages
        </button>
      )}
    </div>
  );
}

function MessageRow({ message, children }: { message: Message; children: React.ReactNode }) {
  if (message.role === 'stella') return <div className="w-full">{children}</div>;
  if (message.role === 'error') return <div className="w-full flex justify-center">{children}</div>;
  return <div className="w-full flex justify-end">{children}</div>;
}

const MessageBubble = memo(function MessageBubble({
  message,
  onCapture,
  maxLength,
}: {
  message: Message;
  onCapture: (message: Message) => void;
  maxLength: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isLong = message.text.length > maxLength;
  const raw = isLong && !isExpanded ? `${message.text.slice(0, maxLength)}…` : message.text;
  const display = normalizeMathForMarkdown(raw);
  const isStella = message.role === 'stella';

  const handleShowMore = () => {
    setIsExpanded(true);
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  return (
    <div
      ref={rootRef}
      className={clsx(
        isStella
          // Full-bleed only on very small screens; otherwise normal width
          ? 'w-[calc(100%+0.75rem)] -mx-1.5 sm:mx-0 sm:w-full sm:rounded-2xl sm:border sm:shadow-lg'
          : 'max-w-[92%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl border shadow-lg',
        'relative group backdrop-blur-xl',
        // ↓ slightly smaller vertical padding
        'px-3 py-2 sm:px-3.5 sm:py-2.5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
        'focus-within:outline-none focus-within:ring-2',
        ROLE_STYLES.bubble[message.role],
        ROLE_STYLES.ring[message.role],
        'overflow-x-hidden',
        'scroll-mt-16'
      )}
      tabIndex={0}
    >
      {isStella && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onCapture(message)}
                className={clsx(
                  'absolute top-2 right-2 p-1.5 rounded-full border text-slate-300',
                  'bg-slate-900/30 border-white/10',
                  'opacity-0 group-hover:opacity-100 transition-all hover:bg-white/15 hover:text-white'
                )}
                aria-label="Save to notebook"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Save Entire Message</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {message.role === 'stella' && !message.text ? (
        <span className="blinking-cursor text-gold">▍</span>
      ) : message.role === 'error' ? (
        <span>{display}</span>
      ) : (
        <div
          className={clsx(
            'prose prose-invert prose-theme max-w-none',
            // ↓ slightly smaller text; tighter margins inside the bubble
            'text-[14px] sm:text-[14.5px] leading-relaxed',
            'prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5',
            'break-words'
          )}
        >
          <MarkdownRenderer>{display}</MarkdownRenderer>
        </div>
      )}

      {isLong && !isExpanded && (
        <button
          onClick={handleShowMore}
          className="mt-1.5 text-[11px] text-gold hover:text-gold/80 underline underline-offset-2"
        >
          show more
        </button>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
