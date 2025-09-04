// frontend/src/components/ChatDisplay.tsx
// Full-width for Stella, mobile-optimised, colors fixed, no horizontal scroll
'use client';

import { useRef, useEffect, useState, memo } from 'react';
import clsx from 'clsx';
import { Bookmark } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { normalizeMathForMarkdown } from '@/utils/normalizeMath';

export type Message = { id: string; role: 'user' | 'stella' | 'error'; text: string };

type ChatDisplayProps = {
  messages: Message[];
  maxLength?: number;
  onCapture: (message: Message) => void;
  onCaptureFormula: (formula: string) => void; // kept for API compatibility
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
}: ChatDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className={clsx(
        // vertical scroll only
        'w-full max-h-[calc(100dvh-10rem)] overflow-y-auto overflow-x-hidden',
        'overscroll-contain scroll-smooth',
        // padding & spacing tuned for mobile
        'px-2 sm:px-3 space-y-3 sm:space-y-4',
      )}
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
      <div ref={bottomRef} />
    </div>
  );
}

/* Row wrapper: stella = full width; user = right-aligned */
function MessageRow({
  message,
  children,
}: {
  message: Message;
  children: React.ReactNode;
}) {
  if (message.role === 'stella') return <div className="w-full">{children}</div>;
  if (message.role === 'error') return <div className="w-full flex justify-center">{children}</div>;
  return <div className="w-full flex justify-end">{children}</div>;
}

type MessageBubbleProps = { message: Message; onCapture: (message: Message) => void; maxLength: number };

const MessageBubble = memo(function MessageBubble({ message, onCapture, maxLength }: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = message.text.length > maxLength;
  const raw = isLong && !isExpanded ? `${message.text.slice(0, maxLength)}…` : message.text;
  const display = normalizeMathForMarkdown(raw);

  const isStella = message.role === 'stella';

  return (
    <div
      className={clsx(
        // width
        isStella
          ? 'w-[calc(100%+1rem)] -mx-2 sm:mx-0 sm:w-full sm:rounded-2xl sm:border sm:shadow-lg'
          : 'max-w-[92%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl border shadow-lg',
        // visuals
        'backdrop-blur-xl',
        'px-3.5 py-2 sm:px-4 sm:py-3',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl',
        'focus-within:outline-none focus-within:ring-2',
        ROLE_STYLES.bubble[message.role],
        ROLE_STYLES.ring[message.role],
        // scrolling
        'overflow-x-hidden', // hide horizontal scroll
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
                  'opacity-0 group-hover:opacity-100 transition-all hover:bg-white/15 hover:text-white',
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
            // Typography + colors bound to CSS vars
            'prose prose-invert prose-theme max-w-none',
            // smoother reading on mobile
            'text-[14.5px] leading-relaxed sm:text-[15px]',
            // element rhythm
            'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
            'prose-h1:mt-2 prose-h1:mb-3 prose-h2:mt-2 prose-h2:mb-2 prose-h3:mt-2 prose-h3:mb-1.5',
            'prose-a:no-underline hover:prose-a:underline',
            'prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-white/10',
            // prevent horizontal scroll; wrap long content
            'break-words',
            // tables & code safety
            '[&_table]:w-full [&_table]:table-fixed [&_th]:font-semibold [&_td]:align-top',
            '[&_pre]:whitespace-pre-wrap [&_pre]:break-words',
            // MathJax SVG scale/wrap
            '[&_.MathJax]:max-w-full [&_.mjx-svg]:max-w-full [&_.mjx-svg]:h-auto',
          )}
        >
          <MarkdownRenderer>{display}</MarkdownRenderer>
        </div>
      )}

      {isLong && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-xs text-gold hover:text-gold/80 underline underline-offset-2"
        >
          show more
        </button>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
