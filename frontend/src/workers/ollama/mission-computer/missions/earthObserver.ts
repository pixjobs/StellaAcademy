/* eslint-disable no-console */
import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic } from '@/types/mission';
import { fetchEpicRich, type EpicKind } from '../../apis/epic';
import { ensureMissionPlan, ensureTopic } from '../shared/core';
import type { GenerationOpts } from '../shared/types';

/**
 * Earth Observer — camera/product–driven mission.
 * Role is intentionally ignored to prioritize EPIC product modes.
 */
export async function missionEarthObserver(
  _role: Role,             // role intentionally ignored
  _context: WorkerContext, // (reserved for future caching/telemetry)
  options?: GenerationOpts, // <-- seedIndex/attempt supported to diversify
): Promise<EnrichedMissionPlan> {
  const logPrefix = '[mission][earth-observer]';

  // Mix seedIndex + attempt for deterministic variety across retries
  const baseSeed = (options?.seedIndex ?? Date.now()) >>> 0;
  const attempt  = Math.max(1, options?.attempt ?? 1);
  const seed     = ((baseSeed ^ (attempt * 0x9E3779B1)) >>> 0);

  // Vary sampling a little based on the seed (within safe bounds)
  const sampleDatesPerKind = clamp(2 + (seed & 1), 2, 3);   // 2–3 dates/kind
  const itemsPerDate       = clamp(5 + ((seed >>> 1) % 3), 5, 7); // 5–7 items/date

  let rich: Awaited<ReturnType<typeof fetchEpicRich>> = [];
  try {
    rich = await fetchEpicRich({
      kinds: ['natural', 'enhanced', 'cloud', 'aerosol'],
      preferRecent: true,
      sampleDatesPerKind,
      itemsPerDate,
      seed,
      imageType: 'jpg',
    });
  } catch (e) {
    console.warn(`${logPrefix} EPIC call failed; using educational fallback.`, e);
  }

  const byKind = groupEpicByKind(rich);

  const total =
    (byKind.natural?.length ?? 0) +
    (byKind.enhanced?.length ?? 0) +
    (byKind.cloud?.length ?? 0) +
    (byKind.aerosol?.length ?? 0);

  // If NASA/EPIC is unavailable or empty, return a deterministic, educational plan.
  if (total === 0) {
    const topic = ensureTopic({
      title: 'Reading Earth from L1',
      summary:
        'This mission explains natural vs. enhanced color, cloud fraction, and aerosol index products from the DSCOVR/EPIC instrument at L1. Identify the day/night terminator, large spiral storm systems, and sunglint over oceans.',
      images: [],
    });
    return ensureMissionPlan({
      missionTitle: 'Earth Observer',
      introduction:
        'Observe the full Earth disk and learn what each EPIC product reveals about weather and aerosols.',
      topics: [topic],
    });
  }

  // Build topics in a consistent order; slice deterministically with seed
  const topics: EnrichedTopic[] = [];
  (['natural', 'enhanced', 'cloud', 'aerosol'] as const).forEach((kind) => {
    const items = byKind[kind] ?? [];
    if (items.length === 0) return;

    // Deterministic shuffle/slice to reduce duplicate hashes across attempts
    const picked = pickDeterministic(items, 10, seed ^ kind.length);
    const title = titleFor(kind);
    const summary = summaryFor(kind, picked);
    const images = picked.map((i) => ({
      title: imgTitle(kind, i.date, i.caption, i.lat, i.lon),
      href: i.href,
    }));

    topics.push(ensureTopic({ title, summary, images }));
  });

  // Defensive: if filtering produced nothing (shouldn’t happen), keep it educational.
  if (topics.length === 0) {
    const topic = ensureTopic({
      title: 'Interpreting EPIC Products',
      summary:
        'Use full-disk imagery to compare natural and enhanced color products, locate cloud systems with cloud fraction, and identify particle plumes via aerosol index.',
      images: [],
    });
    topics.push(topic);
  }

  return ensureMissionPlan({
    missionTitle: 'Earth Observer',
    introduction:
      'Learn to interpret multiple EPIC products (natural, enhanced, cloud fraction, aerosol index) using full-disk imagery from DSCOVR at L1.',
    topics,
  });
}

