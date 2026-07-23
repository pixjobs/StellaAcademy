'use client';

import { useAccessibility } from '@/lib/store';
import { useEffect, type ReactNode } from 'react';

export default function AccessibilityWrapper({ children }: { children: ReactNode }) {
  const { fontSizeScale, fontFamily, reduceTransparency, reduceMotion } = useAccessibility();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply font size scale
    const scale = Math.max(0.5, fontSizeScale);
    root.style.setProperty('--font-scale', scale.toString());
    body.style.fontSize = `calc(1rem * ${scale})`;

    // Determine font family string
    let fontValue = "'Hanken Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif";
    if (fontFamily === 'serif') {
      fontValue = "'Fraunces', Georgia, Cambria, 'Times New Roman', serif";
    } else if (fontFamily === 'mono') {
      fontValue = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
    } else if (fontFamily === 'dyslexic') {
      fontValue = "'Comic Sans MS', 'OpenDyslexic', sans-serif";
    }

    root.style.setProperty('--font-main', fontValue);
    body.style.fontFamily = fontValue;
    body.dataset.fontFamily = fontFamily;

    // Apply accessibility classes
    if (reduceTransparency) {
      body.classList.add('reduce-transparency');
    } else {
      body.classList.remove('reduce-transparency');
    }

    if (reduceMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }
  }, [fontSizeScale, fontFamily, reduceTransparency, reduceMotion]);

  return <>{children}</>;
}
