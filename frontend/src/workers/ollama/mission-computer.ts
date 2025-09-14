/* eslint-disable no-console */
// workers/ollama/mission-computer.ts
/**
 * MISSION COMPUTER (hardened)
 * - Uses WorkerContext (redis + bottleneck)
 * - NASA is optional; logs when enabled (DEBUG_NASA=1)
 * - Always returns a plan; never blocks on NASA
 */

import type { Redis } from 'ioredis';
import { fetchEpicRich, type EpicKind } from '@/lib/nasa/epic';
import { searchNIVL, fetchAPOD, fetchLatestMarsPhotos, fetchEPICSmart } from '@/lib/nasa';
import { callOllama } from './ollama-client';
import type { Role, MarsPhoto, MissionType, NivlItem } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';
import type { WorkerContext } from './context';

const DEBUG_NASA = process.env.DEBUG_NASA === '1';
const logNasa = (...args: unknown[]) => { if (DEBUG_NASA) console.log('[NASA]', ...args); };

const QUERY_AGGREGATION_TIMEOUT_MS = 15_000;
const CACHE_KEYS = { NIVL_QUERY_PREFIX: 'nivl-query:' } as const;
const CACHE_TTL_SECONDS = { NIVL: 86_400 } as const; // 24h

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { missionTitle: string; introduction: string; topics: RawTopic[] };
type Apod = { title?: string; explanation?: string; bgUrl?: string };
type EpicItem = { date: string; href: string };

function isRecord(x: unknown): x is Record<string, unknown> { return typeof x === 'object' && x !== null; }
function isApod(x: unknown): x is Apod {
  if (!isRecord(x)) return false;
  return (
    (x.title === undefined || typeof x.title === 'string') &&
    (x.explanation === undefined || typeof x.explanation === 'string') &&
    (x.bgUrl === undefined || typeof x.bgUrl === 'string')
  );
}
function isEpicItem(x: unknown): x is EpicItem { return isRecord(x) && typeof x.date === 'string' && typeof x.href === 'string'; }
function isEpicArray(x: unknown): x is EpicItem[] { return Array.isArray(x) && x.every(isEpicItem); }
function isMarsPhotoArray(x: unknown): x is MarsPhoto[] {
  return Array.isArray(x) && x.every((p) =>
    isRecord(p) &&
    typeof p.img_src === 'string' &&
    typeof p.earth_date === 'string' &&
    isRecord(p.camera) &&
    typeof (p.camera as { name?: unknown }).name === 'string'
  );
}

type AudienceSpec = { level: string; promptNote: string; introNote: string };
function audienceSpec(role: Role): AudienceSpec {
  switch (role) {
    case 'explorer': return { level: 'kids (8-12)', promptNote: 'Year 4–6 level; friendly & short.', introNote: 'Written for younger explorers.' };
    case 'cadet':    return { level: 'teens',       promptNote: 'Motivated teens; precise but light.', introNote: 'Geared to cadets.' };
    case 'scholar':  return { level: 'undergrad',   promptNote: 'Concise & technical.',               introNote: 'Uses proper terminology.' };
    default:         return { level: 'general',     promptNote: 'Clear & concise.',                   introNote: 'For a general audience.' };
  }
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
function jitter(baseMs: number): number { return Math.floor(baseMs * (0.6 + Math.random() * 0.8)); }

type RetryOpts = { attempts?: number; baseDelayMs?: number; maxDelayMs?: number; onError?: (err: unknown, attempt: number) => void };
async function retry<T>(fn: () => Promise<T>, options?: RetryOpts): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 700;
  const maxDelayMs = options?.maxDelayMs ?? 5_000;
  for (let a = 1; a <= attempts; a += 1) {
    try { return await fn(); }
    catch (err) {
      options?.onError?.(err, a);
      if (a === attempts) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (a - 1), maxDelayMs);
      await sleep(jitter(delay));
    }
  }
  throw new Error('Retry exhausted');
}

function requireBottleneck(ctx: WorkerContext): { submit<T>(fn: () => Promise<T>): Promise<T> } {
  const b = (ctx as unknown as { llmBottleneck?: unknown }).llmBottleneck;
  if (!b || typeof (b as { submit?: unknown }).submit !== 'function') {
    throw new Error('[mission] llmBottleneck missing from WorkerContext (no submit). Ensure bootstrap injects it.');
  }
  return b as { submit<T>(fn: () => Promise<T>): Promise<T> };
}
function hasNasaApiKey(): boolean { return typeof process.env.NASA_API_KEY === 'string' && process.env.NASA_API_KEY.trim().length > 0; }

