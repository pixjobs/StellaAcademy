/**
 * =========================================================================
 * MISSION COMPUTER (Production-Hardened, Audience-Aware, Type-Safe)
 *
 * - Reuses the hardened Redis connection from lib/queue.
 * - Missions ALWAYS generate even if external APIs for images fail (Pictureless-First).
 * - Audience tailoring for 'explorer' | 'cadet' | 'scholar' roles.
 * - Resilient retries for all external network requests.
 * - Strict type guards for all incoming API data to prevent runtime errors.
 * - Implements a Text-First generation strategy for more coherent content.
 * =========================================================================
 */

import type { Redis } from 'ioredis';
import { getConnection as getRedisConnection } from '@/lib/queue';
import { searchNIVL, fetchAPOD, fetchLatestMarsPhotos, fetchEPICImages } from '@/lib/nasa';
import { callOllama } from './ollama-client';
import type { Role, MarsPhoto, MissionType, NivlItem } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';

// MODIFIED: Import the bottleneck to protect the Ollama service
import { llmBottleneck } from './llm-bottleneck';

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const QUERY_AGGREGATION_TIMEOUT_MS = 15_000;
const CACHE_KEYS = {
  NIVL_QUERY_PREFIX: 'nivl-query:',
} as const;
const CACHE_TTL_SECONDS = {
  NIVL: 86400, // 24 hours
} as const;

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { missionTitle: string; introduction: string; topics: RawTopic[] };
type Apod = { title?: string; explanation?: string; bgUrl?: string };
type EpicItem = { date: string; href: string };

/* -------------------------------------------------------------------------- */
/*                               Type Guards                                  */
/* -------------------------------------------------------------------------- */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isApod(x: unknown): x is Apod {
  if (!isRecord(x)) return false;
  return (x.title === undefined || typeof x.title === 'string') &&
         (x.explanation === undefined || typeof x.explanation === 'string') &&
         (x.bgUrl === undefined || typeof x.bgUrl === 'string');
}

function isEpicItem(x: unknown): x is EpicItem {
  return isRecord(x) && typeof x.date === 'string' && typeof x.href === 'string';
}

function isEpicArray(x: unknown): x is EpicItem[] {
  return Array.isArray(x) && x.every(isEpicItem);
}

