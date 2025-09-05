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

  // Track whether the user is currently at the bottom (or very near it).
  const [atBottom, setAtBottom] = useState(true);

  // Observe the sentinel at the end of the list to know if we're "pinned" to bottom.
  useEffect(() => {
    const container = scrollRef.current;
    const sentinel = bottomRef.current;
    if (!container || !sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setAtBottom(entry.isIntersecting);
      },
      {
        root: container,
        threshold: 1.0, // fully in view = true (you can relax to 0.98 if needed)
      }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  // When new messages arrive (or update), if we're at the bottom, keep us pinned.
  useEffect(() => {
    if (!atBottom) return;
    bottomRef.current?.scrollIntoView({ block: 'end' }); // instant; less jank during streaming
  }, [messages, atBottom]);

  // Provide a manual "jump to bottom" action with smooth scroll.
  const jumpToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // If container resizes (mobile keyboard, window resize), keep pinned if atBottom.
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
    // Scrolling container (let the parent flex determine height)
    <div
      ref={scrollRef}
      className={clsx(
        'h-full w-full overflow-y-auto overscroll-contain',
        // Remove `scroll-smooth` to avoid scroll jank; we do smooth only on button clicks.
        'px-2 sm:px-3 space-y-3 sm:space-y-4 relative'
      )}
      // A small improvement to prevent unexpected anchor jumps when content grows
      style={{ overflowAnchor: 'auto' as any }}
    >
      {messages.length === 0 ? (
        <div className="text-muted-foreground font-sans text-sm p-6 text-center rounded-xl border border-white/10 bg-white/5">
          Ask Stella a question to get started...
        </div>
      ) : (
        messages.map((msg) => (
          <MessageRow key={msg.id} message={msg}>
            <MessageBubble message={msg} onCapture={onCapture} maxLength={maxLength} />
          </MessageRow>
        ))
      )}

      {/* Bottom sentinel: always last */}
      <div ref={bottomRef} className="h-0 w-full" />

      {/* “Scroll to latest” button appears when the user is not at bottom */}
      {!atBottom && (
        <button
          type="button"
          onClick={jumpToBottom}
          className={clsx(
            'sticky bottom-3 ml-auto mr-2 sm:mr-3',
            'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs',
            'bg-slate-900/70 border-white/10 text-slate-100 shadow-md backdrop-blur',
            'hover:bg-slate-900/80 transition-colors'
          )}
          aria-label="Scroll to latest"
        >
          <ChevronDown className="h-4 w-4" />
          New messages
        </button>
      )}
    </div>
  );
}

// --- MessageRow and MessageBubble components can remain unchanged ---
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
  const rootRef = useRef<HTMLDivElement>(null); // ref to this bubble

  const isLong = message.text.length > maxLength;
  const raw = isLong && !isExpanded ? `${message.text.slice(0, maxLength)}…` : message.text;
  const display = normalizeMathForMarkdown(raw);
  const isStella = message.role === 'stella';

  const handleShowMore = () => {
    setIsExpanded(true);
    // Wait for layout to update, then scroll the expanded bubble into view
    requestAnimationFrame(() => {
      rootRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  return (
    <div
      ref={rootRef}
      className={clsx(
        isStella
          ? 'w-[calc(100%+1rem)] -mx-2 sm:mx-0 sm:w-full sm:rounded-2xl sm:border sm:shadow-lg'
          : 'max-w-[92%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl border shadow-lg',
        'relative group backdrop-blur-xl',
        'px-3.5 py-2 sm:px-4 sm:py-3',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
        'focus-within:outline-none focus-within:ring-2',
        ROLE_STYLES.bubble[message.role],
        ROLE_STYLES.ring[message.role],
        'overflow-x-hidden',
        'scroll-mt-16' // helpful if you have a sticky header
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
            'text-[14.5px] leading-relaxed sm:text-[15px]',
            'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
            'break-words'
          )}
        >
          <MarkdownRenderer>{display}</MarkdownRenderer>
        </div>
      )}

      {isLong && !isExpanded && (
        <button
          onClick={handleShowMore}
          className="mt-2 text-xs text-gold hover:text-gold/80 underline underline-offset-2"
        >
          show more
        </button>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
