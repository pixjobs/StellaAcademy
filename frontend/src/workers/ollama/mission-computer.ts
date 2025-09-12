/**
 * =========================================================================
 * MISSION COMPUTER (Production-Hardened, Audience-Aware, Type-Safe)
 *
 * - Reuses the hardened Redis connection from lib/queue (TLS, IPv4, DNS cache).
 * - Missions ALWAYS generate even if no images are fetched (no placeholders).
 * - Audience tailoring aligned with FE roles: 'explorer' | 'cadet' | 'scholar'.
 * - Conservative retries for LLM + NASA lookups (with jittered backoff).
 * - Type guards for external data (no property access on `{}`).
 * =========================================================================
 */

import type { Redis } from 'ioredis';
import { getConnection as getRedisConnection } from '@/lib/queue';
import { searchNIVL, fetchAPOD, fetchLatestMarsPhotos, fetchEPICImages } from '@/lib/nasa';
import { callOllama } from './ollama-client';
import type { Role, MarsPhoto, MissionType } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const QUERY_AGGREGATION_TIMEOUT_MS = 15_000;

const CACHE_KEYS = {
  LLM_ROCKET_LAB: 'llm-mission:rocket-lab',
  NIVL_QUERY_PREFIX: 'nivl-query:',
} as const;

const CACHE_TTL_SECONDS = {
  LLM: 3600, // 1h
  NIVL: 86400, // 24h
} as const;

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { missionTitle: string; introduction: string; topics: RawTopic[] };

type Apod = {
  title?: string;
  explanation?: string;
  bgUrl?: string;
};

type EpicItem = {
  date: string;
  href: string;
};

/* -------------------------------------------------------------------------- */
/*                               Type Guards                                  */
/* -------------------------------------------------------------------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isApod(x: unknown): x is Apod {
  if (!isRecord(x)) return false;
  const t = x.title;
  const e = x.explanation;
  const b = x.bgUrl;
  return (t === undefined || typeof t === 'string') &&
         (e === undefined || typeof e === 'string') &&
         (b === undefined || typeof b === 'string');
}

function isEpicItem(x: unknown): x is EpicItem {
  return isRecord(x) && typeof x.date === 'string' && typeof x.href === 'string';
}

function isEpicArray(x: unknown): x is EpicItem[] {
  return Array.isArray(x) && x.every(isEpicItem);
}

function isMarsPhotoArray(x: unknown): x is MarsPhoto[] {
  return Array.isArray(x) && x.every((p) =>
    isRecord(p) &&
    typeof p.img_src === 'string' &&
    typeof p.earth_date === 'string' &&
    isRecord(p.camera) &&
    typeof (p.camera as { name?: unknown }).name === 'string'
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Audience Map                               */
/* -------------------------------------------------------------------------- */

type AudienceLevel = 'kids' | 'cadet' | 'uni' | 'general';
type AudienceSpec = { level: AudienceLevel; promptNote: string; introNote: string };

/** FE passes: 'explorer' | 'cadet' | 'scholar' */
function audienceSpec(role: Role): AudienceSpec {
  const r = String(role).toLowerCase();
  if (r === 'explorer') {
    return {
      level: 'kids',
      promptNote:
        'Write at ~Year 4–6 reading level. Short sentences, friendly tone. Avoid jargon; explain simply.',
      introNote:
        'This mission is written for younger explorers with simple steps and fun language.',
    };
  }
  if (r === 'cadet') {
    return {
      level: 'cadet',
      promptNote:
        'Write for motivated teens. Clear, energetic tone. Light technical terms are okay with brief explanations.',
      introNote:
        'This mission is geared to cadets: clear goals, light technical terms, quick explanations.',
    };
  }
  if (r === 'scholar') {
    return {
      level: 'uni',
      promptNote:
        'Write for first/second-year undergrads. Use precise terminology and a concise, informative style.',
      introNote:
        'This mission uses proper terminology and encourages deeper analysis.',
    };
  }
  return {
    level: 'general',
    promptNote: 'Write for a general audience. Clear, concise, and engaging.',
    introNote: 'This mission is written for a general audience.',
  };
}

/* -------------------------------------------------------------------------- */
/*                               Redis Connection                             */
/* -------------------------------------------------------------------------- */

let redisClient: Redis | null = null;
async function redis(): Promise<Redis> {
  if (redisClient) return redisClient;
  const client = await getRedisConnection();
  client.on('error', (err) => console.error('[mission][redis] Redis connection error:', err));
  redisClient = client;
  return client;
}

