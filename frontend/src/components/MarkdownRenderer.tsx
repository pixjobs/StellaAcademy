// components/MarkdownRenderer.tsx
'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeMathjax from 'rehype-mathjax/svg';
import { visit } from 'unist-util-visit';
// 1. Import from the correct library for HAST (HTML Abstract Syntax Tree)
import { toString } from 'hast-util-to-string';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
// 2. Import the correct type for HAST nodes that react-markdown provides
import type { Element } from 'hast';
import { Bookmark } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * A higher-order component that wraps a Markdown element and adds a "Save" button.
 * It is now type-safe and handles optional nodes.
 */
const Capturable = ({
  node,
  children,
  onCapture,
}: {
  // 3. The `node` is an optional HAST Element, which is the correct type.
  node?: Element;
  children: React.ReactNode;
  onCapture?: (text: string) => void;
}) => {
  // 4. Gracefully do nothing if the capture function or the node isn't available.
  if (!onCapture || !node) {
    return <>{children}</>;
  }

  const handleCapture = (e: React.MouseEvent) => {
    e.stopPropagation();
    // We've already checked that `node` exists, so this is safe.
    const text = toString(node);
    onCapture(text);
  };

  return (
    <div className="group relative">
      {children}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCapture}
              className="absolute top-1 -right-8 p-1.5 rounded-full border text-slate-400 bg-slate-900/50 border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hover:text-white focus:opacity-100"
              aria-label="Save snippet to notebook"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Save Snippet</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// Custom remark plugin for fenced math blocks (unchanged)
const remarkMathFromFencedCode: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: any) => {
    const lang = (node.lang || '').toLowerCase();
    if (lang === 'math' || lang === 'tex' || lang === 'latex') {
      node.type = 'math';
      node.value = node.value || '';
    }
  });
};

type Props = {
  children: string;
  onCaptureFragment?: (text: string) => void;
};

export default function MarkdownRenderer({ children, onCaptureFragment }: Props) {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMathFromFencedCode, remarkMath, remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeMathjax]}
        components={{
          // 5. The `node` prop passed from here is now correctly typed and handled by `Capturable`.
          p: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}><p {...props} /></Capturable>
          ),
          pre: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}><pre {...props} /></Capturable>
          ),
          li: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}><li {...props} /></Capturable>
          ),
          table: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}>
              <div className="overflow-x-auto my-4"><table {...props} /></div>
            </Capturable>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}