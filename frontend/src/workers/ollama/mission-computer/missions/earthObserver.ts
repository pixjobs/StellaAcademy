/* eslint-disable no-console */
import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic } from '@/types/mission';
import {
  fetchEpicRich,
  epicLatest,
  buildArchiveHref,
  type EpicKind,
} from '../../apis/epic';
import { ensureMissionPlan, ensureTopic } from '../shared/core';
import type { GenerationOpts } from '../shared/types';

/**
 * Earth Observer — camera/product–driven mission.
 * Role is intentionally ignored to prioritize EPIC product modes.
 */
export async function missionEarthObserver(
  _role: Role,
  _context: WorkerContext,
  options?: GenerationOpts,
): Promise<EnrichedMissionPlan> {
  const logPrefix = '[mission][earth-observer]';

  // Deterministic variety across retries
  const baseSeed = (options?.seedIndex ?? Date.now()) >>> 0;
  const attempt  = Math.max(1, options?.attempt ?? 1);
  const seed     = ((baseSeed ^ (attempt * 0x9E3779B1)) >>> 0);

  // Tunables (env-overridable)
  const SAMPLE_DATES_BASE = clamp(intFromEnv('EO_SAMPLE_DATES', 2), 1, 4);   // default 2
  const ITEMS_PER_DATE_BASE = clamp(intFromEnv('EO_ITEMS_PER_DATE', 6), 3, 10); // default 6
  const MAX_TOPIC_IMAGES = clamp(intFromEnv('EO_MAX_TOPIC_IMAGES', 10), 4, 16);
  const MAX_TOPICS = clamp(intFromEnv('EO_MAX_TOPICS', 4), 1, 4);
  const REACH_CONCURRENCY = clamp(intFromEnv('EO_REACH_CONCURRENCY', 4), 1, 8);
  const REACH_TIMEOUT_MS = clamp(intFromEnv('EO_REACH_TIMEOUT_MS', 7000), 1500, 15000);

  // Slight deterministic wiggle
  const sampleDatesPerKind = clamp(SAMPLE_DATES_BASE + (seed & 1), 1, 4);          // 1–4 dates/kind
  const itemsPerDate       = clamp(ITEMS_PER_DATE_BASE + ((seed >>> 1) % 2), 3, 10); // 3–10 items/date

  // Prefer JPGs (smaller, reliably present). Pass the key if you have it.
  const apiKey = process.env.NASA_API_KEY ?? '';

  // ------- Stage 1: normal path (recent) -------
  let rich = await safeFetchEpicRich(
    {
      kinds: ['natural', 'enhanced', 'cloud', 'aerosol'],
      preferRecent: true,
      sampleDatesPerKind,
      itemsPerDate,
      seed,
      imageType: 'jpg',
    },
    apiKey,
    `${logPrefix} stage1`
  );

  // ------- Stage 2: retry with tighter variance if still empty -------
  if (rich.length === 0) {
    rich = await safeFetchEpicRich(
      {
        kinds: ['natural', 'enhanced', 'cloud', 'aerosol'],
        preferRecent: true,
        sampleDatesPerKind: Math.max(1, sampleDatesPerKind - 1),
        itemsPerDate,
        seed: seed ^ 0xA5A5A5A5,
        imageType: 'jpg',
      },
      apiKey,
      `${logPrefix} stage2`
    );
  }

  // ------- Stage 3: hard fallback to latest per kind -------
  if (rich.length === 0) {
    console.warn(`${logPrefix} falling back to epicLatest per kind`);
    const kinds: EpicKind[] = ['natural', 'enhanced', 'cloud', 'aerosol'];
    const hard: Array<{ kind: EpicKind; date: string; href: string; caption?: string; lat?: number; lon?: number }> = [];
    const seen = new Set<string>();

    for (const k of kinds) {
      try {
        const metas = await epicLatest(k, apiKey);
        for (const m of metas.slice(0, itemsPerDate)) {
          const ymd = String(m.date ?? '').slice(0, 10);
          if (!m.image || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) continue;
          const href = buildArchiveHref(k, ymd, m.image, 'jpg');
          if (!href || seen.has(href)) continue;
          seen.add(href);
          hard.push({
            kind: k,
            date: ymd,
            href,
            caption: m.caption,
            lat: m.centroid_coordinates?.lat,
            lon: m.centroid_coordinates?.lon,
          });
        }
      } catch (e) {
        console.warn(`${logPrefix} epicLatest failed for kind=${k}`, e);
      }
    }
    rich = hard;
  }

  // Group by kind and dedupe by href
  const byKind = groupEpicByKind(rich);

  // Reachability filter (HEAD w/ 1-byte GET fallback), capped concurrency
  for (const k of ['natural', 'enhanced', 'cloud', 'aerosol'] as const) {
    const items = byKind[k];
    if (!items?.length) continue;

    const reachable = await mapWithConcurrency(items, REACH_CONCURRENCY, async (it) => {
      const ok = await headOrRangeCheck(it.href, REACH_TIMEOUT_MS);
      return ok ? it : null;
    });

    // compact, dedupe again, and cap per-topic images
    byKind[k] = dedupeByHref(reachable.filter(Boolean) as typeof items).slice(0, MAX_TOPIC_IMAGES);
  }

  // Build topics (keep only non-empty, cap total topics)
  const topics: EnrichedTopic[] = [];
  for (const kind of ['natural', 'enhanced', 'cloud', 'aerosol'] as const) {
    const items = byKind[kind] ?? [];
    if (items.length === 0) continue;

    const picked = pickDeterministic(items, Math.min(items.length, MAX_TOPIC_IMAGES), seed ^ kind.length);
    const title = titleFor(kind);
    const summary = summaryFor(kind, picked);
    const images = picked.map((i) => ({
      title: imgTitle(kind, i.date, i.caption, i.lat, i.lon),
      href: i.href,
    }));

    topics.push(ensureTopic({ title, summary, images }));
    if (topics.length >= MAX_TOPICS) break;
  }

  // Final fallback if we still somehow have no images/topics
  if (topics.length === 0 || topics.every(t => (t.images?.length ?? 0) === 0)) {
    console.warn(`${logPrefix} no live images after reachability; returning educational fallback`);
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

  return ensureMissionPlan({
    missionTitle: 'Earth Observer',
    introduction:
      'Learn to interpret multiple EPIC products (natural, enhanced, cloud fraction, aerosol index) using full-disk imagery from DSCOVR at L1.',
    topics,
  });
}

/* ─────────────────────────────────────────────────────────
   Hardened fetch wrapper + helpers
────────────────────────────────────────────────────────── */

async function safeFetchEpicRich(
  base: Parameters<typeof fetchEpicRich>[0],
  apiKey: string,
  tag: string,
) {
  try {
    return await fetchEpicRich(base, apiKey);
  } catch (e) {
    console.warn(`${tag} fetchEpicRich failed`, e);
    return [];
  }
}

type Grouped = Record<
  'natural' | 'enhanced' | 'cloud' | 'aerosol',
  Array<{ date: string; href: string; caption?: string; lat?: number; lon?: number }>
>;

function groupEpicByKind(
  items: Array<{ kind: EpicKind; date: string; href: string; caption?: string; lat?: number; lon?: number }>
): Grouped {
  const out: Grouped = { natural: [], enhanced: [], cloud: [], aerosol: [] };
  for (const it of items) {
    const k = it.kind;
    if (k === 'natural' || k === 'enhanced' || k === 'cloud' || k === 'aerosol') {
      if (!it.href) continue;
      out[k].push({ date: it.date, href: it.href, caption: it.caption, lat: it.lat, lon: it.lon });
    }
  }
  return out;
}

function dedupeByHref<T extends { href: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    if (!it.href || seen.has(it.href)) continue;
    seen.add(it.href);
    out.push(it);
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

function intFromEnv(name: string, def: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : def;
}

/* ─────────────────────────────────────────────────────────
   Reachability (HEAD with GET range fallback)
────────────────────────────────────────────────────────── */

async function headOrRangeCheck(url: string, timeoutMs: number, attempt = 1): Promise<boolean> {
  const to = AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
  try {
    const res = await fetch(url, { method: 'HEAD', signal: to });
    if (res.ok) return true;
    // Some CDNs reject HEAD — probe with a 1-byte range GET
    const res2 = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, signal: to });
    return res2.ok || res2.status === 206;
  } catch (e) {
    if (attempt < 2 && /ECONN|ETIMEDOUT|network|fetch failed|aborted/i.test(String(e))) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 600));
      return headOrRangeCheck(url, timeoutMs, attempt + 1);
    }
    return false;
  }
}

async function mapWithConcurrency<T, R>(
  arr: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const ret: R[] = new Array(arr.length);
  let i = 0;
  let running = 0;
  return await new Promise<R[]>((resolve) => {
    const next = () => {
      while (running < concurrency && i < arr.length) {
        const idx = i++;
        running++;
        void fn(arr[idx], idx)
          .then((v) => { ret[idx] = v; })
          .catch(() => { (ret as (R | undefined)[])[idx] = undefined as unknown as R; })
          .finally(() => {
            running--;
            if (i >= arr.length && running === 0) resolve(ret);
            else next();
          });
      }
    };
    next();
  });
}