/* -------------------------------------------------------------------------- */
/*                                   Retries                                  */
/* -------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(baseMs: number): number {
  return Math.floor(baseMs * (0.6 + Math.random() * 0.8)); // 0.6x .. 1.4x
}

/** Retry helper with capped, jittered exponential backoff. */
async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    attempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onError?: (err: unknown, attempt: number) => void;
  }
): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 700;
  const maxDelayMs = options?.maxDelayMs ?? 5_000;
  const onError = options?.onError;

  for (let a = 1; a <= attempts; a++) {
    try {
      return await fn();
    } catch (err) {
      onError?.(err, a);
      if (a === attempts) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (a - 1), maxDelayMs);
      await sleep(jitter(delay));
    }
  }
  // Unreachable, but satisfies control flow
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  throw 'retry exhausted';
}

/* -------------------------------------------------------------------------- */
/*                                 Public API                                 */
/* -------------------------------------------------------------------------- */

export async function computeMission(role: Role, missionType: MissionType): Promise<EnrichedMissionPlan> {
  try {
    switch (missionType) {
      case 'space-poster':
        return await computeSpacePosterMission(role);
      case 'rocket-lab':
        return await computeRocketLabMission(role);
      case 'rover-cam':
        return await computeRoverCamMission(role);
      case 'earth-observer':
        return await computeEarthObserverMission(role);
      case 'celestial-investigator':
        return await computeCelestialInvestigatorMission(role);
      default:
        console.warn(`[mission] Unknown missionType '${missionType}'. Falling back to Rocket Lab.`);
        return await computeRocketLabMission(role);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(
      `[mission] FATAL: computeMission failed for type='${missionType}' role='${role}'. Reason: ${error.message}`,
      error.stack
    );
    return createFallbackMission(error.message);
  }
}

/* -------------------------------------------------------------------------- */
/*                           Mission Implementations                          */
/* -------------------------------------------------------------------------- */

async function computeRocketLabMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);

  // 1) Try cached LLM JSON
  let jsonStr: string | null = null;
  try {
    const rds = await redis();
    jsonStr = await rds.get(CACHE_KEYS.LLM_ROCKET_LAB);
    if (jsonStr) console.log(`[mission] LLM cache HIT: ${CACHE_KEYS.LLM_ROCKET_LAB}`);
  } catch (err) {
    console.error(`[mission][redis] GET failed for key "${CACHE_KEYS.LLM_ROCKET_LAB}":`, err);
  }

  // 2) Generate if cache miss
  if (!jsonStr) {
    console.log(`[mission] LLM cache MISS: ${CACHE_KEYS.LLM_ROCKET_LAB}. Generating…`);
    const systemPrompt = `
Return ONLY JSON in this schema:
{
  "missionTitle": "",
  "introduction": "",
  "topics": [
    {
      "title": "",
      "summary": "",
      "keywords": ["", ""],
      "searchQueries": ["", "", ""]
    }
  ]
}

Guidelines:
- Audience: ${aud.level}. ${aud.promptNote}
- Concise, concrete, and rocket/spaceflight-focused.
- 3–5 topics with clear learning goals appropriate to this audience.
- "keywords" and "searchQueries" help image searches, but images are OPTIONAL.
- No extra fields, no commentary—just the JSON.
`.trim();

    const llmOut = await retry(
      () => callOllama(systemPrompt, { temperature: 0.7 }),
      {
        attempts: 3,
        baseDelayMs: 800,
        maxDelayMs: 4_000,
        onError: (e, a) =>
          console.warn(`[mission][llm] attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
      }
    );
    const parsed = extractFirstJsonObject(llmOut);
    if (!parsed) throw new Error('LLM did not return parseable JSON for Rocket Lab.');
    jsonStr = parsed;

    // Try to cache (best-effort)
    try {
      const rds = await redis();
      await rds.set(CACHE_KEYS.LLM_ROCKET_LAB, jsonStr, 'EX', CACHE_TTL_SECONDS.LLM);
    } catch (err) {
      console.error(`[mission][redis] SET failed for key "${CACHE_KEYS.LLM_ROCKET_LAB}":`, err);
    }
  }

  // 3) Build topics; tolerate no images
  const base = validateMissionJson(JSON.parse(jsonStr));
  const tailoredIntroduction = base.introduction.replace(/welcome.*?\./i, `Welcome, ${role}.`);
  const topics = await Promise.all(
    base.topics.map(async (t) => {
      const seeds = t.searchQueries.length ? t.searchQueries : t.keywords.length ? t.keywords : [t.title];
      // NIVL lookups are best-effort; retry once
      const items = await retry(
        () => tryNivlQueries(seeds, 6),
        {
          attempts: 2,
          baseDelayMs: 600,
          maxDelayMs: 2_000,
          onError: (e, a) =>
            console.warn(`[mission][nivl] rocket-lab attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
        }
      ).catch(() => [] as Img[]);
      return ensureTopic({ ...t, images: items });
    })
  );

  return ensureMissionPlan({
    ...base,
    introduction: `${tailoredIntroduction} ${aud.introNote}`,
    topics,
  });
}