export async function computeMission(
  role: Role,
  missionType: MissionType,
  context: WorkerContext,
  options?: { seedIndex?: number },
): Promise<EnrichedMissionPlan> {
  if (!context || !(context as unknown as { redis?: Redis }).redis) {
    console.error('[mission] WorkerContext missing Redis.');
    return createFallbackMission('Missing Redis in WorkerContext');
  }
  try {
    switch (missionType) {
      case 'space-poster':         return computeSpacePosterMission(role, context);
      case 'rocket-lab':           return computeRocketLabMission(role, context);
      case 'rover-cam':            return computeRoverCamMission(role, context);
      case 'earth-observer':       return computeEarthObserverMission(role, context, options); // <-- pass options
      case 'celestial-investigator': return computeCelestialInvestigatorMission(role, context, options);
      default:
        console.warn(`[mission] Unknown missionType '${missionType}'. Falling back to Rocket Lab.`);
        return computeRocketLabMission(role, context);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[mission] FATAL: computeMission failed for type='${missionType}' role='${role}'.`, error);
    return createFallbackMission(error.message);
  }
}

/* ─────────────────────────────────────────────────────────
  Mission impls
────────────────────────────────────────────────────────── */
async function computeRocketLabMission(role: Role, context: WorkerContext): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const system = [
    'Return ONLY a JSON array of 3-5 topic objects in this schema:',
    '[',
    '  { "title": "Topic Title", "summary": "1-2 sentences", "keywords": ["k1"], "searchQueries": ["q1"] }',
    ']',
    'Guidelines:',
    '- Topics: rocket components, orbital mechanics, launch procedures.',
    `- Audience: ${aud.level}. ${aud.promptNote}`,
  ].join('\n');

  const bottleneck = requireBottleneck(context);
  const llmOut = await retry(
    () => bottleneck.submit(() => callOllama(system, { temperature: 0.8 })),
    { onError: (e, a) => console.warn(`[mission][llm] rocket-lab topics attempt ${a} failed`, e) }
  );

  const parsedTopics = extractFirstJsonArray(llmOut);
  if (!parsedTopics || parsedTopics.length === 0) throw new Error('LLM did not return parseable topics array.');

  const base = validateMissionJson({ topics: parsedTopics });

  const topics = await Promise.all(
    base.topics.map(async (t) => {
      const seeds = t.searchQueries.length ? t.searchQueries : t.keywords.length ? t.keywords : [t.title];
      let images: Img[] = [];
      if (hasNasaApiKey()) {
        try {
          images = await retry(() => tryNivlQueries(seeds, context.redis, 6), { attempts: 2 });
          logNasa('RocketLab NIVL', { seeds, images: images.length });
        } catch (e) {
          console.warn('[mission][nasa] NIVL failed (rocket-lab). Continuing without images.', e);
        }
      } else {
        logNasa('NASA_API_KEY not set; skipping NIVL for Rocket Lab.');
      }
      return ensureTopic({ ...t, images });
    })
  );

  return ensureMissionPlan({
    missionTitle: 'Rocket Lab Analysis',
    introduction: `Welcome, ${role}. Analyze key rocket systems. ${aud.introNote}`,
    topics,
  });
}

async function computeSpacePosterMission(role: Role, context: WorkerContext): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  let apod: Apod | null = null;
  if (hasNasaApiKey()) {
    try {
      const raw = await retry(() => fetchAPOD(), { attempts: 2 });
      apod = isApod(raw) ? raw : null;
      logNasa('APOD', apod);
    } catch (e) {
      console.warn('[mission][nasa] APOD failed. Continuing without APOD.', e);
    }
  } else {
    logNasa('NASA_API_KEY not set; skipping APOD');
  }

  const seeds = apod ? uniq([apod.title, 'nebula', 'galaxy', 'star cluster']) : ['nebula', 'galaxy', 'star cluster'];
  let extras: Img[] = [];
  if (hasNasaApiKey()) {
    try {
      extras = await retry(() => tryNivlQueries(seeds, context.redis, 8), { attempts: 2 });
      logNasa('SpacePoster NIVL', { seeds, images: extras.length });
    } catch (e) {
      console.warn('[mission][nasa] NIVL failed (space-poster).', e);
    }
  }
  const images = ensureImageList(apod?.bgUrl && apod.title ? [{ title: apod.title, href: apod.bgUrl }, ...extras] : extras).slice(0, 8);
  const summary = String(apod?.explanation || 'Create a space poster using astronomy concepts.').slice(0, 400);
  const topic = ensureTopic({ title: apod?.title || 'Explore the Cosmos', summary, images });

  return ensureMissionPlan({
    missionTitle: `Space Poster${apod?.title ? `: ${apod.title}` : ''}`,
    introduction: `Welcome, ${role}. Build a one-page space poster. ${aud.introNote}`,
    topics: [topic],
  });
}

async function computeRoverCamMission(role: Role, context: WorkerContext): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  let latestPhotos: MarsPhoto[] = [];
  if (hasNasaApiKey()) {
    try {
      const raw = await retry(() => fetchLatestMarsPhotos('curiosity'), { attempts: 2 });
      latestPhotos = isMarsPhotoArray(raw) ? raw : [];
      logNasa('RoverCam latestPhotos', { count: latestPhotos.length });
    } catch (e) {
      console.warn('[mission][nasa] Mars photos failed.', e);
    }
  } else {
    logNasa('NASA_API_KEY not set; skipping Mars photos.');
  }

  const cameraInfo: Record<string, { name: string; desc: string }> = {
    FHAZ: { name: 'Front Hazard Camera', desc: 'Views for avoiding obstacles.' },
    RHAZ: { name: 'Rear Hazard Camera',  desc: 'Views from the back for avoidance.' },
    MAST: { name: 'Mast Camera',        desc: 'Takes color images and videos.' },
    CHEMCAM: { name: 'Chemistry & Camera', desc: 'Analyzes rock composition.' },
    NAVCAM: { name: 'Navigation Camera', desc: 'Helps engineers drive the rover.' },
  };

  const topics = Object.entries(cameraInfo).map(([code, info]) => {
    const images = latestPhotos
      .filter((p) => (p.camera as { name?: string } | undefined)?.name === code)
      .map((p) => ({ title: `Curiosity ${(p.camera as { full_name?: string } | undefined)?.full_name ?? code} (${p.earth_date})`, href: p.img_src }));
    return ensureTopic({ title: `Latest from ${info.name}`, summary: info.desc, images });
  });

  return ensureMissionPlan({
    missionTitle: 'Latest Photos from Curiosity',
    introduction: `Welcome, ${role}. Explore rover cameras. ${aud.introNote}`,
    topics,
  });
}

async function computeEarthObserverMission(role: Role, context: WorkerContext): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const logPrefix = '[mission][earth-observer]';
  const seed = (Date.now() ^ role.length) >>> 0;

  // Ask for all four EPIC products to improve variety and education value.
  let rich = await fetchEpicRich({
    kinds: ['natural', 'enhanced', 'cloud', 'aerosol'],
    preferRecent: true,
    sampleDatesPerKind: 2,
    itemsPerDate: 6,
    seed,
    imageType: 'jpg',
  }).catch((e) => {
    console.warn(`${logPrefix} EPIC call failed; continuing with fallback.`, e);
    return [] as Awaited<ReturnType<typeof fetchEpicRich>>;
  });

  // Group by kind so we can make one topic per product.
  const byKind = groupEpicByKind(rich);
  console.log(`${logPrefix} counts`, Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, v.length])));

  // Build topics (ensure at least one).
  const topics: EnrichedTopic[] = [];
  const order: EpicKind[] = ['natural', 'enhanced', 'cloud', 'aerosol'];

  for (const kind of order) {
    const items = byKind[kind] ?? [];
    if (items.length === 0) continue;

    const title = topicTitleForKind(kind);
    const summary = educationalSummary(kind, items, aud.level);
    const images = items.slice(0, 10).map(i => ({ title: imgTitle(i), href: i.href }));
    topics.push(ensureTopic({ title, summary, images }));
  }

  if (topics.length === 0) {
    // Deterministic fallback: explicitly educational, no NASA dependency
    const fallbackTopic = ensureTopic({
      title: 'Reading Earth from L1',
      summary: [
        'This mission uses full-disc images from the DSCOVR spacecraft at the Sun–Earth L1 point.',
        'You will learn how natural color differs from enhanced products, how cloud fraction maps are read,',
        'and what aerosol index reveals about dust, smoke, and volcanic ash in the atmosphere.',
        'Look for the day/night terminator, large weather systems (spiral clouds), and bright sunglint over oceans.',
      ].join(' '),
      images: [],
    });

    return ensureMissionPlan({
      missionTitle: 'Earth Observer',
      introduction: `Observe Earth from deep space and interpret multi-product imagery. ${aud.introNote}`,
      topics: [fallbackTopic],
    });
  }

  return ensureMissionPlan({
    missionTitle: 'Earth Observer',
    introduction: [
      `Welcome, ${role}. From the DSCOVR/EPIC vantage at L1 we see the full Earth disk.`,
      `This mission teaches you to interpret multiple EPIC products (natural, enhanced, cloud, aerosol).`,
      aud.introNote,
      'Use the images to connect patterns you see with what the captions describe.',
    ].join(' '),
    topics,
  });
}

/* ─────────────────────────────────────────────────────────
   Helpers for Earth Observer
────────────────────────────────────────────────────────── */

type ByKind = Record<'natural' | 'enhanced' | 'cloud' | 'aerosol', Array<{
  kind: EpicKind; date: string; href: string; caption?: string; lat?: number; lon?: number;
}>>;

function groupEpicByKind(items: Awaited<ReturnType<typeof fetchEpicRich>>): ByKind {
  return items.reduce<ByKind>((acc, it) => {
    (acc[it.kind] ||= []).push(it);
    return acc;
  }, { natural: [], enhanced: [], cloud: [], aerosol: [] });
}

function topicTitleForKind(kind: EpicKind): string {
  switch (kind) {
    case 'natural':  return 'Natural Color — “Blue Marble”';
    case 'enhanced': return 'Enhanced Color — Particle/Atmosphere Emphasis';
    case 'cloud':    return 'Cloud Fraction — Reading Weather Structure';
    case 'aerosol':  return 'Aerosol Index — Dust, Smoke, and Ash';
  }
}

function firstNonEmptyCaption(items: { caption?: string }[], minLen = 60): string | null {
  for (const it of items) {
    const c = it.caption?.trim();
    if (c && c.length >= minLen) return c;
  }
  return null;
}

function educationalSummary(kind: EpicKind, items: { caption?: string; lat?: number; lon?: number; date: string }[], audience: string): string {
  const exampleCaption = firstNonEmptyCaption(items) ?? '';
  const dateHint = new Date(items[0]?.date ?? Date.now()).toISOString().slice(0, 10);

  const common = `Written for ${audience}. Start by describing what you see on the full Earth disk: continents, oceans, and broad weather systems. Note the day/night terminator if present, and look for sunglint on oceans.`;

  const suffix = exampleCaption
    ? ` Example from the data: ${exampleCaption.slice(0, 300)}${exampleCaption.length > 300 ? '…' : ''}`
    : ` These products include captions that describe conditions on ${dateHint}; compare your own observations with the provided text.`;

  switch (kind) {
    case 'natural':
      return [
        'Natural color imagery approximates what our eyes would see.',
        'Use it to identify large-scale cloud patterns (fronts, cyclones) and surface features (Saharan dust, green vegetation).',
        common,
        suffix,
      ].join(' ');

    case 'enhanced':
      return [
        'Enhanced color imagery highlights atmospheric constituents and surface/atmosphere contrast.',
        'Colors may not match “true color” but improve feature detection (e.g., aerosols, thin clouds).',
        common,
        suffix,
      ].join(' ');

    case 'cloud':
      return [
        'Cloud fraction maps indicate the portion of each pixel covered by cloud.',
        'High fractions (near 1) point to solid overcast; lower values suggest broken clouds or clear regions.',
        'Find spiral bands around low-pressure systems and the sharp gradients along fronts.',
        common,
        suffix,
      ].join(' ');

    case 'aerosol':
      return [
        'Aerosol index highlights scattering/absorption by particles like dust, smoke, or volcanic ash.',
        'Plumes often emerge from desert regions, wildfires, or eruptions and advect downwind with prevailing flow.',
        'Trace one plume from source to ocean and infer transport pathways.',
        common,
        suffix,
      ].join(' ');
  }
}

function imgTitle(it: { kind: EpicKind; date: string; caption?: string; lat?: number; lon?: number }): string {
  const d = new Date(it.date);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const where =
    typeof it.lat === 'number' && typeof it.lon === 'number'
      ? ` @ ${it.lat.toFixed(1)}°, ${it.lon.toFixed(1)}°`
      : '';
  const label = (() => {
    switch (it.kind) {
      case 'natural': return 'Natural';
      case 'enhanced': return 'Enhanced';
      case 'cloud': return 'Cloud Frac';
      case 'aerosol': return 'Aerosol Idx';
    }
  })();
  return `${label} • ${date}${where}${it.caption ? ` — ${it.caption.slice(0, 60)}${it.caption.length > 60 ? '…' : ''}` : ''}`;
}

async function computeCelestialInvestigatorMission(
  role: Role,
  context: WorkerContext,
  options?: { seedIndex?: number }
): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const targets = [
    'Orion Nebula','Andromeda Galaxy','Pillars of Creation','Crab Nebula','Hubble Deep Field',
    'Ring Nebula','Carina Nebula','Whirlpool Galaxy','Eagle Nebula','Horsehead Nebula',
  ];
  const target = options?.seedIndex !== undefined
    ? targets[Math.abs(options.seedIndex) % targets.length]
    : targets[Math.floor(Math.random() * targets.length)];

  const seeds = [target, 'Hubble Space Telescope', 'James Webb Space Telescope'];
  let images: Img[] = [];
  if (hasNasaApiKey()) {
    try {
      images = await retry(() => tryNivlQueries(seeds, context.redis, 8), { attempts: 2 });
      logNasa('CelestialInvestigator NIVL', { seeds, images: images.length });
    } catch (e) {
      console.warn('[mission][nasa] NIVL failed (celestial-investigator).', e);
    }
  }

  const topic = ensureTopic({ title: `Investigation: ${target}`, summary: `Images of ${target} from multiple observatories.`, images });
  return ensureMissionPlan({
    missionTitle: `Celestial Investigator: ${target}`,
    introduction: `Welcome, ${role}. Analyze ${target}. ${aud.introNote}`,
    topics: [topic],
  });
}

/* ─────────────────────────────────────────────────────────
  Helpers
────────────────────────────────────────────────────────── */
function stripFences(s: string): string {
  return s ? s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1').trim() : '';
}
function extractFirstJsonArray(text: string): Record<string, unknown>[] | null {
  if (!text) return null;
  const cleaned = stripFences(text);
  const start = cleaned.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (ch === '[') depth += 1;
    else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(cleaned.slice(start, i + 1));
          return Array.isArray(parsed) ? parsed : null;
        } catch { return null; }
      }
    }
  }
  return null;
}
function validateMissionJson(raw: unknown): RawMission {
  const o = isRecord(raw) ? raw : {};
  const topics = Array.isArray(o.topics) ? o.topics : [];
  return {
    missionTitle: typeof o.missionTitle === 'string' ? o.missionTitle.slice(0, 200) : 'Mission',
    introduction: typeof o.introduction === 'string' ? o.introduction.slice(0, 800) : 'Welcome.',
    topics: topics.slice(0, 8).map((t: unknown): RawTopic => {
      const to = isRecord(t) ? t : {};
      return {
        title: typeof to.title === 'string' ? to.title.slice(0, 160) : 'Topic',
        summary: typeof to.summary === 'string' ? to.summary.slice(0, 500) : '',
        keywords: Array.isArray(to.keywords)
          ? (to.keywords as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 5)
          : [],
        searchQueries: Array.isArray(to.searchQueries)
          ? (to.searchQueries as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 5)
          : [],
      };
    }),
  };
}
function uniq<T>(arr: Array<T | null | undefined>): T[] { return Array.from(new Set(arr.filter((x): x is T => x != null))); }

async function tryNivlQueries(seeds: string[], rds: Redis, limitPerQuery = 4): Promise<Img[]> {
  const queries = uniq(seeds).slice(0, 5);
  if (queries.length === 0) return [];

  const imageMap = new Map<string, Img>();
  const cacheKeys = queries.map((q) => `${CACHE_KEYS.NIVL_QUERY_PREFIX}${q.toLowerCase().replace(/\s+/g, '-')}`);
  let toFetch: string[] = [];

  // cache pass
  try {
    const cached = await rds.mget(cacheKeys);
    cached.forEach((json, i) => {
      if (json) {
        try {
          const imgs = JSON.parse(json) as Img[];
          for (const img of imgs) if (img?.href && img?.title && !imageMap.has(img.href)) imageMap.set(img.href, img);
        } catch { /* ignore */ }
      } else {
        toFetch.push(queries[i]);
      }
    });
  } catch (e) {
    console.error('[mission][redis] MGET failed, fetching all live.', e);
    toFetch = [...queries];
  }

  // live fetch
  if (toFetch.length > 0) {
    const searchPromises = toFetch.map((q) => searchNIVL(q, { limit: limitPerQuery }));
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('NIVL timeout')), QUERY_AGGREGATION_TIMEOUT_MS));
    try {
      const settled = (await Promise.race([Promise.allSettled(searchPromises), timeout])) as PromiseSettledResult<NivlItem[]>[];
      if (Array.isArray(settled)) {
        const pipeline = rds.pipeline();
        let dirty = false;
        settled.forEach((res, idx) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            const fetched: Img[] = res.value
              .map((item) => {
                const title = (item.data?.[0]?.title as string | undefined) ?? 'Untitled NASA Image';
                const href = item.links?.find((l) => l.rel === 'preview')?.href;
                return { title, href };
              })
              .filter((img): img is Img => typeof img.href === 'string' && img.href.length > 0);

            for (const img of fetched) if (!imageMap.has(img.href)) imageMap.set(img.href, img);

            if (fetched.length > 0) {
              const q = toFetch[idx];
              const key = `${CACHE_KEYS.NIVL_QUERY_PREFIX}${q.toLowerCase().replace(/\s+/g, '-')}`;
              pipeline.set(key, JSON.stringify(fetched), 'EX', CACHE_TTL_SECONDS.NIVL);
              dirty = true;
            }
          } else if (res.status === 'rejected') {
            console.error('[mission][nasa] NIVL query failed:', toFetch[idx], res.reason);
          }
        });
        if (dirty) await pipeline.exec().catch((e) => console.error('[mission][redis] pipeline exec failed', e));
      }
    } catch (e) {
      console.error('[mission] Live NIVL fetch failed', e);
    }
  }

  return Array.from(imageMap.values());
}

function ensureImageList(images: unknown): Img[] {
  if (!Array.isArray(images)) return [];
  return images.reduce<Img[]>((acc, i) => {
    if (isRecord(i) && typeof (i as { href?: unknown }).href === 'string' && (i as { href: string }).href.trim()) {
      acc.push({
        title: (typeof (i as { title?: unknown }).title === 'string' ? (i as { title: string }).title : 'Untitled').slice(0, 200),
        href: (i as { href: string }).href.trim(),
      });
    }
    return acc;
  }, []);
}
function ensureTopic(t: Partial<RawTopic> & { images?: unknown }): EnrichedTopic {
  return {
    title: (typeof t.title === 'string' ? t.title : 'Topic').slice(0, 160),
    summary: (typeof t.summary === 'string' ? t.summary : '').slice(0, 400),
    images: ensureImageList(t.images),
    keywords: Array.isArray(t.keywords) ? t.keywords : [],
  };
}
function ensureMissionPlan(p: Partial<Pick<RawMission, 'missionTitle' | 'introduction'>> & { topics?: Array<Partial<EnrichedTopic> | undefined> }): EnrichedMissionPlan {
  const title = (typeof p.missionTitle === 'string' ? p.missionTitle : 'Mission Plan').slice(0, 200);
  const intro = (typeof p.introduction === 'string' ? p.introduction : 'Welcome.').slice(0, 600);
  const topics: EnrichedTopic[] = (Array.isArray(p.topics) ? p.topics : [])
    .filter((t): t is Partial<EnrichedTopic> => Boolean(t))
    .map((t) => ({
      title: (typeof t.title === 'string' ? t.title : 'Topic').slice(0, 160),
      summary: (typeof t.summary === 'string' ? t.summary : '').slice(0, 400),
      images: ensureImageList(t.images),
      keywords: Array.isArray(t.keywords) ? t.keywords : [],
    }));
  if (topics.length === 0 && !p.missionTitle) throw new Error('Mission generation resulted in no topics and no title.');
  return { missionTitle: title, introduction: intro, topics };
}
function createFallbackMission(reason?: string): EnrichedMissionPlan {
  const userMessage = reason || 'An unexpected error occurred.';
  return { missionTitle: 'Mission Aborted', introduction: `We were unable to generate your mission. Reason: ${userMessage.slice(0, 200)}`, topics: [] };
}
