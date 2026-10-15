import type { ConceptId } from '@/lib/study-modules';

/**
 * One small diagram per lesson, drawn in a single style: 64-unit box, round
 * strokes in the text colour, with the brand gold picking out the idea. Curves
 * (sine wave, bell curve, wave packet, 1/t decay, the transfer ellipse) are
 * sampled from their equations rather than sketched.
 */
const DIAGRAMS: Record<ConceptId, React.ReactNode> = {
  'gravity': (
    <>
      <circle cx="30" cy="34" r="22" strokeOpacity=".45"/>
      <circle cx="24" cy="38" r="8" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="47.3" cy="20.5" r="3" fill="currentColor" stroke="none"/>
      <path d="M43.3 23.5 L36.9 28.3" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M41.1 27.7 L36.9 28.3 L38.7 24.4" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'prism': (
    <>
      <path d="M32 12 L54 50 H10 Z"/>
      <path d="M4 40 L24 31"/>
      <path d="M24 31 L42 30" strokeOpacity=".5"/>
      <path d="M42 30 L60 30" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M42 30 L60 37" stroke="var(--diagram-accent, var(--brand-gold))" strokeOpacity=".75"/>
      <path d="M42 30 L59 44" stroke="var(--diagram-accent, var(--brand-gold))" strokeOpacity=".5"/>
    </>
  ),
  'gears': (
    <>
      <circle cx="23" cy="36" r="13" strokeWidth="4.5" strokeDasharray="3.4 3.4"/>
      <circle cx="23" cy="36" r="3.5"/>
      <circle cx="46" cy="22" r="8" strokeWidth="4.5" strokeDasharray="3.1 3.2" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <circle cx="46" cy="22" r="2" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'trajectory': (
    <>
      <circle cx="32" cy="32" r="9"/>
      <circle cx="32" cy="32" r="24" strokeOpacity=".45"/>
      <path d="M41 32 A16.5 14.7 0 0 0 8 32" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <circle cx="41" cy="32" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="8" cy="32" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
    </>
  ),
  'circuit': (
    <>
      <path d="M26 14 H14 V28 M14 34 V50 H50 V14 H38" />
      <rect x="26" y="9.5" width="12" height="9" stroke="var(--diagram-accent, var(--brand-gold))" />
      <path d="M7 28 H21" />
      <path d="M10.5 34 H17.5" strokeWidth="3.6" />
    </>
  ),
  'waves': (
    <>
      <path d="M6 32 H58" strokeOpacity=".35"/>
      <path d="M8.0 32.0 L8.8 29.3 L9.6 26.7 L10.4 24.4 L11.2 22.3 L12.0 20.7 L12.8 19.6 L13.6 19.1 L14.4 19.1 L15.2 19.6 L16.0 20.7 L16.8 22.3 L17.6 24.4 L18.4 26.7 L19.2 29.3 L20.0 32.0 L20.8 34.7 L21.6 37.3 L22.4 39.6 L23.2 41.7 L24.0 43.3 L24.8 44.4 L25.6 44.9 L26.4 44.9 L27.2 44.4 L28.0 43.3 L28.8 41.7 L29.6 39.6 L30.4 37.3 L31.2 34.7 L32.0 32.0 L32.8 29.3 L33.6 26.7 L34.4 24.4 L35.2 22.3 L36.0 20.7 L36.8 19.6 L37.6 19.1 L38.4 19.1 L39.2 19.6 L40.0 20.7 L40.8 22.3 L41.6 24.4 L42.4 26.7 L43.2 29.3 L44.0 32.0 L44.8 34.7 L45.6 37.3 L46.4 39.6 L47.2 41.7 L48.0 43.3 L48.8 44.4 L49.6 44.9 L50.4 44.9 L51.2 44.4 L52.0 43.3 L52.8 41.7 L53.6 39.6 L54.4 37.3 L55.2 34.7 L56.0 32.0" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'fractions': (
    <>
      <path d="M32 32 V10 A22 22 0 1 1 10 32 Z" fill="var(--diagram-accent, var(--brand-gold))" fillOpacity=".3" stroke="none"/>
      <circle cx="32" cy="32" r="22"/>
      <path d="M32 10 V54 M10 32 H54"/>
    </>
  ),
  'binary': (
    <>
      <rect x="6" y="24" width="11" height="16" rx="2" fill="var(--diagram-accent, var(--brand-gold))" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <rect x="20" y="24" width="11" height="16" rx="2"/>
      <rect x="34" y="24" width="11" height="16" rx="2" fill="var(--diagram-accent, var(--brand-gold))" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <rect x="48" y="24" width="11" height="16" rx="2" fill="var(--diagram-accent, var(--brand-gold))" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'trigonometry': (
    <>
      <path d="M10 50 H52 V16 Z"/>
      <path d="M45 50 V43 H52"/>
      <path d="M24 50 A14 14 0 0 0 21.6 41.6" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'calculus': (
    <>
      <path d="M10 10 V54 H56" strokeOpacity=".4"/>
      <path d="M10.0 52.0 L11.5 52.0 L12.9 51.8 L14.4 51.6 L15.9 51.2 L17.3 50.8 L18.8 50.3 L20.3 49.7 L21.7 49.0 L23.2 48.2 L24.7 47.3 L26.1 46.3 L27.6 45.2 L29.1 44.0 L30.5 42.7 L32.0 41.4 L33.5 39.9 L34.9 38.3 L36.4 36.7 L37.9 34.9 L39.3 33.1 L40.8 31.1 L42.3 29.1 L43.7 27.0 L45.2 24.7 L46.7 22.4 L48.1 20.0 L49.6 17.5 L51.1 14.9 L52.5 12.2 L54.0 9.4"/>
      <path d="M25.0 50.8 L49.0 21.2" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <circle cx="38" cy="34.8" r="2.8" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
    </>
  ),
  'vectors': (
    <>
      <path d="M12 8 V52 H58" strokeOpacity=".4"/>
      <path d="M12 52 H44 M44 52 V20" strokeDasharray="3 4" strokeOpacity=".7"/>
      <path d="M12 52 L44 20" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M39.2 21.4 L44.0 20.0 L42.6 24.8" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'matrices': (
    <>
      <path d="M18 12 H11 V52 H18 M46 12 H53 V52 H46"/>
      <circle cx="25" cy="25" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="39" cy="25" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="25" cy="39" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="39" cy="39" r="2.6" fill="currentColor" stroke="none"/>
    </>
  ),
  'probability': (
    <>
      <path d="M8 32 L26 18 M8 32 L26 46"/>
      <path d="M26 18 L50 10 M26 18 L50 24 M26 46 L50 40" strokeOpacity=".6"/>
      <path d="M26 46 L50 54" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <circle cx="8" cy="32" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="26" cy="18" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="26" cy="46" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="52" cy="54" r="2.8" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
    </>
  ),
  'diffeq': (
    <>
      <path d="M12 8 V52 H58" strokeOpacity=".4"/>
      <path d="M12.0 12.0 L13.1 16.3 L14.2 19.8 L15.3 22.7 L16.4 25.0 L17.5 27.1 L18.6 28.8 L19.7 30.3 L20.8 31.7 L21.9 32.9 L23.0 33.9 L24.1 34.8 L25.2 35.7 L26.3 36.5 L27.4 37.2 L28.5 37.8 L29.6 38.4 L30.7 38.9 L31.8 39.4 L32.9 39.9 L34.0 40.3 L35.1 40.7 L36.2 41.1 L37.3 41.4 L38.4 41.8 L39.5 42.1 L40.6 42.4 L41.7 42.6 L42.8 42.9 L43.9 43.1 L45.0 43.4 L46.1 43.6 L47.2 43.8 L48.3 44.0 L49.4 44.2 L50.5 44.4 L51.6 44.5 L52.7 44.7 L53.8 44.9 L54.9 45.0 L56.0 45.2" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'arithmetic': (
    <>
      <path d="M14 18 Q7 32 14 46 M36 18 Q43 32 36 46"/>
      <path d="M19 32 H31 M25 26 V38" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M48 26 L58 38 M58 26 L48 38"/>
    </>
  ),
  'basic-geometry': (
    <>
      <rect x="10" y="18" width="44" height="28" fill="var(--diagram-accent, var(--brand-gold))" fillOpacity=".18" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M10 54 H54 M10 51 V57 M54 51 V57" strokeOpacity=".7"/>
    </>
  ),
  'proportions': (
    <>
      <rect x="8" y="18" width="48" height="10" rx="2" fill="var(--diagram-accent, var(--brand-gold))" fillOpacity=".3" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <rect x="8" y="36" width="24" height="10" rx="2"/>
      <path d="M32 30 V34" strokeOpacity="0"/>
    </>
  ),
  'decimals-percentages': (
    <>
      <circle cx="19" cy="20" r="7"/>
      <circle cx="45" cy="44" r="7"/>
      <path d="M48 12 L16 52" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'angles': (
    <>
      <path d="M30 36 H52 A22 22 0 0 0 42.6 18.0 Z" fill="var(--diagram-accent, var(--brand-gold))" fillOpacity=".25" stroke="none"/>
      <circle cx="30" cy="36" r="22" strokeOpacity=".45"/>
      <path d="M30 36 H52 M30 36 L42.6 18.0"/>
      <path d="M52 36 A22 22 0 0 0 42.6 18.0" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'multiplication': (
    <>
      <circle cx="14" cy="20" r="3.2" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="26" cy="20" r="3.2" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="38" cy="20" r="3.2" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="50" cy="20" r="3.2" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="14" cy="32" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="26" cy="32" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="38" cy="32" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="50" cy="32" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="14" cy="44" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="26" cy="44" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="38" cy="44" r="3.2" fill="currentColor" stroke="none"/>
      <circle cx="50" cy="44" r="3.2" fill="currentColor" stroke="none"/>
    </>
  ),
  'fraction-ops': (
    <>
      <path d="M8 32 H22 M42 32 H56"/>
      <path d="M27 32 H37 M32 27 V37" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <circle cx="15" cy="22" r="3" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="42" r="3" fill="currentColor" stroke="none"/>
      <circle cx="49" cy="22" r="3" fill="currentColor" stroke="none"/>
      <circle cx="49" cy="42" r="3" fill="currentColor" stroke="none"/>
    </>
  ),
  'negative-numbers': (
    <>
      <path d="M6 36 H58"/>
      <path d="M14 32 V40 M23 32 V40 M41 32 V40 M50 32 V40" strokeOpacity=".6"/>
      <path d="M32 27 V45"/>
      <path d="M32 20 H13" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M16.9 22.2 L13.0 20.0 L16.9 17.8" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'exponents-roots': (
    <>
      <path d="M8 36 L14 34 L22 52 L32 14 H58"/>
      <rect x="40" y="26" width="13" height="13" rx="1.5" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  measures: (
    <>
      <rect x="6" y="24" width="52" height="16" rx="2"/>
      <path d="M14 24 V31 M22 24 V34 M30 24 V31 M38 24 V34 M46 24 V31" strokeOpacity=".6"/>
      <path d="M50 24 V36" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'thermodynamics': (
    <>
      <rect x="12" y="16" width="40" height="36" rx="3"/>
      <path d="M8 16 H56" strokeWidth="4"/>
      <circle cx="22" cy="28" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="38" cy="25" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="30" cy="38" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="44" cy="40" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
      <circle cx="21" cy="45" r="2.6" fill="var(--diagram-accent, var(--brand-gold))" stroke="none"/>
    </>
  ),
  'momentum': (
    <>
      <circle cx="16" cy="34" r="10"/>
      <path d="M30 34 H42" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M38.1 31.8 L42.0 34.0 L38.1 36.2" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <circle cx="52" cy="34" r="6" fill="var(--diagram-accent, var(--brand-gold))" fillOpacity=".3" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'statistics': (
    <>
      <path d="M6 52 H58" strokeOpacity=".4"/>
      <path d="M32 14 V52" strokeDasharray="3 4" strokeOpacity=".6"/>
      <path d="M6.0 49.2 L7.0 48.9 L8.0 48.6 L9.0 48.2 L10.0 47.7 L11.0 47.0 L12.0 46.3 L13.0 45.4 L14.0 44.4 L15.0 43.1 L16.0 41.8 L17.0 40.2 L18.0 38.5 L19.0 36.7 L20.0 34.7 L21.0 32.6 L22.0 30.5 L23.0 28.3 L24.0 26.1 L25.0 24.1 L26.0 22.1 L27.0 20.4 L28.0 18.9 L29.0 17.7 L30.0 16.7 L31.0 16.2 L32.0 16.0 L33.0 16.2 L34.0 16.7 L35.0 17.7 L36.0 18.9 L37.0 20.4 L38.0 22.1 L39.0 24.1 L40.0 26.1 L41.0 28.3 L42.0 30.5 L43.0 32.6 L44.0 34.7 L45.0 36.7 L46.0 38.5 L47.0 40.2 L48.0 41.8 L49.0 43.1 L50.0 44.4 L51.0 45.4 L52.0 46.3 L53.0 47.0 L54.0 47.7 L55.0 48.2 L56.0 48.6 L57.0 48.9 L58.0 49.2" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'electromagnetism': (
    <>
      <rect x="6" y="26" width="20" height="12" rx="1.5"/>
      <path d="M16 26 V38" strokeOpacity=".6"/>
      <path d="M34 44 V24 a4 6 0 0 1 8 0 V44 M42 24 a4 6 0 0 1 8 0 V44 M50 24 a4 6 0 0 1 8 0 V44" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'quantum': (
    <>
      <path d="M6 32 H58" strokeOpacity=".35"/>
      <path d="M6.0 32.6 L6.7 32.7 L7.3 32.8 L8.0 32.7 L8.6 32.4 L9.2 32.0 L9.9 31.3 L10.6 30.7 L11.2 30.0 L11.8 29.6 L12.5 29.6 L13.2 30.1 L13.8 31.0 L14.4 32.4 L15.1 34.1 L15.8 35.8 L16.4 37.2 L17.1 37.8 L17.7 37.5 L18.4 36.1 L19.0 33.6 L19.6 30.4 L20.3 26.9 L20.9 23.8 L21.6 21.7 L22.2 21.1 L22.9 22.5 L23.6 25.7 L24.2 30.4 L24.9 35.8 L25.5 41.2 L26.1 45.4 L26.8 47.7 L27.4 47.4 L28.1 44.5 L28.8 39.3 L29.4 32.7 L30.1 25.7 L30.7 19.6 L31.4 15.5 L32.0 14.0 L32.6 15.5 L33.3 19.6 L34.0 25.7 L34.6 32.7 L35.2 39.3 L35.9 44.5 L36.5 47.4 L37.2 47.7 L37.9 45.4 L38.5 41.2 L39.1 35.8 L39.8 30.4 L40.5 25.7 L41.1 22.5 L41.8 21.1 L42.4 21.7 L43.0 23.8 L43.7 26.9 L44.4 30.4 L45.0 33.6 L45.6 36.1 L46.3 37.5 L47.0 37.8 L47.6 37.2 L48.2 35.8 L48.9 34.1 L49.5 32.4 L50.2 31.0 L50.9 30.1 L51.5 29.6 L52.1 29.6 L52.8 30.0 L53.5 30.7 L54.1 31.3 L54.8 32.0 L55.4 32.4 L56.0 32.7 L56.7 32.8 L57.4 32.7 L58.0 32.6" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
  'units': (
    <>
      <rect x="6" y="34" width="52" height="16" rx="2"/>
      <path d="M14 34 V41 M22 34 V44 M30 34 V41 M38 34 V44 M46 34 V41 M54 34 V41"/>
      <path d="M12 20 H50" stroke="var(--diagram-accent, var(--brand-gold))"/>
      <path d="M17 15 L12 20 L17 25 M45 15 L50 20 L45 25" stroke="var(--diagram-accent, var(--brand-gold))"/>
    </>
  ),
};

export default function LessonDiagram({ id, size = 40, className = '' }: { id: ConceptId; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {DIAGRAMS[id]}
    </svg>
  );
}
