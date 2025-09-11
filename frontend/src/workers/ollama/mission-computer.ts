/**
 * =========================================================================
 * MISSION COMPUTER (Hardened for Production)
 *
 * This module contains the core business logic for computing and assembling
 * mission plans. It features centralized error handling, resilient caching,
 * and robust asynchronous operations to ensure high availability.
 * =========================================================================
 */

import type { Redis } from 'ioredis';
import { getConnection as getRedisConnection } from '@/lib/queue';
import { searchNIVL, fetchAPOD, fetchLatestMarsPhotos, fetchEPICImages } from '@/lib/nasa';
import { callOllama } from './ollama-client';
import type { Role, MarsPhoto, MissionType } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';

// --- Local Types ---
type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { missionTitle: string; introduction: string; topics: RawTopic[] };

// --- Redis Client (reuse hardened client from lib/queue) ---
let redisClient: Redis | null = null;
async function redis(): Promise<Redis> {
  if (redisClient) return redisClient;
  const client = await getRedisConnection(); // picks up REDIS_URL logic + TLS + IPv4 + DNS cache
  client.on('error', (err) => console.error('[mission][redis] Redis connection error:', err));
  redisClient = client;
  return client;
}

// --- Configuration ---
const QUERY_AGGREGATION_TIMEOUT_MS = 15_000; // A safer, reduced timeout for NIVL queries.

// Cache Configuration
const CACHE_KEYS = {
  LLM_ROCKET_LAB: 'llm-mission:rocket-lab',
  NIVL_QUERY_PREFIX: 'nivl-query:',
};
const CACHE_TTL_SECONDS = {
  LLM: 3600,  // 1h
  NIVL: 86400 // 24h
};

/* ─────────────────────────────────────────────────────────
   Main Export: computeMission
────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────
   Mission-Specific Implementations
────────────────────────────────────────────────────────── */

async function computeSpacePosterMission(role: Role): Promise<EnrichedMissionPlan> {
  const apod = await fetchAPOD();
  if (!apod || typeof apod !== 'object') {
    throw new Error('Received an invalid response from the APOD API.');
  }

  const seeds = uniq([apod.title, 'nebula', 'galaxy', 'space telescope', 'star cluster']).filter(Boolean);
  const extras = await tryNivlQueries(seeds, 8);

  const baseList: Img[] = [];
  if (apod.bgUrl && apod.title) baseList.push({ title: apod.title, href: apod.bgUrl });
  const images: Img[] = ensureImageList([...baseList, ...extras]).slice(0, 8);

  const summary = String(apod.explanation || 'Create a space poster using today’s featured image and related NASA visuals.').slice(0, 400);
  const topic = ensureTopic({ title: apod.title || 'APOD Selection', summary, images });

  return ensureMissionPlan({
    missionTitle: `Space Poster: ${apod.title || 'Astronomy Picture of the Day'}`,
    introduction: `Welcome, ${role}. We’ll build a one-page space poster from APOD and a few related visuals. Pick an image, ask Stella for a caption, and export your poster.`,
    topics: [topic],
  });
}

