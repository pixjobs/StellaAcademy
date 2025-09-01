'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import type { Components } from 'react-markdown';
import { Bookmark } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

gsap.registerPlugin(useGSAP);

export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

// --- (1) UPDATED PROPS ---
// Added `onCapture` to allow parent component to handle saving messages.
type ChatDisplayProps = {
  messages: Message[];
  maxLength?: number;
  onCapture: (message: Message) => void;
};

/* ----------------------- Styles & Config ----------------------- */
const ROLE_STYLES = {
  row: {
    user: 'justify-end',
    stella: 'justify-start',
    error: 'justify-center',
  },
  bubble: {
    user: 'bg-sky-900/80 border-sky-400/30 text-cyan-100',
    stella: 'bg-slate-800/85 border-mint/40 text-slate-100',
    error: 'bg-red-900/60 border-red-400/70 text-red-100 font-mono text-xs w-full text-center',
  },
} as const;

// Markdown components remain the same, they are well-implemented.
// ... (CodeBlock, BlockQuote, Anchor components can be pasted here without changes)
const mdComponents: Partial<Components> = { /* ... */ };

/* ================================================================ */
/*                            Component                              */
/* ================================================================ */
export default function ChatDisplay({ messages, maxLength = 500, onCapture }: ChatDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nodeMap = useRef(new Map<string, HTMLDivElement>());

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Animate the newest message with a simple pop-in
  useGSAP(
    () => {
      if (!messages.length) return;
      const msg = messages[messages.length - 1];
      const el = nodeMap.current.get(msg.id);
      if (!el) return;
      
      const fromX = msg.role === 'user' ? 40 : -40;
      gsap.from(el, { autoAlpha: 0, x: fromX, scale: 0.95, duration: 0.4, ease: 'power3.out' });
    },
    { dependencies: [messages], scope: containerRef }
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const onExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: true }));

  return (
    <div ref={containerRef} className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-slate-400 font-sans text-sm p-4 text-center">
          Ask Stella a question to get started...
        </div>
      ) : (
        messages.map((msg) => {
          const isLong = msg.text.length > maxLength;
          const isExpanded = !!expanded[msg.id];
          const display = isLong && !isExpanded ? `${msg.text.slice(0, maxLength)}…` : msg.text;

          return (
            <div
              key={msg.id}
              className={clsx('chat-message flex w-full group', ROLE_STYLES.row[msg.role])}
              ref={(el) => {
                if (el) nodeMap.current.set(msg.id, el); else nodeMap.current.delete(msg.id);
              }}
            >
              <div
                className={clsx(
                  'relative rounded-xl px-3.5 py-2 max-w-[90%] border backdrop-blur-sm',
                  'font-sans text-[15px] leading-relaxed',
                  ROLE_STYLES.bubble[msg.role]
                )}
              >
                {/* --- (2) CAPTURE BUTTON FOR STELLA MESSAGES --- */}
                {msg.role === 'stella' && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onCapture(msg)}
                          className="absolute top-1 -right-3 p-1.5 rounded-full bg-slate-700/50 border border-transparent
                                     text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity
                                     hover:bg-slate-600 hover:text-sky-300 hover:border-sky-400/50"
                          aria-label="Save to notebook"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Save to Notebook</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {msg.role === 'stella' && !msg.text ? (
                  <span className="blinking-cursor">▍</span>
                ) : msg.role === 'error' ? (
                  <span>{display}</span>
                ) : (
                  // --- (3) UPGRADED MARKDOWN & MATH RENDERING ---
                  // This `prose` container ensures consistent styling for text and formulas.
                  <div className="prose prose-sm prose-invert max-w-none 
                                prose-p:my-2 prose-code:before:content-[''] prose-code:after:content-['']
                                prose-a:text-sky-300 hover:prose-a:text-sky-200
                                math-display:text-base">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeMathjax]}
                      components={mdComponents}
                    >
                      {display}
                    </ReactMarkdown>
                  </div>
                )}
                {isLong && !isExpanded && (
                  <button
                    onClick={() => onExpand(msg.id)}
                    className="mt-2 text-xs text-sky-300 underline underline-offset-2"
                  >
                    show more
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}