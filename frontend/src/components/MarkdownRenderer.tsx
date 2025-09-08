'use client';

import React, { useCallback, useState, useEffect } from 'react';
import type { ComponentProps } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeMathjax from 'rehype-mathjax/svg';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';
import type { Element } from 'hast';
import { toString } from 'hast-util-to-string';
import type { Node } from 'unist';

import { Bookmark, ExternalLink, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/* ---------------------------------------------------------------------------------------------- */
/* Capture wrapper                                                                                */
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
interface MathNode extends Node {
  type: 'math';
  value: string;
}

const remarkMathFromFencedCode: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'code', (node: Code) => {
    const lang = String(node.lang || '').toLowerCase();
    if (lang === 'math' || lang === 'tex' || lang === 'latex') {
      const mathNode = node as unknown as MathNode;
      mathNode.type = 'math';
      mathNode.value = node.value || '';
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
/* Props                                                                                          */
/* ---------------------------------------------------------------------------------------------- */
type Props = {
  children: string;
  onCaptureFragment?: (text: string) => void;
};

/* ---------------------------------------------------------------------------------------------- */
/* Main renderer                                                                                  */
/* ---------------------------------------------------------------------------------------------- */
export default function MarkdownRenderer({ children, onCaptureFragment }: Props) {
  const CodeBlockWrapper = useCallback(
    ({ node, ...props }: ComponentProps<'pre'> & { node?: Element }) => {
      const rawText = node ? toString(node) : '';
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

  const Anchor = useCallback(({ href, children, ...props }: ComponentProps<'a'>) => {
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
  }, []);

  const Table = useCallback(
    ({ node, ...props }: ComponentProps<'table'> & { node?: Element }) => (
      <Capturable node={node} onCapture={onCaptureFragment}>
        <div className="overflow-x-auto my-3">
          <table {...props} />
        </div>
      </Capturable>
    ),
    [onCaptureFragment]
  );

  const Heading = (Tag: 'h1' | 'h2' | 'h3' | 'h4') => {
    const Component = ({ node, ...props }: ComponentProps<typeof Tag> & { node?: Element }) => (
      <Capturable node={node} onCapture={onCaptureFragment}>
        <Tag {...props} />
      </Capturable>
    );
    Component.displayName = `MarkdownHeading(${Tag})`;
    return Component;
  };

  // FIX for `_node` is defined but never used:
  // We explicitly destructure only the props we care about (`src` and `alt`)
  // and ignore the rest, including the unused `node` prop. This is the cleanest fix.
  const MarkdownImage = ({ src, alt }: ComponentProps<'img'>) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
      let objectUrl: string | null = null;
      if (src instanceof Blob) {
        objectUrl = URL.createObjectURL(src);
        setImageUrl(objectUrl);
      } else if (typeof src === 'string') {
        setImageUrl(src);
      }
      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [src]);

    if (!imageUrl) {
      return null;
    }

    return (
      <div className="relative my-4 aspect-video overflow-hidden rounded-md border border-white/10 bg-black/20">
        <Image
          src={imageUrl}
          alt={alt || 'Image from markdown'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 650px"
        />
      </div>
    );
  };

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
             
              content: (): Element[] => [{
                type: 'element',
                tagName: 'span',
                properties: { 'aria-hidden': true, className: 'anchor-icon' },
                children: [{ type: 'text', value: '¶' }],
              }],
            },
          ],
        ]}
        components={{
          a: Anchor,
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
          pre: CodeBlockWrapper,
          table: Table,
          img: MarkdownImage,
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