async function computeRocketLabMission(role: Role): Promise<EnrichedMissionPlan> {
  let jsonStr: string | null = null;

  try {
    const rds = await redis();
    jsonStr = await rds.get(CACHE_KEYS.LLM_ROCKET_LAB);
    if (jsonStr) {
      console.log(`[mission] LLM cache HIT for key: ${CACHE_KEYS.LLM_ROCKET_LAB}`);
    }
  } catch (err) {
    console.error(`[mission][redis] GET command failed for key "${CACHE_KEYS.LLM_ROCKET_LAB}":`, err);
  }

  if (!jsonStr) {
    console.log(`[mission] LLM cache MISS for key: ${CACHE_KEYS.LLM_ROCKET_LAB}. Generating new plan.`);
    const systemPrompt =
      `You output ONLY JSON in this exact schema: {"missionTitle":"","introduction":"","topics":[{"title":"","summary":"","keywords":["",""],"searchQueries":["","",""]}]}. Rules: Titles must be concrete & rocket-specific. "summary": 1–2 sentences. "keywords": 2–4 domain terms. "searchQueries": 3 short phrases for NASA images. Total <= ~600 chars. No extra text.`.trim();
    const r = await callOllama(systemPrompt, { temperature: 0.7 });
    jsonStr = extractFirstJsonObject(r);
    if (!jsonStr) throw new Error('Could not generate a mission plan from the LLM. The response was empty or invalid.');

    try {
      const rds = await redis();
      await rds.set(CACHE_KEYS.LLM_ROCKET_LAB, jsonStr, 'EX', CACHE_TTL_SECONDS.LLM);
    } catch (err) {
      console.error(`[mission][redis] SET command failed for key "${CACHE_KEYS.LLM_ROCKET_LAB}":`, err);
    }
  }

  const base = validateMissionJson(JSON.parse(jsonStr));

  // Dynamically tailor the introduction for the specific role
  const tailoredIntroduction = base.introduction.replace(/welcome.*?\./i, `Welcome, ${role}.`);

  const topics = await Promise.all(
    base.topics.map(async (t) => {
      const seeds = t.searchQueries.length ? t.searchQueries : t.keywords.length ? t.keywords : [t.title];
      const items = await tryNivlQueries(seeds, 6);
      return ensureTopic({ ...t, images: items });
    })
  );
  return ensureMissionPlan({ ...base, introduction: tailoredIntroduction, topics });
}

async function computeRoverCamMission(role: Role): Promise<EnrichedMissionPlan> {
  const rover = 'curiosity';
  const latestPhotos: MarsPhoto[] = await fetchLatestMarsPhotos(rover);
  if (latestPhotos.length === 0) throw new Error('The Mars Rover API did not return any recent images.');

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
      .filter((x): x is Img => Boolean(x.href));
    return ensureTopic({ title: `Latest from ${info.name}`, summary: info.desc, images });
  });

  return ensureMissionPlan({
    missionTitle: `Latest Photos from Curiosity Rover`,
    introduction: `Welcome, ${role}. These are the most recent images sent back from the Curiosity rover on Mars. Analyze what the rover has seen in the last few days.`,
    topics,
  });
}

async function computeEarthObserverMission(role: Role): Promise<EnrichedMissionPlan> {
  const epicImages = await fetchEPICImages({ count: 12 });
  if (!epicImages || epicImages.length === 0) {
    throw new Error('The NASA EPIC API did not return any recent images. The service may be temporarily unavailable.');
  }
  const images: Img[] = epicImages
    .map((img) => ({ title: `Earth on ${new Date(img.date).toUTCString()}`, href: img.href }))
    .filter((i): i is Img => typeof i.href === 'string' && i.href.length > 0);

  const topic = ensureTopic({
    title: 'Recent Views of Earth',
    summary:
      "These are the latest true-color images of Earth from the DSCOVR satellite, positioned one million miles away, capturing the entire sunlit side of our planet.",
    images,
  });
  return ensureMissionPlan({
    missionTitle: 'Earth Observer',
    introduction: `Welcome, ${role}. Your mission is to observe our home planet from deep space. Analyze these recent images from the EPIC camera and ask questions about weather, geography, and Earth's place in the solar system.`,
    topics: [topic],
  });
}

async function computeCelestialInvestigatorMission(role: Role): Promise<EnrichedMissionPlan> {
  const targets = ['Orion Nebula', 'Andromeda Galaxy', 'Pillars of Creation', 'Crab Nebula', 'Hubble Deep Field', 'Ring Nebula', 'Carina Nebula'];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const searchSeeds = [target, 'Hubble Space Telescope', 'Spitzer Space Telescope', 'nebula', 'galaxy'];
  const images = await tryNivlQueries(searchSeeds, 8);
  const topic = ensureTopic({
    title: `Investigation: ${target}`,
    summary: `A collection of images related to ${target}, gathered from multiple NASA observatories and archives.`,
    images,
  });
  return ensureMissionPlan({
    missionTitle: `Celestial Investigator: ${target}`,
    introduction: `Welcome, Investigator ${role}. Your target is the ${target}. We have gathered images from multiple observatories and wavelengths. Analyze the data to understand this fascinating object.`,
    topics: [topic],
  });
}