/* ─────────────────────────────────────────────────────────
   Helpers (exhaustive returns)
────────────────────────────────────────────────────────── */

type Grouped = Record<
  'natural' | 'enhanced' | 'cloud' | 'aerosol',
  Array<{ date: string; href: string; caption?: string; lat?: number; lon?: number }>
>;

function groupEpicByKind(items: Awaited<ReturnType<typeof fetchEpicRich>>): Grouped {
  const out: Grouped = { natural: [], enhanced: [], cloud: [], aerosol: [] };
  for (const it of items) {
    if (it.kind === 'natural' || it.kind === 'enhanced' || it.kind === 'cloud' || it.kind === 'aerosol') {
      out[it.kind].push({
        date: it.date,
        href: it.href,
        caption: it.caption,
        lat: it.lat,
        lon: it.lon,
      });
    }
  }
  return out;
}

function titleFor(kind: EpicKind): string {
  switch (kind) {
    case 'natural':  return 'Natural Color — “Blue Marble”';
    case 'enhanced': return 'Enhanced Color — Particle/Atmosphere Emphasis';
    case 'cloud':    return 'Cloud Fraction — Reading Weather Structure';
    case 'aerosol':  return 'Aerosol Index — Dust, Smoke, and Ash';
    default:         return 'EPIC Product';
  }
}

function firstCaption(items: { caption?: string }[], minLen = 60): string | null {
  for (const it of items) {
    const c = it.caption?.trim();
    if (c && c.length >= minLen) return c;
  }
  return null;
}

function summaryFor(
  kind: EpicKind,
  items: { caption?: string; date: string }[],
): string {
  const example = firstCaption(items) ?? '';
  const dateHint = new Date(items[0]?.date ?? Date.now()).toISOString().slice(0, 10);
  const common =
    'Start from the visible patterns on the full Earth disk: continents, oceans, spiral storms, fronts, and the day/night terminator.';

  const suffix = example
    ? ` Example from the data: ${example.slice(0, 300)}${example.length > 300 ? '…' : ''}`
    : ` Compare your observations with the official caption for ${dateHint}.`;

  switch (kind) {
    case 'natural':
      return [
        'Natural color approximates what the eye sees.',
        'Use it to identify large cloud systems and surface features like dust outbreaks or green vegetation.',
        common, suffix,
      ].join(' ');
    case 'enhanced':
      return [
        'Enhanced color accentuates atmospheric constituents and subtle features.',
        'Colors may not be “true” but improve detection of aerosols and thin clouds.',
        common, suffix,
      ].join(' ');
    case 'cloud':
      return [
        'Cloud fraction estimates the portion of each pixel covered by cloud.',
        'High values indicate overcast; gradients outline fronts and storm bands.',
        common, suffix,
      ].join(' ');
    case 'aerosol':
      return [
        'Aerosol index highlights scattering/absorption by particles such as dust, smoke, or ash.',
        'Trace a plume from source to downwind regions to infer transport.',
        common, suffix,
      ].join(' ');
    default:
      return [common, suffix].join(' ');
  }
}

function imgTitle(
  kind: EpicKind,
  iso: string,
  caption?: string,
  lat?: number,
  lon?: number,
): string {
  const d = new Date(iso);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const where = (typeof lat === 'number' && typeof lon === 'number')
    ? ` @ ${lat.toFixed(1)}°, ${lon.toFixed(1)}°`
    : '';
  const label =
    kind === 'natural'  ? 'Natural' :
    kind === 'enhanced' ? 'Enhanced' :
    kind === 'cloud'    ? 'Cloud Frac' :
    kind === 'aerosol'  ? 'Aerosol Idx' :
                          'EPIC';
  const cap = caption ? ` — ${caption.slice(0, 60)}${caption.length > 60 ? '…' : ''}` : '';
  return `${label} • ${date}${where}${cap}`;
}

/* deterministic pick (seeded Fisher–Yates) */
function pickDeterministic<T>(arr: readonly T[], count: number, seed: number): T[] {
  if (count >= arr.length) return [...arr];
  let s = seed >>> 0;
  const rand = () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
