'use client';

import { useAccessibility } from '@/lib/store';
import type { ReactNode } from 'react';

export default function AccessibilityWrapper({ children }: { children: ReactNode }) {
  const { fontSizeScale, fontFamily, reduceTransparency, reduceMotion } = useAccessibility();

  const getFontFamily = () => {
    switch (fontFamily) {
      case 'serif': return "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";
      case 'mono': return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
      case 'dyslexic': return "'Comic Sans MS', 'OpenDyslexic', sans-serif";
      case 'sans':
      default:
        return "'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif";
    }
  };

  return (
    <div 
      style={{
        '--font-scale': Math.max(0.5, fontSizeScale),
        '--font-main': getFontFamily(),
      } as React.CSSProperties}
      className={`contents ${reduceTransparency ? 'reduce-transparency' : ''} ${reduceMotion ? 'reduce-motion' : ''}`}
    >
      {children}
    </div>
  );
}
