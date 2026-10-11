import { SITE_NAME } from '@/lib/site';

/**
 * The star is an astroid, x^(2/3) + y^(2/3) = a^(2/3): the curve traced by a
 * point on a circle rolling inside one four times its size. Path sampled from
 * x = a cos^3 t, y = a sin^3 t.
 */
const ASTROID = 'M41.50 24.00L41.17 24.02L40.22 24.19L38.72 24.63L36.80 25.43L34.62 26.64L32.36 28.24L30.19 30.19L28.24 32.36L26.64 34.62L25.43 36.80L24.63 38.72L24.19 40.22L24.02 41.17L24.00 41.50L23.98 41.17L23.81 40.22L23.37 38.72L22.57 36.80L21.36 34.62L19.76 32.36L17.81 30.19L15.64 28.24L13.38 26.64L11.20 25.43L9.28 24.63L7.78 24.19L6.83 24.02L6.50 24.00L6.83 23.98L7.78 23.81L9.28 23.37L11.20 22.57L13.38 21.36L15.64 19.76L17.81 17.81L19.76 15.64L21.36 13.38L22.57 11.20L23.37 9.28L23.81 7.78L23.98 6.83L24.00 6.50L24.02 6.83L24.19 7.78L24.63 9.28L25.43 11.20L26.64 13.38L28.24 15.64L30.19 17.81L32.36 19.76L34.62 21.36L36.80 22.57L38.72 23.37L40.22 23.81L41.17 23.98Z';

export const BRAND_GOLD = '#F6C453';
export const BRAND_NIGHT = '#0B1026';

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="22" fill={BRAND_GOLD} />
      <path d={ASTROID} fill={BRAND_NIGHT} />
    </svg>
  );
}

/** Mark plus wordmark. The wordmark is live text so it scales with the reader's display settings. */
export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} className="shrink-0" />
      <span className="font-fraunces text-xl font-semibold leading-none tracking-[-0.015em] text-white">{SITE_NAME}</span>
    </span>
  );
}
