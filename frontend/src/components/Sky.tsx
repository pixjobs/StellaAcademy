/**
 * The sky: a fixed scatter of stars, some of which twinkle, and now and then a
 * shooting star. Seeded, so the server and the browser draw the same sky.
 * All motion stops for anyone who has asked for reduced motion.
 */
function makeStars(count: number) {
  let seed = 20261011;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => {
    const big = rand() > 0.9;
    return {
      x: rand() * 1000,
      y: rand() * 600,
      r: big ? 1.5 + rand() * 0.9 : 0.4 + rand() * 0.8,
      o: 0.35 + rand() * 0.6,
      warm: rand() > 0.82,
      twinkle: rand() > 0.6,
      period: 2.6 + rand() * 4.4,
      offset: rand() * 7,
    };
  });
}

export default function Starfield({ count = 150, className = '' }: { count?: number; className?: string }) {
  const stars = makeStars(count);
  return (
    <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}>
      <defs>
        <linearGradient id="shooting-star-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x.toFixed(1)}
          cy={s.y.toFixed(1)}
          r={s.r.toFixed(2)}
          fill={s.warm ? '#fde9b0' : '#ffffff'}
          className={s.twinkle ? 'star-twinkle' : undefined}
          style={
            {
              opacity: s.o.toFixed(2),
              '--star-o': s.o.toFixed(2),
              ...(s.twinkle ? { animationDuration: `${s.period.toFixed(1)}s`, animationDelay: `-${s.offset.toFixed(1)}s` } : {}),
            } as React.CSSProperties
          }
        />
      ))}
      {/* Two shooting stars on long, different cycles, so they never feel like a loop. */}
      <g transform="translate(760 70) rotate(-22)">
        <rect className="shooting-star" width="90" height="1.6" rx="0.8" fill="url(#shooting-star-trail)" style={{ animationDuration: '17s', animationDelay: '-11s' }} />
      </g>
      <g transform="translate(340 40) rotate(-34)">
        <rect className="shooting-star" width="70" height="1.4" rx="0.7" fill="url(#shooting-star-trail)" style={{ animationDuration: '29s', animationDelay: '-4s' }} />
      </g>
    </svg>
  );
}

/** The curve of a planet's edge: where the night sky meets the page. */
export function Horizon() {
  return (
    <svg viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-[70px] w-full sm:h-[100px]">
      <path d="M0 110 V78 Q720 -40 1440 78 V110 Z" fill="var(--paper)" />
      <path d="M0 78 Q720 -40 1440 78" fill="none" stroke="#7dd3fc" strokeOpacity="0.55" strokeWidth="2" />
      <path d="M0 72 Q720 -46 1440 72" fill="none" stroke="#7dd3fc" strokeOpacity="0.16" strokeWidth="10" />
    </svg>
  );
}

const SKY = 'bg-[linear-gradient(180deg,#05081a_0%,#0b1026_58%,#1a2060_100%)]';

/**
 * The night sky that opens every page, ending at the curve of a planet where
 * the paper begins. Children are laid out on the usual page width.
 */
export function SkyBand({ children, stars = 110, className = '' }: { children: React.ReactNode; stars?: number; className?: string }) {
  return (
    <div className={`theme-night relative overflow-hidden ${SKY} pb-24 sm:pb-32 ${className}`}>
      <Starfield count={stars} />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">{children}</div>
      <Horizon />
    </div>
  );
}

/** A plain page title under the sky, for pages that are not lessons. */
export function SkyTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <SkyBand>
      <h1 className="font-fraunces text-5xl font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-6xl">{title}</h1>
      {children && <p className="mt-4 max-w-2xl text-xl leading-relaxed text-slate-200">{children}</p>}
    </SkyBand>
  );
}
