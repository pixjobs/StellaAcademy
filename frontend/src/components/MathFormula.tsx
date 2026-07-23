'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import katex from 'katex';

interface MathFormulaProps {
  math: string;
  block?: boolean;
}

export default function MathFormula({ math, block = false }: MathFormulaProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      const rendered = katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
      setHtml(rendered);
    } catch (err) {
      console.error('[MathFormula] KaTeX error:', err);
      setHtml(math);
    }
  }, [math, block]);

  if (!html) {
    // Fallback text during SSR to prevent hydration errors
    return block ? (
      <div className="text-center font-mono my-2 text-slate-400">{math}</div>
    ) : (
      <span className="font-mono text-slate-400">{math}</span>
    );
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className={
        block
          ? 'block text-center my-4 overflow-x-auto text-xl md:text-2xl text-emerald-400 py-3 px-5 bg-slate-950/50 rounded-lg border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]'
          : 'inline-block px-1 text-sm md:text-base font-semibold text-emerald-300'
      }
    />
  );
}

export function RichText({ text, className }: { text: string, className?: string }) {
  // First split by math blocks: $math$
  const mathParts = text.split('$');
  
  return (
    <span className={className}>
      {mathParts.map((mathPart, i) => {
        if (i % 2 === 1) {
          return <MathFormula key={i} math={mathPart} block={false} />;
        }
        
        // Then split the non-math text by markdown links: [text](href)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const elements = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(mathPart)) !== null) {
          // Push preceding text
          if (match.index > lastIndex) {
            elements.push(<span key={`${i}-text-${lastIndex}`}>{mathPart.slice(lastIndex, match.index)}</span>);
          }
          // Push the link
          elements.push(
            <Link 
              key={`${i}-link-${match.index}`} 
              href={match[2]}
              className="text-purple-400 hover:text-purple-300 underline underline-offset-4 font-semibold transition-colors"
            >
              {match[1]}
            </Link>
          );
          lastIndex = linkRegex.lastIndex;
        }

        // Push remaining text
        if (lastIndex < mathPart.length) {
          elements.push(<span key={`${i}-text-${lastIndex}`}>{mathPart.slice(lastIndex)}</span>);
        }

        return <span key={i}>{elements}</span>;
      })}
    </span>
  );
}
