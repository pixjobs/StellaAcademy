import { useEffect, useRef } from 'react';

/** Smallest size, in screen pixels, that a label inside a model may shrink to. */
const MIN_PX = 10;

/**
 * Keeps the text inside a model's SVG readable on phones. The models are drawn
 * on a 560-unit canvas that scales to fit, so at phone width a 13-unit label
 * would be about 7px. Wherever a label would fall below MIN_PX, this sets a
 * larger size in canvas units; at desktop widths it changes nothing. Labels
 * added later (for example when a model changes state) are picked up too.
 */
export function useReadableLabels() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    const apply = () => {
      const width = svg.viewBox.baseVal?.width;
      const scale = width ? svg.getBoundingClientRect().width / width : 0;
      if (!scale) return;
      for (const text of svg.querySelectorAll('text')) {
        const base = Number(text.closest('[font-size]')?.getAttribute('font-size')) || 16;
        const wanted = base * scale < MIN_PX ? `${(MIN_PX / scale).toFixed(1)}px` : '';
        if (text.style.fontSize !== wanted) text.style.fontSize = wanted;
      }
    };

    apply();
    const resize = new ResizeObserver(apply);
    resize.observe(svg);
    const added = new MutationObserver(apply);
    added.observe(svg, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      added.disconnect();
    };
  }, []);

  return ref;
}
