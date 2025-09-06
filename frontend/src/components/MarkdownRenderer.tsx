// components/MarkdownRenderer.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeMathjax from 'rehype-mathjax/svg';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
// import rehypeSanitize from 'rehype-sanitize'; // <-- Uncomment if you want strict HTML sanitization

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Element } from 'hast';
import { toString } from 'hast-util-to-string';

import { Bookmark, ExternalLink, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/* ---------------------------------------------------------------------------------------------- */
/* Capture wrapper (unchanged behavior, slightly tidied)                                          */
/* ---------------------------------------------------------------------------------------------- */
const Capturable = ({
  node,
  children,
  onCapture,
}: {
  node?: Element;
  children: React.ReactNode;
  onCapture?: (text: string) => void;
}) => {
  if (!onCapture || !node) return <>{children}</>;

  const handleCapture = (e: React.MouseEvent) => {
    e.stopPropagation();
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

/* ---------------------------------------------------------------------------------------------- */
/* Convert fenced code in math/tex/latex to real math nodes                                       */
/* ---------------------------------------------------------------------------------------------- */
const remarkMathFromFencedCode: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: any) => {
    const lang = String(node.lang || '').toLowerCase();
    if (lang === 'math' || lang === 'tex' || lang === 'latex') {
      node.type = 'math';
      node.value = node.value || '';
    }
  });
};

/* ---------------------------------------------------------------------------------------------- */
/* Small helpers                                                                                  */
/* ---------------------------------------------------------------------------------------------- */
function isExternalHref(href?: string): boolean {
  return !!href && /^https?:\/\//i.test(href);
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // no-op
  }
};

/* ---------------------------------------------------------------------------------------------- */
/* Props                                                                                           */
/* ---------------------------------------------------------------------------------------------- */
type Props = {
  children: string;
  onCaptureFragment?: (text: string) => void;
};

/* ---------------------------------------------------------------------------------------------- */
/* Main renderer                                                                                  */
/* ---------------------------------------------------------------------------------------------- */
export default function MarkdownRenderer({ children, onCaptureFragment }: Props) {
  // Memoized code block renderer so we don’t recreate handlers per line
  const CodeBlockWrapper = useCallback(
    ({
      node,
      ...props
    }: {
      node?: Element;
      children?: React.ReactNode;
      className?: string;
    }) => {
      const rawText =
        typeof props.children === 'string'
          ? props.children
          : Array.isArray(props.children)
          ? props.children.join('')
          : '';

      const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(rawText);
      };

      return (
        <Capturable node={node} onCapture={onCaptureFragment}>
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-white/10 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/15"
              aria-label="Copy code"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </button>
            <pre {...props} />
          </div>
        </Capturable>
      );
    },
    [onCaptureFragment]
  );

  // Custom anchor element: open in new tab, safe rel, subtle external icon
  const Anchor = useCallback(
    ({
      node,
      href,
      children,
      ...props
    }: {
      node?: Element;
      href?: string;
      children?: React.ReactNode;
    }) => {
      const external = isExternalHref(href);
      return (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="text-sky-400 underline underline-offset-4 decoration-sky-400/60 hover:text-sky-300"
          {...props}
        >
          {children}
          {external && <ExternalLink className="inline-block ml-1 -mt-0.5 h-3.5 w-3.5 align-text-top opacity-80" />}
        </a>
      );
    },
    []
  );

  // Tight tables: keep them scrollable
  const Table = useCallback(
    ({ node, ...props }: { node?: Element; children?: React.ReactNode }) => (
      <Capturable node={node} onCapture={onCaptureFragment}>
        <div className="overflow-x-auto my-3">
          <table {...props} />
        </div>
      </Capturable>
    ),
    [onCaptureFragment]
  );

  // Headings with anchors are capturable too
  const Heading =
    (Tag: 'h1' | 'h2' | 'h3' | 'h4') =>
    ({ node, ...props }: { node?: Element; children?: React.ReactNode }) =>
      (
        <Capturable node={node} onCapture={onCaptureFragment}>
          <Tag {...props} />
        </Capturable>
      );

  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMathFromFencedCode, remarkMath, remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeMathjax,
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: { className: ['no-underline', 'ml-1', 'opacity-60', 'hover:opacity-90'] },
              content: {
                type: 'element',
                tagName: 'span',
                properties: { ariaHidden: 'true' },
                children: [{ type: 'text', value: '¶' }],
              },
            },
          ],
          // rehypeSanitize, // <- enable if your content is untrusted HTML
        ]}
        components={{
          a: Anchor,
          // paragraph / list items remain capturable
          p: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}>
              <p {...props} />
            </Capturable>
          ),
          li: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}>
              <li {...props} />
            </Capturable>
          ),
          blockquote: ({ node, ...props }) => (
            <Capturable node={node} onCapture={onCaptureFragment}>
              <blockquote {...props} />
            </Capturable>
          ),
          // code fence wrapper with copy
          pre: CodeBlockWrapper,
          // tables
          table: Table,
          // images: add some niceties
          img: ({ node, ...props }) => (
            // not capturable by default; you can wrap with Capturable if desired
            <img loading="lazy" className="rounded-md shadow-sm" {...props} />
          ),
          // headings with anchors
          h1: Heading('h1'),
          h2: Heading('h2'),
          h3: Heading('h3'),
          h4: Heading('h4'),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
