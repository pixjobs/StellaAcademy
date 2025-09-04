// components/KatexDemo.tsx
'use client';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export default function KatexDemo() {
  return (
    <div className="prose max-w-none p-6">
      <h1>KaTeX Demo</h1>

      <p>
        Inline math: <InlineMath math="E = mc^2" />
      </p>

      <p>Block math:</p>
      <BlockMath math="\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}" />

      <p>Another block equation:</p>
      <BlockMath math="\mathbf{F}_{12} = -\,\mathbf{F}_{21}" />
    </div>
  );
}