/* ─────────────────────────────────────────────────────────
   Data Validation & Sanitization Helpers
────────────────────────────────────────────────────────── */

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

function validateMissionJson(raw: unknown): RawMission {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const topics = Array.isArray(o.topics) ? o.topics : [];
  return {
    missionTitle: typeof o.missionTitle === 'string' ? o.missionTitle.slice(0, 200) : 'Rocket Mission',
    introduction: typeof o.introduction === 'string' ? o.introduction.slice(0, 600) : 'Welcome to Rocket Lab.',
    topics: topics.slice(0, 6).map((t: unknown): RawTopic => {
      const topicObj = typeof t === 'object' && t !== null ? (t as Record<string, unknown>) : {};
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
    console.error('[mission][redis] MGET command failed for NIVL queries. Fetching all live.', err);
    queriesToFetch = [...queries];
  }

  if (queriesToFetch.length > 0) {
    console.log(`[mission] NIVL cache MISS. Fetching ${queriesToFetch.length} queries live: [${queriesToFetch.join(', ')}]`);

    const searchPromises = queriesToFetch.map((q) => searchNIVL(q, { limit: limitPerQuery, expandAssets: true, prefer: 'large' }));

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('NIVL query aggregation timed out')), QUERY_AGGREGATION_TIMEOUT_MS)
    );

    try {
      const settled = await Promise.race([Promise.allSettled(searchPromises), timeoutPromise]) as PromiseSettledResult<Img[]>[];

      const rds = await redis();
      const redisPipeline = rds.pipeline();
      let pipelineHasCommands = false;

      settled.forEach((result, index) => {
        const originalQuery = queriesToFetch[index];
        const cacheKey = `${CACHE_KEYS.NIVL_QUERY_PREFIX}${originalQuery.toLowerCase().replace(/\s+/g, '-')}`;

        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          const fetchedImages = result.value.filter((i): i is Img => !!i && typeof i.href === 'string');
          for (const item of fetchedImages) if (!imageMap.has(item.href)) imageMap.set(item.href, item);

          if (fetchedImages.length > 0) {
            redisPipeline.set(cacheKey, JSON.stringify(fetchedImages), 'EX', CACHE_TTL_SECONDS.NIVL);
            pipelineHasCommands = true;
          }
        } else if (result.status === 'rejected') {
          console.error(`[mission] NIVL query failed for "${originalQuery}":`, result.reason);
        }
      });

      if (pipelineHasCommands) {
        await redisPipeline.exec().catch((err) => console.error('[mission][redis] Pipeline exec failed:', err));
      }
    } catch (err) {
      console.error('[mission] Live NIVL fetch failed:', (err as Error).message);
    }
  }

  const uniqueImages = Array.from(imageMap.values());
  console.log(
    `[mission] tryNivlQueries: Assembled ${uniqueImages.length} unique images for ${queries.length} queries (including cache).`
  );

  return uniqueImages;
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
    images: ensureImageList(t.images),
    keywords: Array.isArray(t.keywords) ? t.keywords : [],
  };
}

function ensureMissionPlan(
  p: Partial<Pick<RawMission, 'missionTitle' | 'introduction'>> & { topics?: EnrichedTopic[] }
): EnrichedMissionPlan {
  const title = (p.missionTitle ?? 'Mission Plan').slice(0, 200);
  const intro = (p.introduction ?? 'Welcome to your mission.').slice(0, 600);
  const topics = (p.topics ?? []).filter((t) => t && Array.isArray(t.images) && t.images.length > 0);

  if (topics.length === 0) {
    throw new Error('Mission generation resulted in no topics with valid images.');
  }

  return {
    missionTitle: title,
    introduction: intro,
    topics,
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