async function computeSpacePosterMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);

  const apodRaw = await retry(() => fetchAPOD(), {
    attempts: 2,
    baseDelayMs: 700,
    maxDelayMs: 2_000,
    onError: (e, a) => console.warn(`[mission][apod] attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
  }).catch(() => null);

  const apod: Apod | null = isApod(apodRaw) ? apodRaw : null;

  // If APOD fails, we still return a functional plan (no images).
  const seeds = apod ? uniq([apod.title, 'nebula', 'galaxy', 'space telescope', 'star cluster']).filter(Boolean) : [];
  const extras = seeds.length
    ? await retry(() => tryNivlQueries(seeds.filter((s): s is string => typeof s === "string"), 8), {
        attempts: 2,
        baseDelayMs: 600,
        maxDelayMs: 2_000,
        onError: (e, a) =>
          console.warn(`[mission][nivl] space-poster attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
      }).catch(() => [] as Img[])
    : [];

  const baseList: Img[] = [];
  if (apod?.bgUrl && apod?.title) baseList.push({ title: apod.title, href: apod.bgUrl });
  const images: Img[] = ensureImageList([...baseList, ...extras]).slice(0, 8);

  const summary = String(
    apod?.explanation || 'Create a space poster using astronomy concepts and design ideas tailored to your audience.'
  ).slice(0, 400);

  const topic = ensureTopic({ title: apod?.title || 'Poster Theme', summary, images });

  return ensureMissionPlan({
    missionTitle: `Space Poster${apod?.title ? `: ${apod.title}` : ''}`,
    introduction: `Welcome, ${role}. Build a one-page space poster with a clear title, caption, fun fact, and palette. ${aud.introNote}`,
    topics: [topic],
  });
}

async function computeRoverCamMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);

  const rover = 'curiosity';
  const photosRaw = await retry(() => fetchLatestMarsPhotos(rover), {
    attempts: 2,
    baseDelayMs: 700,
    maxDelayMs: 2_500,
    onError: (e, a) => console.warn(`[mission][rover] attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
  }).catch(() => null);

  const latestPhotos: MarsPhoto[] = isMarsPhotoArray(photosRaw) ? photosRaw : [];

  const cameraInfo: Record<
    'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'NAVCAM',
    { name: string; desc: string }
  > = {
    FHAZ: { name: 'Front Hazard Avoidance Camera', desc: 'Views from the front of the rover, used for avoiding obstacles.' },
    RHAZ: { name: 'Rear Hazard Avoidance Camera', desc: 'Views from the back of the rover, for hazard avoidance.' },
    MAST: { name: 'Mast Camera', desc: 'Takes color images and videos of the Martian terrain.' },
    CHEMCAM: { name: 'Chemistry & Camera Complex', desc: 'Uses a laser to analyze rock composition from a distance.' },
    NAVCAM: { name: 'Navigation Camera', desc: 'Black and white cameras that help engineers drive the rover.' },
  };

  const topics: EnrichedTopic[] = Object.entries(cameraInfo).map(([code, info]) => {
    const cameraPhotos = latestPhotos.filter((p) => p.camera?.name === code);
    const images: Img[] = cameraPhotos
      .map((p) => ({
        title: `Curiosity ${p.camera?.full_name ?? code} (${p.earth_date})`,
        href: p.img_src,
      }))
      .filter((x): x is Img => typeof x.href === 'string' && x.href.length > 0);

    return ensureTopic({ title: `Latest from ${info.name}`, summary: info.desc, images });
  });

  return ensureMissionPlan({
    missionTitle: 'Latest Photos from Curiosity Rover',
    introduction: `Welcome, ${role}. Explore the rover cameras and what they reveal about Mars. ${aud.introNote}`,
    topics,
  });
}

async function computeEarthObserverMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);

  const epicRaw = await retry(() => fetchEPICImages({ count: 12 }), {
    attempts: 2,
    baseDelayMs: 700,
    maxDelayMs: 2_500,
    onError: (e, a) => console.warn(`[mission][epic] attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
  }).catch(() => null);

  const epicImages: EpicItem[] = isEpicArray(epicRaw) ? epicRaw : [];

  const images: Img[] = epicImages
    .map((img) => ({ title: `Earth on ${new Date(img.date).toUTCString()}`, href: img.href }))
    .filter((i): i is Img => typeof i.href === 'string' && i.href.length > 0);

  const topic = ensureTopic({
    title: 'Recent Views of Earth',
    summary: 'True-color images of Earth from DSCOVR show the full sunlit side of our planet.',
    images,
  });

  return ensureMissionPlan({
    missionTitle: 'Earth Observer',
    introduction: `Welcome, ${role}. Observe Earth from deep space and discuss weather and geography. ${aud.introNote}`,
    topics: [topic],
  });
}

async function computeCelestialInvestigatorMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);

  const targets = [
    'Orion Nebula',
    'Andromeda Galaxy',
    'Pillars of Creation',
    'Crab Nebula',
    'Hubble Deep Field',
    'Ring Nebula',
    'Carina Nebula',
  ];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const searchSeeds = [target, 'Hubble Space Telescope', 'Spitzer Space Telescope', 'nebula', 'galaxy'];

  const images = await retry(() => tryNivlQueries(searchSeeds, 8), {
    attempts: 2,
    baseDelayMs: 600,
    maxDelayMs: 2_000,
    onError: (e, a) =>
      console.warn(`[mission][nivl] celestial attempt ${a} failed:`, (e as Error)?.message ?? String(e)),
  }).catch(() => [] as Img[]);

  const topic = ensureTopic({
    title: `Investigation: ${target}`,
    summary: `Images and ideas related to ${target}, gathered across observatories and wavelengths.`,
    images,
  });

  return ensureMissionPlan({
    missionTitle: `Celestial Investigator: ${target}`,
    introduction: `Welcome, ${role}. Analyze the target using multi-observatory context. ${aud.introNote}`,
    topics: [topic],
  });
}

/* -------------------------------------------------------------------------- */
/*                                    Helpers                                 */
/* -------------------------------------------------------------------------- */

function stripFences(s: string): string {
  if (!s) return s;
  return s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1').trim();
}

