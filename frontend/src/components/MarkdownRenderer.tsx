// components/MarkdownRenderer.tsx
'use client';

import { FC, memo, useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { Pluggable } from 'unified';
import type { Math as MdastMath, InlineMath as MdastInlineMath } from 'mdast-util-math';
import { ClipboardCopy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/* ----------------------- Memoized Sub-Components (Unchanged) ----------------------- */
const ThemedAnchor = memo(function ThemedAnchor({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (<a href={href} target="_blank" rel="noreferrer" className="underline text-gold hover:text-gold/80" {...props}>{children}</a>);
});

const InteractiveInlineMath = memo(function InteractiveInlineMath({ formula, onCapture }: { formula: string; onCapture: (f: string) => void }) {
  const html = useMemo(() => katex.renderToString(formula, { throwOnError: false, displayMode: false }), [formula]);
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="relative group p-1 cursor-pointer align-middle">
            <span dangerouslySetInnerHTML={{ __html: html }} />
            <button
              type="button"
              onClick={() => onCapture(formula)}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-900/40 border border-transparent text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
              aria-label="Save formula"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Save Formula to Notebook</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

const InteractiveBlockMath = memo(function InteractiveBlockMath({ formula, onCapture }: { formula: string; onCapture: (f: string) => void }) {
  const html = useMemo(() => katex.renderToString(formula, { throwOnError: false, displayMode: true }), [formula]);
  return (
    <div className="relative group my-4">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onCapture(formula)}
              className="absolute top-1 right-1 p-1.5 rounded-full bg-slate-900/40 border border-transparent text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:text-white hover:border-white/20"
              aria-label="Save formula"
            >
              <ClipboardCopy className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Save Formula to Notebook</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

/* ----------------------- Types and Helpers (Unchanged) ----------------------- */
type MathProps = { node?: MdastMath; children?: ReactNode };
type InlineMathProps = { node?: MdastInlineMath; children?: ReactNode };
interface CustomComponents extends Components {
  math?: (props: MathProps) => ReactNode;
  inlineMath?: (props: InlineMathProps) => ReactNode;
}
const getFormula = (node?: { value?: string }, children?: ReactNode) => (node?.value as string | undefined) ?? String(children ?? '');

/* ================================================================ */
/*                        Main Renderer Component                     */
/* ================================================================ */
interface MarkdownRendererProps {
  children: string; // This `children` prop is now expected to be a clean, valid Markdown string.
  onCaptureFormula: (formula: string) => void;
  remarkPlugins?: Pluggable[];
}

const MarkdownRenderer: FC<MarkdownRendererProps> = ({
  children,
  onCaptureFormula,
  remarkPlugins = [],
}) => {
  const mdComponents: CustomComponents = useMemo(
    () => ({
      a: ThemedAnchor,
      math: ({ node, children }) => (
        <InteractiveBlockMath formula={getFormula(node, children)} onCapture={onCaptureFormula} />
      ),
      inlineMath: ({ node, children }) => (
        <InteractiveInlineMath formula={getFormula(node, children)} onCapture={onCaptureFormula} />
      ),
    }),
    [onCaptureFormula]
  );

  // The `preprocessAndNormalize` function and the `useMemo` hook that called it
  // have been completely removed. We now pass the children prop directly.

  return (
    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-code:before:content-[''] prose-code:after:content-['']">
      <ReactMarkdown
        remarkPlugins={[...remarkPlugins, remarkMath, remarkGfm]}
        components={mdComponents as Components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default memo(MarkdownRenderer);