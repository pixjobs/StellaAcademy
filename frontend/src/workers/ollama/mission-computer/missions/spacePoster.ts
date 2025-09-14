/* eslint-disable no-console */
import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, Img } from '@/types/mission';
import {
  ensureMissionPlan,
  ensureTopic,
  tryNivlQueries,
  hasNasaApiKey,
  retry,
  logNasa,
  extractFirstJsonArray,
  requireBottleneck,
} from '../shared/core';
import { templates } from '../../prompts/templates';
import { makeVariety } from '../shared/variety';
import { fetchAPOD } from '@/lib/nasa';
import { callOllama } from '../../ollama-client';

/* ─────────────────────────────────────────────────────────
   Small utils (self-contained)
────────────────────────────────────────────────────────── */
const SOFT_MS = Number(process.env.SPACE_POSTER_LLM_SOFT_MS ?? 6500);   // return fast if missed
const HARD_MS = Number(process.env.SPACE_POSTER_LLM_HARD_MS ?? 25000); // absolute cap

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uniqueByTitle<T extends { title?: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const key = (it.title ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };

function toImgList(items: { title?: string; href?: string }[]): Img[] {
  return items
    .filter((x) => typeof x.href === 'string' && x.href)
    .map((x) => ({ title: String(x.title || 'Untitled').slice(0, 200), href: x.href! }));
}

/** Compose smart fallback topics from APOD/NIVL context + “variety” */
function composeFallbackTopics(
  variety: { lens: string; output: string; challenge: string },
  apodTitle: string | null,
  seedTerms: string[]
): RawTopic[] {
  const verbs = ['Explain', 'Compare', 'Predict', 'Design'];
  const picks = (n: number) => seedTerms.filter(Boolean).slice(0, n);

  const t1: RawTopic = {
    title: `${verbs[0]}: Reading a Nebula Image (${variety.lens})`,
    summary: `How color maps/filters encode physics; build a ${variety.output} legend.`,
    keywords: ['nebula', 'filters', 'false color'],
    searchQueries: ['nebula color filters legend', ...picks(2)],
  };
  const t2: RawTopic = {
    title: `${verbs[1]}: Spiral vs Elliptical Galaxy`,
    summary: `Morphology, star formation, and halos; include the '${variety.challenge}' twist.`,
    keywords: ['galaxy', 'morphology'],
    searchQueries: ['spiral vs elliptical galaxy star formation', ...picks(2)],
  };
  const name = apodTitle ?? 'Star-forming Regions';
  const t3: RawTopic = {
    title: `${verbs[2]}: Where Will ${name} Form Stars?`,
    summary: `Use dust lanes & color to predict active regions; justify briefly.`,
    keywords: ['star formation', 'dust lanes'],
    searchQueries: ['star formation indicators color dust lanes', ...picks(2)],
  };

  const t4: RawTopic = {
    title: `${verbs[3]}: Mini Poster — “What am I seeing?”`,
    summary: `Create a mini guide for non-experts that decodes a JWST/Hubble image.`,
    keywords: ['legend', 'jwst', 'hubble'],
    searchQueries: ['how to read jwst image legend', ...picks(1)],
  };

  return uniqueByTitle([t1, t2, t3, t4]).slice(0, 3 + (seedTerms.length > 3 ? 1 : 0));
}

/* ─────────────────────────────────────────────────────────
   Main mission
────────────────────────────────────────────────────────── */
export async function missionSpacePoster(
  role: Role,
  context: WorkerContext,
  opts?: { seedIndex?: number; attempt?: number }
): Promise<EnrichedMissionPlan> {
  const aud = (() => {
    switch (role) {
      case 'explorer': return { level: 'kids (8–12)', promptNote: 'Short, friendly sentences.' };
      case 'cadet':    return { level: 'teens',       promptNote: 'Clear, energetic; light terms.' };
      case 'scholar':  return { level: 'undergrad',   promptNote: 'Concise & technical.' };
      default:         return { level: 'general',     promptNote: 'Clear & precise.' };
    }
  })();

  const seed = (opts?.seedIndex ?? Date.now()) >>> 0;
  const attempt = Math.max(1, opts?.attempt ?? 1);
  const bottleneck = requireBottleneck(context);

  // Context: APOD (if available) + NIVL seeds derived from APOD title/keywords
  let apodTitle: string | null = null;
  let apodLine: string | null = null;
  const nivlSeeds = new Set<string>(['nebula', 'galaxy', 'star cluster', 'supernova remnant']);

  if (hasNasaApiKey()) {
    try {
      const apod = await fetchAPOD().catch(() => null);
      if (apod?.title) {
        apodTitle = apod.title;
        apodLine = `${apod.title}${apod.bgUrl ? ' — ' + apod.bgUrl : ''}`;
        apod.title.split(/\s+/).forEach((w) => { if (w.length > 3) nivlSeeds.add(w); });
      }
    } catch (e) {
      console.warn('[mission][nasa] APOD failed.', e);
    }
  }

  let nivlLines: string[] = [];
  let nivlImagesForTray: Img[] = [];
  if (hasNasaApiKey()) {
    try {
      const imgs = await retry(
        () => tryNivlQueries(Array.from(nivlSeeds), context.redis, 2),
        { attempts: 2 }
      );
      nivlLines = imgs.slice(0, 8).map((i) => `${i.title} — ${i.href}`);
      nivlImagesForTray = toImgList(imgs).slice(0, 10);
      logNasa('SpacePoster NIVL', { seeds: Array.from(nivlSeeds), images: imgs.length });
    } catch (e) {
      console.warn('[mission][nasa] NIVL search failed (space-poster).', e);
    }
  }

  const variety = makeVariety(seed, role, 'space-poster', attempt, [apodTitle ?? '', nivlLines.length]);
  const system = templates.spacePosterTopics(aud, variety, apodLine, nivlLines);

  // Kick off the LLM call (hard cap); we’ll “soft return” if it doesn’t arrive quickly.
  const llmPromise = (async () => {
    const raw = await Promise.race([
      bottleneck.submit(() => callOllama(system, { temperature: 0.85 })),
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error(`space-poster-llm hard cap ${HARD_MS}ms`)), HARD_MS)),
    ]) as string;
    const parsed = extractFirstJsonArray(raw) ?? [];
    return Array.isArray(parsed) ? parsed as RawTopic[] : [];
  })();

  // Soft deadline: if LLM hasn’t produced by SOFT_MS, compose smart fallback (no scary error log).
  let topicsRaw: RawTopic[] = [];
  try {
    topicsRaw = await Promise.race<RawTopic[] | null>([
      llmPromise,
      (async () => { await sleep(SOFT_MS); return null; })(),
    ]) ?? composeFallbackTopics(variety, apodTitle, Array.from(nivlSeeds));
  } catch {
    // If LLM truly failed within hard cap, compose fallback.
    topicsRaw = composeFallbackTopics(variety, apodTitle, Array.from(nivlSeeds));
  }

  // Optional: attach a small shared tray of images for the poster UI
  const topics = uniqueByTitle(topicsRaw).map((t) => ensureTopic({ ...t, images: nivlImagesForTray }));

  return ensureMissionPlan({
    missionTitle: `Space Poster${apodTitle ? ` — ${apodTitle}` : ''}`,
    introduction: `Design an educational poster using a ${variety.lens} lens and a ${variety.output} format. Includes a “${variety.challenge}” panel.`,
    topics,
  });
}