function isMarsPhotoArray(x: unknown): x is MarsPhoto[] {
  return Array.isArray(x) && x.every((p) =>
    isRecord(p) && typeof p.img_src === 'string' && typeof p.earth_date === 'string' &&
    isRecord(p.camera) && typeof (p.camera as { name?: unknown }).name === 'string' &&
    (p.camera.full_name === undefined || typeof p.camera.full_name === 'string')
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Audience Map                               */
/* -------------------------------------------------------------------------- */

type AudienceSpec = { level: string; promptNote: string; introNote: string };

function audienceSpec(role: Role): AudienceSpec {
  switch (role) {
    case 'explorer':
      return { level: 'kids (ages 8-12)', promptNote: 'Write at a Year 4–6 reading level. Short sentences, friendly tone. Explain concepts simply.', introNote: 'This mission is written for younger explorers with simple steps.' };
    case 'cadet':
      return { level: 'teens (ages 13-17)', promptNote: 'Write for motivated teens. Clear, energetic tone. Light technical terms are okay with brief explanations.', introNote: 'This mission is geared to cadets, with clear goals and light technical terms.' };
    case 'scholar':
      return { level: 'undergrad', promptNote: 'Write for first/second-year undergrads. Use precise terminology and a concise, informative style.', introNote: 'This mission uses proper terminology and encourages deeper analysis.' };
    default:
      return { level: 'general audience', promptNote: 'Write for a general audience. Clear, concise, and engaging.', introNote: 'This mission is written for a general audience.' };
  }
}

/* -------------------------------------------------------------------------- */
/*                  Redis Connection (Promise-based Singleton)                */
/* -------------------------------------------------------------------------- */

let redisPromise: Promise<Redis> | null = null;
function redis(): Promise<Redis> {
  if (redisPromise) return redisPromise;
  redisPromise = (async () => {
    const client = await getRedisConnection();
    client.on('error', (err) => console.error('[mission][redis] Redis connection error:', err));
    return client;
  })();
  return redisPromise;
}

/* -------------------------------------------------------------------------- */
/*                           Helpers & Utilities                              */
/* -------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }
function jitter(baseMs: number): number { return Math.floor(baseMs * (0.6 + Math.random() * 0.8)); }

async function retry<T>(fn: () => Promise<T>, options?: { attempts?: number; baseDelayMs?: number; maxDelayMs?: number; onError?: (err: unknown, attempt: number) => void }): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 700;
  const maxDelayMs = options?.maxDelayMs ?? 5_000;
  for (let a = 1; a <= attempts; a++) {
    try {
      return await fn();
    } catch (err) {
      options?.onError?.(err, a);
      if (a === attempts) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (a - 1), maxDelayMs);
      await sleep(jitter(delay));
    }
  }
  throw new Error('Retry exhausted');
}

/* -------------------------------------------------------------------------- */
/*                                 Public API                                 */
/* -------------------------------------------------------------------------- */

export async function computeMission(role: Role, missionType: MissionType, options?: { seedIndex?: number }): Promise<EnrichedMissionPlan> {
  try {
    switch (missionType) {
      case 'space-poster': return await computeSpacePosterMission(role);
      case 'rocket-lab': return await computeRocketLabMission(role);
      case 'rover-cam': return await computeRoverCamMission(role);
      case 'earth-observer': return await computeEarthObserverMission(role);
      case 'celestial-investigator': return await computeCelestialInvestigatorMission(role, options);
      default:
        console.warn(`[mission] Unknown missionType '${missionType}'. Falling back to Rocket Lab.`);
        return await computeRocketLabMission(role);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[mission] FATAL: computeMission failed for type='${missionType}' role='${role}'.`, error);
    return createFallbackMission(error.message);
  }
}

/* -------------------------------------------------------------------------- */
/*                           Mission Implementations                          */
/* -------------------------------------------------------------------------- */

async function computeRocketLabMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const systemPrompt = `Return ONLY a JSON array of 3-5 topic objects in this schema:\n[\n  {\n    "title": "Topic Title Here",\n    "summary": "One to two sentence summary.",\n    "keywords": ["keyword1", "keyword2"],\n    "searchQueries": ["search query 1", "search query 2"]\n  }\n]\n\nGuidelines:\n- Generate topics about rocket components, orbital mechanics, or launch procedures.\n- The content must be tailored for this audience: ${aud.level}. ${aud.promptNote}`;
  
  // MODIFIED: The call to Ollama is now wrapped in the bottleneck to prevent overload.
  const llmOut = await retry(() => llmBottleneck.submit(() => callOllama(systemPrompt, { temperature: 0.8 })), { onError: (e, a) => console.warn(`[mission][llm] rocket-lab topics attempt ${a} failed`, e) });

  const parsedTopics = extractFirstJsonArray(llmOut);
  if (!parsedTopics || parsedTopics.length === 0) {
    throw new Error('LLM did not return a parseable array of topics for Rocket Lab.');
  }

  const base = validateMissionJson({ topics: parsedTopics });
  const topics = await Promise.all(
    base.topics.map(async (t) => {
      const seeds = t.searchQueries.length ? t.searchQueries : t.keywords.length ? t.keywords : [t.title];
      const items = await retry(() => tryNivlQueries(seeds, 6), { attempts: 2 }).catch(() => [] as Img[]);
      return ensureTopic({ ...t, images: items });
    })
  );

  return ensureMissionPlan({
    missionTitle: 'Rocket Lab Analysis',
    introduction: `Welcome, ${role}. Your mission is to analyze key rocket systems. ${aud.introNote}`,
    topics,
  });
}

async function computeSpacePosterMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const apodRaw = await retry(() => fetchAPOD(), { attempts: 2 }).catch(() => null);
  const apod = isApod(apodRaw) ? apodRaw : null;
  const seeds = apod ? uniq([apod.title, 'nebula', 'galaxy', 'star cluster']) : [];
  const extras = seeds.length ? await retry(() => tryNivlQueries(seeds, 8), { attempts: 2 }).catch(() => [] as Img[]) : [];
  const images = ensureImageList(apod?.bgUrl && apod.title ? [{ title: apod.title, href: apod.bgUrl }, ...extras] : extras).slice(0, 8);
  const summary = String(apod?.explanation || 'Create a space poster using astronomy concepts.').slice(0, 400);
  const topic = ensureTopic({ title: apod?.title || 'Explore the Cosmos', summary, images });
  return ensureMissionPlan({
    missionTitle: `Space Poster${apod?.title ? `: ${apod.title}` : ''}`,
    introduction: `Welcome, ${role}. Build a one-page space poster. ${aud.introNote}`,
    topics: [topic],
  });
}

async function computeRoverCamMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const photosRaw = await retry(() => fetchLatestMarsPhotos('curiosity'), { attempts: 2 }).catch(() => null);
  const latestPhotos = isMarsPhotoArray(photosRaw) ? photosRaw : [];
  const cameraInfo = { FHAZ: { name: 'Front Hazard Camera', desc: 'Views for avoiding obstacles.' }, RHAZ: { name: 'Rear Hazard Camera', desc: 'Views from the back for avoidance.' }, MAST: { name: 'Mast Camera', desc: 'Takes color images and videos.' }, CHEMCAM: { name: 'Chemistry & Camera', desc: 'Analyzes rock composition.' }, NAVCAM: { name: 'Navigation Camera', desc: 'Helps engineers drive the rover.' } };
  const topics = Object.entries(cameraInfo).map(([code, info]) => {
    const images = latestPhotos.filter(p => p.camera?.name === code).map(p => ({ title: `Curiosity ${p.camera?.full_name ?? code} (${p.earth_date})`, href: p.img_src }));
    return ensureTopic({ title: `Latest from ${info.name}`, summary: info.desc, images });
  });
  return ensureMissionPlan({ missionTitle: 'Latest Photos from Curiosity', introduction: `Welcome, ${role}. Explore rover cameras. ${aud.introNote}`, topics });
}

async function computeEarthObserverMission(role: Role): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const epicRaw = await retry(() => fetchEPICImages({ count: 12 }), { attempts: 2 }).catch(() => null);
  const epicImages = isEpicArray(epicRaw) ? epicRaw : [];
  const images = epicImages.map(img => ({ title: `Earth on ${new Date(img.date).toUTCString()}`, href: img.href }));
  const topic = ensureTopic({ title: 'Recent Views of Earth', summary: 'True-color images from the DSCOVR satellite.', images });
  return ensureMissionPlan({ missionTitle: 'Earth Observer', introduction: `Welcome, ${role}. Observe Earth from deep space. ${aud.introNote}`, topics: [topic] });
}

async function computeCelestialInvestigatorMission(role: Role, options?: { seedIndex?: number }): Promise<EnrichedMissionPlan> {
  const aud = audienceSpec(role);
  const targets = ['Orion Nebula', 'Andromeda Galaxy', 'Pillars of Creation', 'Crab Nebula', 'Hubble Deep Field', 'Ring Nebula', 'Carina Nebula', 'Whirlpool Galaxy', 'Eagle Nebula', 'Horsehead Nebula'];
  const target = options?.seedIndex !== undefined ? targets[options.seedIndex % targets.length] : targets[Math.floor(Math.random() * targets.length)];
  const searchSeeds = [target, 'Hubble Space Telescope', 'James Webb Space Telescope'];
  const images = await retry(() => tryNivlQueries(searchSeeds, 8), { attempts: 2 }).catch(() => [] as Img[]);
  const topic = ensureTopic({ title: `Investigation: ${target}`, summary: `Images of ${target} from multiple NASA observatories.`, images });
  return ensureMissionPlan({ missionTitle: `Celestial Investigator: ${target}`, introduction: `Welcome, ${role}. Analyze ${target}. ${aud.introNote}`, topics: [topic] });
}

/* -------------------------------------------------------------------------- */
/*                         Core Helpers & Sanitizers                          */
/* -------------------------------------------------------------------------- */

function stripFences(s: string): string {
  return s ? s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1').trim() : '';
}

function extractFirstJsonArray(text: string): Record<string, unknown>[] | null {
  if (!text) return null;
  const match = stripFences(text).match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateMissionJson(raw: unknown): RawMission {
  const o = isRecord(raw) ? raw : {};
  const topics = Array.isArray(o.topics) ? o.topics : [];
  return {
    missionTitle: typeof o.missionTitle === 'string' ? o.missionTitle.slice(0, 200) : 'Mission',
    introduction: typeof o.introduction === 'string' ? o.introduction.slice(0, 800) : 'Welcome.',
    topics: topics.slice(0, 8).map((t: unknown): RawTopic => {
      const topicObj = isRecord(t) ? t : {};
      return {
        title: typeof topicObj.title === 'string' ? topicObj.title.slice(0, 160) : 'Topic',
        summary: typeof topicObj.summary === 'string' ? topicObj.summary.slice(0, 500) : '',
        keywords: Array.isArray(topicObj.keywords) ? (topicObj.keywords as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 5) : [],
        searchQueries: Array.isArray(topicObj.searchQueries) ? (topicObj.searchQueries as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 5) : [],
      };
    }),
  };
}

function uniq<T>(arr: (T | null | undefined)[]): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)));
}

async function tryNivlQueries(seeds: string[], limitPerQuery = 4): Promise<Img[]> {
  const queries = uniq(seeds).slice(0, 5);
  if (queries.length === 0) return [];

  const imageMap = new Map<string, Img>();
  const rds = await redis();
  const cacheKeys = queries.map((q) => `${CACHE_KEYS.NIVL_QUERY_PREFIX}${q.toLowerCase().replace(/\s+/g, '-')}`);
  let queriesToFetch: string[] = [];

  try {
    const cachedResults = await rds.mget(cacheKeys);
    cachedResults.forEach((result, index) => {
      if (result) {
        try {
          const images: Img[] = JSON.parse(result);
          if (Array.isArray(images)) {
            for (const img of images) {
              if (isRecord(img) && typeof img.href === 'string' && typeof img.title === 'string') {
                if (!imageMap.has(img.href)) imageMap.set(img.href, { title: img.title, href: img.href });
              }
            }
          }
        } catch {}
      } else {
        queriesToFetch.push(queries[index]);
      }
    });
  } catch (err) {
    console.error('[mission][redis] MGET failed. Fetching all live.', err);
    queriesToFetch = [...queries];
  }

  if (queriesToFetch.length > 0) {
    const searchPromises = queriesToFetch.map((q) => searchNIVL(q, { limit: limitPerQuery }));
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('NIVL timeout')), QUERY_AGGREGATION_TIMEOUT_MS));
    try {
      const settled = await Promise.race([Promise.allSettled(searchPromises), timeout]) as PromiseSettledResult<NivlItem[]>[];
      if (Array.isArray(settled)) {
        const pipeline = rds.pipeline();
        let pipelineHasCommands = false;
        settled.forEach((result, index) => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            const fetchedImages: Img[] = result.value.map(item => {
              const title = item.data?.[0]?.title ?? 'Untitled NASA Image';
              const href = item.links?.find(link => link.rel === 'preview')?.href;
              return { title, href };
            }).filter((img): img is Img => typeof img.href === 'string' && img.href.length > 0);
            
            for (const item of fetchedImages) if (!imageMap.has(item.href)) imageMap.set(item.href, item);
            
            if (fetchedImages.length > 0) {
              const originalQuery = queriesToFetch[index];
              const key = `${CACHE_KEYS.NIVL_QUERY_PREFIX}${originalQuery.toLowerCase().replace(/\s+/g, '-')}`;
              pipeline.set(key, JSON.stringify(fetchedImages), 'EX', CACHE_TTL_SECONDS.NIVL);
              pipelineHasCommands = true;
            }
          } else if (result.status === 'rejected') {
            console.error(`[mission] NIVL query failed for "${queriesToFetch[index]}":`, result.reason);
          }
        });
        if (pipelineHasCommands) await pipeline.exec().catch(err => console.error('[mission][redis] Pipeline exec failed', err));
      }
    } catch (err) { console.error('[mission] Live NIVL fetch failed', err); }
  }
  return Array.from(imageMap.values());
}

function ensureImageList(images: unknown): Img[] {
  if (!Array.isArray(images)) return [];
  return images.reduce((acc: Img[], i: unknown) => {
    if (isRecord(i) && typeof i.href === 'string' && i.href.trim()) {
      acc.push({ title: (typeof i.title === 'string' ? i.title : 'Untitled').slice(0, 200), href: i.href.trim() });
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

function ensureMissionPlan(p: Partial<Pick<RawMission, 'missionTitle' | 'introduction'>> & { topics?: (Partial<EnrichedTopic> | undefined)[] }): EnrichedMissionPlan {
  const title = (typeof p.missionTitle === 'string' ? p.missionTitle : 'Mission Plan').slice(0, 200);
  const intro = (typeof p.introduction === 'string' ? p.introduction : 'Welcome.').slice(0, 600);
  const topics: EnrichedTopic[] = (Array.isArray(p.topics) ? p.topics : [])
    .filter((t): t is Partial<EnrichedTopic> => !!t)
    .map(t => ({
      title: (typeof t.title === 'string' ? t.title : 'Topic').slice(0, 160),
      summary: (typeof t.summary === 'string' ? t.summary : '').slice(0, 400),
      images: ensureImageList(t.images),
      keywords: Array.isArray(t.keywords) ? t.keywords : [],
    }));
  if (topics.length === 0 && !p.missionTitle) {
    throw new Error("Mission generation resulted in no topics and no title.");
  }
  return { missionTitle: title, introduction: intro, topics };
}

function createFallbackMission(reason?: string): EnrichedMissionPlan {
  const userMessage = reason || 'An unexpected error occurred.';
  return {
    missionTitle: 'Mission Aborted',
    introduction: `We were unable to generate your mission. Reason: ${userMessage.slice(0, 200)}`,
    topics: [],
  };
}