function extractFirstJsonObject(text: string): string | null {
  if (!text) return null;
  const trimmed = stripFences(String(text)).slice(0, 10_000);
  const m = trimmed.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

/** Validates and clamps the mission JSON coming from the LLM. */
function validateMissionJson(raw: unknown): RawMission {
  const o = isRecord(raw) ? raw : {};
  const topics = Array.isArray(o.topics) ? o.topics : [];
  return {
    missionTitle: typeof o.missionTitle === 'string' ? o.missionTitle.slice(0, 200) : 'Rocket Mission',
    introduction: typeof o.introduction === 'string' ? o.introduction.slice(0, 600) : 'Welcome to Rocket Lab.',
    topics: topics.slice(0, 6).map((t: unknown): RawTopic => {
      const topicObj = isRecord(t) ? t : {};
      return {
        title: typeof topicObj.title === 'string' ? topicObj.title.slice(0, 160) : 'Topic',
        summary: typeof topicObj.summary === 'string' ? topicObj.summary.slice(0, 400) : '',
        keywords: Array.isArray(topicObj.keywords)
          ? (topicObj.keywords as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 4)
          : [],
        searchQueries: Array.isArray(topicObj.searchQueries)
          ? (topicObj.searchQueries as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 4)
          : [],
      };
    }),
  };
}

function uniq<T>(arr: T[]): T[] {
  const cleaned = arr.filter((x): x is NonNullable<T> => Boolean(x));
  return Array.from(new Set(cleaned));
}

async function tryNivlQueries(seeds: string[], limitPerQuery = 4): Promise<Img[]> {
  const queries = uniq(seeds).slice(0, 5);
  if (queries.length === 0) return [];

  const imageMap = new Map<string, Img>();
  let queriesToFetch: string[] = [];
  const cacheKeys = queries.map((q) => `${CACHE_KEYS.NIVL_QUERY_PREFIX}${q.toLowerCase().replace(/\s+/g, '-')}`);

  try {
    const rds = await redis();
    const cachedResults = await rds.mget(cacheKeys);
    const queriesWithCache = new Set<string>();

    cachedResults.forEach((result, index) => {
      if (result) {
        const images: unknown = JSON.parse(result);
        if (Array.isArray(images)) {
          for (const img of images) {
            const href = (img as { href?: unknown }).href;
            if (typeof href === 'string' && href.length > 0) {
              const titleVal = (img as { title?: unknown }).title;
              const cast: Img = { title: typeof titleVal === 'string' ? titleVal : 'Untitled', href };
              if (!imageMap.has(cast.href)) imageMap.set(cast.href, cast);
            }
          }
          queriesWithCache.add(queries[index]);
        }
      }
    });

    queriesToFetch = queries.filter((q) => !queriesWithCache.has(q));

    if (queriesWithCache.size > 0) {
      console.log(`[mission] NIVL cache HIT for ${queriesWithCache.size}/${queries.length} queries.`);
    }
  } catch (err) {
    console.error('[mission][redis] MGET failed for NIVL queries. Fetching all live.', err);
    queriesToFetch = [...queries];
  }

  if (queriesToFetch.length > 0) {
    console.log(`[mission] NIVL cache MISS. Fetching ${queriesToFetch.length} live: [${queriesToFetch.join(', ')}]`);

    const searchPromises = queriesToFetch.map((q) =>
      searchNIVL(q, { limit: limitPerQuery, expandAssets: true, prefer: 'large' })
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('NIVL query aggregation timed out')), QUERY_AGGREGATION_TIMEOUT_MS)
    );

    try {
      const settled = (await Promise.race([
        Promise.allSettled(searchPromises),
        timeoutPromise,
      ])) as PromiseSettledResult<Img[]>[];

      const rds = await redis();
      const pipeline = rds.pipeline();
      let pipelineHasCommands = false;

      settled.forEach((result, index) => {
        const originalQuery = queriesToFetch[index];
        const cacheKey = `${CACHE_KEYS.NIVL_QUERY_PREFIX}${originalQuery.toLowerCase().replace(/\s+/g, '-')}`;

        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          const fetchedImages = result.value.filter((i): i is Img => !!i && typeof i.href === 'string');
          for (const item of fetchedImages) if (!imageMap.has(item.href)) imageMap.set(item.href, item);

          if (fetchedImages.length > 0) {
            pipeline.set(cacheKey, JSON.stringify(fetchedImages), 'EX', CACHE_TTL_SECONDS.NIVL);
            pipelineHasCommands = true;
          }
        } else if (result.status === 'rejected') {
          console.error(`[mission] NIVL query failed for "${originalQuery}":`, result.reason);
        }
      });

      if (pipelineHasCommands) {
        await pipeline.exec().catch((err) => console.error('[mission][redis] Pipeline exec failed:', err));
      }
    } catch (err) {
      console.error('[mission] Live NIVL fetch failed:', (err as Error).message);
    }
  }

  return Array.from(imageMap.values());
}

function ensureImageList(images: unknown): Img[] {
  const src = Array.isArray(images) ? images : [];
  const clean: Img[] = [];
  for (const i of src) {
    const href = (i as { href?: unknown })?.href;
    if (typeof href !== 'string' || href.trim().length === 0) continue;
    const titleVal = (i as { title?: unknown })?.title;
    const title = typeof titleVal === 'string' ? titleVal.slice(0, 200) : 'Untitled';
    clean.push({ title, href: href.trim() });
  }
  return clean;
}

function ensureTopic(t: Partial<RawTopic> & { images?: Img[] }): EnrichedTopic {
  return {
    title: (t.title ?? 'Topic').slice(0, 160),
    summary: (t.summary ?? '').slice(0, 400),
    images: ensureImageList(t.images), // may be []
    keywords: Array.isArray(t.keywords) ? t.keywords : [],
  };
}

/**
 * DO NOT throw if images are empty. Guarantees a functional plan even when
 * NASA endpoints time out or return nothing. No fake placeholders added.
 */
function ensureMissionPlan(
  p: Partial<Pick<RawMission, 'missionTitle' | 'introduction'>> & { topics?: EnrichedTopic[] }
): EnrichedMissionPlan {
  const title = (p.missionTitle ?? 'Mission Plan').slice(0, 200);
  const intro = (p.introduction ?? 'Welcome to your mission.').slice(0, 600);

  const topics: EnrichedTopic[] = Array.isArray(p.topics)
    ? p.topics.map((t) => ({ ...t, images: ensureImageList(t.images) }))
    : [];

  return {
    missionTitle: title,
    introduction: intro,
    topics, // can be []
  };
}

function createFallbackMission(reason?: string): EnrichedMissionPlan {
  const userMessage = reason || 'An unexpected error occurred while planning the mission.';
  return {
    missionTitle: 'Mission Aborted',
    introduction: `We were unable to generate your mission. Please try again later. Reason: ${userMessage.slice(0, 200)}`,
    topics: [],
  };
}
