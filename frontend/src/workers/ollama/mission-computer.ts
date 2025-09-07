/**
 * =========================================================================
 * MISSION COMPUTER
 *
 * This module contains the core business logic for computing and assembling
 * mission plans for the user. It orchestrates calls to NASA APIs and the
 * Ollama client to generate structured, enriched mission data.
 * =========================================================================
 */

import { searchNIVL, fetchAPOD, fetchLatestMarsPhotos, fetchEPICImages, NivlItem } from '@/lib/nasa';
import { callOllama } from './ollama-client';
import type { Role, MarsPhoto, MissionType } from '@/types/llm';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';

// --- Local Types ---
type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { missionTitle: string; introduction: string; topics: RawTopic[] };
type APODLike = Partial<{ title: string; explanation: string; bgUrl: string }>;

/* ─────────────────────────────────────────────────────────
   Main Export: computeMission
────────────────────────────────────────────────────────── */

export async function computeMission(role: Role, missionType: MissionType): Promise<EnrichedMissionPlan> {
  switch (missionType) {
    case 'space-poster':
      return computeSpacePosterMission(role);
    case 'rocket-lab':
      return computeRocketLabMission();
    case 'rover-cam':
      return computeRoverCamMission(role);
    case 'earth-observer':
      return computeEarthObserverMission(role);
    case 'celestial-investigator':
      return computeCelestialInvestigatorMission(role);
    default:
      // A sensible fallback if the mission type is ever invalid
      return computeRocketLabMission();
  }
}

/* ─────────────────────────────────────────────────────────
   Mission-Specific Implementations
────────────────────────────────────────────────────────── */

