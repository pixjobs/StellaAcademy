import type { CategoryId } from '@/lib/study-modules';

/**
 * Subject colours: a bright ink for accents and labels, and a deep tint of the
 * same hue for the panels behind diagrams, formulas and key points.
 */
export const PAPER_SUBJECT: Record<CategoryId, { ink: string; tint: string }> = {
  physics: { ink: '#a5b4fc', tint: '#1e2563' },
  mechanics: { ink: '#fdba74', tint: '#3d2713' },
  electronics: { ink: '#6ee7b7', tint: '#0f3b2f' },
  mathematics: { ink: '#fda4af', tint: '#48192b' },
  'elementary-math': { ink: '#c4b5fd', tint: '#2f2163' },
};
