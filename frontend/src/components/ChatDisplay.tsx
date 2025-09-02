// ChatDisplay.tsx
'use client';

import { useRef, useEffect, useState, memo, useMemo, type ReactNode } from 'react';
import clsx from 'clsx';
import type { Root, Paragraph, Text, PhrasingContent } from 'mdast';
import type { Math as MdastMath, InlineMath as MdastInlineMath } from 'mdast-util-math';
import { visit, SKIP } from 'unist-util-visit';
import { Bookmark } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export type Message = {
  id: string;
  role: 'user' | 'stella' | 'error';
  text: string;
};

type ChatDisplayProps = {
  messages: Message[];
  maxLength?: number;
  onCapture: (message: Message) => void;
  onCaptureFormula: (formula: string) => void;
};

/* ----------------------- Liquid Glass Styles ----------------------- */
const ROLE_STYLES = {
  row: { user: 'justify-end', stella: 'justify-start', error: 'justify-center' },
  bubble: {
    user: 'bg-sky-900/10 border-sky-400/20 text-slate-100',
    stella: 'bg-white/5 border-white/10 text-slate-100',
    error:
      'bg-destructive/80 border-destructive/90 text-destructive-foreground font-mono text-xs w-full text-center',
  },
} as const;

/* ----------------------- remark plugin: bracket/paren → mdast math ----------------------- */
function remarkBracketedMath() {
  const looksLikeMath = (s: string) =>
    /\\[a-zA-Z]|[\^_=]|\\frac|\\mathbf|\\vec|\\cdot|\\times|\\sum|\\int|\\lim|\\boxed/.test(s.trim());

  const normaliseMath = (src: string): string =>
    src
      .replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '')
      .replace(/([A-Za-z0-9}])\s*,\s*(?=[A-Za-z\\(])/g, '$1 \\cdot ');

  return (tree: Root) => {
    // ... (All the visit() logic from your original file remains unchanged here) ...
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => { if (!parent || typeof index !== 'number' || node.children.length !== 1 || node.children[0].type !== 'text') return; const raw = (node.children[0] as Text).value.trim(); const m = raw.match(/^\[\s*([^\[\]\n]{1,2000})\s*\]$/); if (!m) return; const inner = (m[1] || '').trim(); if (!inner || !looksLikeMath(inner)) return; parent.children.splice(index, 1, { type: 'math', value: normaliseMath(inner) }); return SKIP; });
    visit(tree, 'paragraph', (node: Paragraph, index, parent) => { if (!parent || typeof index !== 'number' || !node.children.every(c => c.type === 'text')) return; const raw = (node.children as Text[]).map(t => t.value).join(''); const lines = raw.split(/\r?\n/); const newSiblings: (Paragraph | MdastMath)[] = []; let buf: string[] = []; const flushBuf = () => { if (!buf.length) return; const text = buf.join('\n'); if (text.trim().length) newSiblings.push({ type: 'paragraph', children: [{ type: 'text', value: text }] }); buf = []; }; const startRE = /^\s*(?:[-*]\s+|\d+\.\s+)?\[\s*([^\[\]\n]{1,2000})\s*\]\s*(.*)$/; for (const line of lines) { const m = line.match(startRE); if (m) { const inner = (m[1] || '').trim(); const trailing = m[2] || ''; if (inner && looksLikeMath(inner)) { flushBuf(); newSiblings.push({ type: 'math', value: normaliseMath(inner) }); if (trailing.trim().length) newSiblings.push({ type: 'paragraph', children: [{ type: 'text', value: trailing }] }); continue; } } buf.push(line); } flushBuf(); if (newSiblings.length > 1 || (newSiblings.length === 1 && newSiblings[0].type !== 'paragraph')) { parent.children.splice(index, 1, ...newSiblings); return SKIP; } });
    visit(tree, 'paragraph', (node: Paragraph) => { for (let i = 0; i < node.children.length; i++) { const ch = node.children[i]; if (ch.type !== 'text' || !ch.value) continue; const parts: PhrasingContent[] = []; let last = 0; const parenRE = /\(\s*([^()\n]{1,400})\s*\)/g; let m: RegExpExecArray | null; while ((m = parenRE.exec(ch.value))) { const start = m.index; const end = parenRE.lastIndex; const inner = (m[1] || '').trim(); if (start > last) parts.push({ type: 'text', value: ch.value.slice(last, start) }); if (inner && looksLikeMath(inner)) { parts.push({ type: 'inlineMath', value: normaliseMath(inner) }); } else { parts.push({ type: 'text', value: ch.value.slice(start, end) }); } last = end; } if (last < ch.value.length) parts.push({ type: 'text', value: ch.value.slice(last) }); if (parts.some(p => p.type === 'inlineMath')) { node.children.splice(i, 1, ...parts); i += parts.length - 1; } } });
  };
}

// FIX: The old normalizeLatexInText function has been completely removed.

/* ================================================================ */
/*                            Main Component                        */
/* ================================================================ */
export default function ChatDisplay({
  messages,
  maxLength = 500,
  onCapture,
  onCaptureFormula,
}: ChatDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-muted-foreground font-sans text-sm p-4 text-center">
          Ask Stella a question to get started...
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={clsx('chat-message flex w-full group', ROLE_STYLES.row[msg.role])}>
            <MessageBubble
              message={msg}
              onCapture={onCapture}
              maxLength={maxLength}
              onCaptureFormula={onCaptureFormula}
            />
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

/* ----------------------- Message Bubble Sub-Component ----------------------- */

type MessageBubbleProps = {
  message: Message;
  onCapture: (message: Message) => void;
  maxLength: number;
  onCaptureFormula: (formula: string) => void;
};

const MessageBubble = memo(function MessageBubble({
  message,
  onCapture,
  maxLength,
  onCaptureFormula,
}: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // FIX: We no longer normalize the text here. We use the raw text.
  const isLong = message.text.length > maxLength;
  const display = isLong && !isExpanded ? `${message.text.slice(0, maxLength)}…` : message.text;

  const customPlugins = useMemo(() => [remarkBracketedMath], []);

  return (
    <div
      className={clsx(
        'relative rounded-xl px-3.5 py-2 max-w-[90%] border backdrop-blur-lg shadow-lg font-sans text-[15px] leading-relaxed',
        ROLE_STYLES.bubble[message.role]
      )}
    >
      {message.role === 'stella' && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onCapture(message)}
                className="absolute top-1 -right-3 p-1.5 rounded-full bg-slate-900/40 border border-transparent text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
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
        // FIX: Pass the raw display text to the renderer.
        <MarkdownRenderer
          onCaptureFormula={onCaptureFormula}
          remarkPlugins={customPlugins}
        >
          {display}
        </MarkdownRenderer>
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