async function computeSpacePosterMission(role: Role): Promise<EnrichedMissionPlan> {
  try {
    const apod = await fetchAPOD();
    const seeds = uniq([apod.title, 'nebula', 'galaxy', 'space telescope', 'star cluster']).filter(Boolean);
    const extras = await tryNivlQueries(seeds, 8);

    const images: Img[] = ensureImageList(
      [...(apod.bgUrl ? [{ title: apod.title, href: apod.bgUrl }] : []), ...extras]
    ).slice(0, 8);

    const summary = (apod.explanation || 'Create a space poster using today’s featured image and related NASA visuals.').slice(0, 400);
    const topic = ensureTopic({ title: apod.title || 'APOD Selection', summary, images });

    return ensureMissionPlan({
      missionTitle: `Space Poster: ${apod.title || 'Astronomy Picture of the Day'}`,
      introduction: `Welcome, ${role}. We’ll build a one-page space poster from APOD and a few related visuals. Pick an image, ask Stella for a caption, and export your poster.`,
      topics: [topic],
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[mission] space-poster failed:', msg);
    return ensureMissionPlan({
      missionTitle: 'Space Poster',
      introduction: 'Could not retrieve the Astronomy Picture of the Day. Please try again later.',
      topics: []
    });
  }
}

async function computeRocketLabMission(): Promise<EnrichedMissionPlan> {
  const systemPrompt = `You output ONLY JSON in this exact schema: {"missionTitle":"","introduction":"","topics":[{"title":"","summary":"","keywords":["",""],"searchQueries":["","",""]}]}. Rules: Titles must be concrete & rocket-specific. "summary": 1–2 sentences. "keywords": 2–4 domain terms. "searchQueries": 3 short phrases for NASA images. Total <= ~600 chars. No extra text.`.trim();
  const r = await callOllama(systemPrompt, { temperature: 0.7 });
  const jsonStr = extractFirstJsonObject(r);
  if (!jsonStr) return ensureMissionPlan({ missionTitle: 'Rocket Lab Mission', introduction: 'Could not generate a mission plan from the LLM.', topics: [] });

  const base = validateMissionJson(JSON.parse(jsonStr));
  const topics = await Promise.all(
    base.topics.map(async (t) => {
      const seeds = t.searchQueries.length ? t.searchQueries : t.keywords.length ? t.keywords : [t.title];
      try {
        const items = await tryNivlQueries(seeds, 6);
        return ensureTopic({ ...t, images: items });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[mission] NIVL error for', seeds.join(' | '), msg);
        return ensureTopic({ ...t, images: [] });
      }
    })
  );
  return ensureMissionPlan({ ...base, topics });
}

async function computeRoverCamMission(role: Role): Promise<EnrichedMissionPlan> {
  try {
    const rover = 'curiosity';
    const latestPhotos: MarsPhoto[] = await fetchLatestMarsPhotos(rover);

    const cameraInfo = {
      FHAZ: { name: 'Front Hazard Avoidance Camera', desc: 'Views from the front of the rover, used for avoiding obstacles.' },
      RHAZ: { name: 'Rear Hazard Avoidance Camera', desc: 'Views from the back of the rover, for hazard avoidance.' },
      MAST: { name: 'Mast Camera', desc: 'Takes color images and videos of the Martian terrain.' },
      CHEMCAM: { name: 'Chemistry & Camera Complex', desc: 'Uses a laser to analyze rock composition from a distance.' },
      NAVCAM: { name: 'Navigation Camera', desc: 'Black and white cameras that help engineers drive the rover.' },
    };

    const topics = Object.entries(cameraInfo).map(([code, info]) => {
      const cameraPhotos = latestPhotos.filter(p => p.camera.name === code);
      const images: Img[] = cameraPhotos.map(p => ({
        title: `Curiosity ${p.camera.full_name} (${p.earth_date})`,
        href: p.img_src,
      })).filter(x => x.href);
      
      return ensureTopic({ title: `Latest from ${info.name}`, summary: info.desc, images });
    });

    return ensureMissionPlan({
      missionTitle: `Latest Photos from Curiosity Rover`,
      introduction: `Welcome, ${role}. These are the most recent images sent back from the Curiosity rover on Mars. Analyze what the rover has seen in the last few days.`,
      topics,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[mission] Rover Cam mission failed:', msg);
    return ensureMissionPlan({ missionTitle: 'Latest Photos from Mars', introduction: 'Could not retrieve the latest images from the rover. Please try again later.', topics: [] });
  }
}

async function computeEarthObserverMission(role: Role): Promise<EnrichedMissionPlan> {
  try {
    const epicImages = await fetchEPICImages({ count: 12 });
    if (!epicImages || epicImages.length === 0) {
      throw new Error('The NASA EPIC API did not return any recent images. The service may be temporarily unavailable.');
    }

    const images: Img[] = epicImages.map((img) => ({
        title: `Earth on ${new Date(img.date).toUTCString()}`,
        href: img.href,
    }));

    const topic = ensureTopic({
        title: 'Recent Views of Earth',
        summary: 'These are the latest true-color images of Earth from the DSCOVR satellite, positioned one million miles away, capturing the entire sunlit side of our planet.',
        images,
    });

    return ensureMissionPlan({
      missionTitle: 'Earth Observer',
      introduction: `Welcome, ${role}. Your mission is to observe our home planet from deep space. Analyze these recent images from the EPIC camera and ask questions about weather, geography, and Earth's place in the solar system.`,
      topics: [topic],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[mission] Earth Observer mission failed:', msg);
    return ensureMissionPlan({ missionTitle: 'Earth Observer', introduction: `Could not retrieve the latest images. Reason: ${msg}`, topics: [] });
  }
}

async function computeCelestialInvestigatorMission(role: Role): Promise<EnrichedMissionPlan> {
    try {
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
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[mission] Celestial Investigator mission failed:', msg);
        return ensureMissionPlan({ missionTitle: 'Celestial Investigator', introduction: 'Could not retrieve images for the investigation. Please try again later.', topics: [] });
    }
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

/**
 * Aggressively searches the NASA Image Library (NIVL) using multiple queries in parallel.
 * It fetches results for all seeds, combines them, and returns a deduplicated list of images.
 * @param seeds An array of search terms.
 * @param limitPerQuery The number of images to fetch for each individual query.
 * @returns A promise that resolves to an array of unique image objects.
 */
async function tryNivlQueries(seeds: string[], limitPerQuery = 4): Promise<Img[]> {
  const queries = uniq(seeds).slice(0, 5); // Limit to 5 parallel queries to be kind to the API.
  if (queries.length === 0) return [];
  
  console.log(`[mission] tryNivlQueries: Searching for ${queries.length} queries in parallel...`, queries);

  const allResults = await Promise.allSettled(
    queries.map(q => searchNIVL(q, { limit: limitPerQuery, expandAssets: true, prefer: 'large' }))
  );

  const imageMap = new Map<string, Img>();

  for (const result of allResults) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      for (const item of result.value) {
        if (item.href && !imageMap.has(item.href)) {
          imageMap.set(item.href, { title: item.title, href: item.href });
        }
      }
    }
  }
  
  const uniqueImages = Array.from(imageMap.values());
  console.log(`[mission] tryNivlQueries: Found ${uniqueImages.length} unique images from ${queries.length} queries.`);
  
  return uniqueImages;
}

function ensureImageList(images: Img[] | undefined): Img[] {
  const src = Array.isArray(images) ? images : [];
  const clean: Img[] = [];
  for (const i of src) {
    if (!i || typeof i.href !== 'string') continue;
    const title = (i.title ?? 'Untitled').slice(0, 200);
    const href = i.href.trim();
    if (href.length > 0) clean.push({ title, href });
  }
  return clean;
}

function ensureTopic(t: Partial<RawTopic> & { images?: Img[] }): EnrichedTopic {
  return {
    title: (t.title ?? 'Topic').slice(0, 160),
    summary: (t.summary ?? '').slice(0, 400),
    images: ensureImageList(t.images),
    keywords: t.keywords ?? [],
  };
}

function ensureMissionPlan(p: Partial<Pick<RawMission, 'missionTitle' | 'introduction'>> & { topics?: EnrichedTopic[] }): EnrichedMissionPlan {
  const title = (p.missionTitle ?? 'Mission Plan').slice(0, 200);
  const intro = (p.introduction ?? 'Welcome to your mission.').slice(0, 600);
  
  const topics = (p.topics ?? []).filter((t) => t.images.length > 0);

  return {
    missionTitle: title,
    introduction: intro,
    topics: topics,
  };
}