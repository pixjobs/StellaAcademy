/* eslint-disable no-console */
/**
 * @file spacePoster.ts (hardened)
 * - LLM gated via shared bottleneck (makeLlmCall)
 * - Soft/hard timeouts for the LLM call
 * - APOD/NIVL fetches wrapped with retry and safe fallbacks
 * - BOUNDED seed building from APOD (prevents runaway loops)
 * - De-dupes topics by title; de-dupes/https-upgrades NIVL images
 * - Keeps the “poster tray” small & useful
 */

import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, Img } from '@/types/mission';
import {
  ensureMissionPlan,
  ensureTopic,
  tryNivlQueries,
  retry,
  extractFirstJsonArray,
  logger,
  getApiKey,
} from '../shared/core';
import { templates } from '../../prompts/templates';
import { makeVariety } from '../shared/variety';
import { fetchAPOD } from '../../apis';
import { makeLlmCall } from '../shared/llm-call';

/* ─────────────────────────────────────────────────────────
   Tunables (via env)
────────────────────────────────────────────────────────── */
const SOFT_MS        = Number(process.env.SPACE_POSTER_LLM_SOFT_MS ?? 6500);
const HARD_MS        = Number(process.env.SPACE_POSTER_LLM_HARD_MS ?? 25000);
const NIVL_ATTEMPTS  = Number(process.env.SPACE_POSTER_NIVL_ATTEMPTS ?? 2);
const NIVL_TRAY_MAX  = Number(process.env.SPACE_POSTER_TRAY_MAX ?? 10);
const NIVL_LINES_MAX = Number(process.env.SPACE_POSTER_LINES_MAX ?? 8);
const TOPICS_MAX     = Number(process.env.SPACE_POSTER_TOPICS_MAX ?? 4);
const APOD_TERMS_MAX = Number(process.env.SPACE_POSTER_APOD_TERMS_MAX ?? 4);
const SEEDS_MAX      = Number(process.env.SPACE_POSTER_SEEDS_MAX ?? 8);

/* ─────────────────────────────────────────────────────────
   Small utils (self-contained)
────────────────────────────────────────────────────────── */
function uniqueByTitle<T extends { title?: string }>(arr: T[], max = Infinity): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of arr) {
    const key = (it.title ?? '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
    if (out.length >= max) break;
  }
  return out;
}

function upgradeHttps(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (
      url.protocol === 'http:' &&
      (/(\.|^)nasa\.gov$/i.test(url.hostname) || /images(-assets)?\.nasa\.gov$/i.test(url.hostname))
    ) {
      url.protocol = 'https:';
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

function dedupeAndCleanImages(items: { title?: string; href?: string }[], max = NIVL_TRAY_MAX): Img[] {
  const seen = new Set<string>();
  const out: Img[] = [];
  for (const x of items) {
    const href = upgradeHttps(x.href) || x.href;
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push({ title: String(x.title || 'Untitled').slice(0, 200), href });
    if (out.length >= max) break;
  }
  return out;
}

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };

/* ── bounded, stable NIVL seed building ────────────────── */
const STOP = new Set([
  'and','the','with','from','into','over','under','about','space','nasa','image','images',
  'poster','for','your','will','have','this','that','those','these','planets','solar','system'
]);
const NIVL_SEED_BASE = ['nebula', 'galaxy', 'star cluster', 'supernova remnant'];

function buildNivlSeeds(apodTitle: string | null, maxSeeds = SEEDS_MAX, maxApodTerms = APOD_TERMS_MAX): string[] {
  const seeds: string[] = [...NIVL_SEED_BASE];
  if (apodTitle) {
    const extra = apodTitle
      .split(/[^A-Za-z0-9]+/g)
      .map(w => w.trim())
      .filter(w => w.length > 3 && !STOP.has(w.toLowerCase()))
      .slice(0, maxApodTerms);
    for (const w of extra) {
      if (!seeds.includes(w)) seeds.push(w);
      if (seeds.length >= maxSeeds) break;
    }
  }
  return seeds.slice(0, maxSeeds);
}

function composeFallbackTopics(
  variety: { lens: string; output: string; challenge: string },
  apodTitle: string | null,
  seedTerms: string[]
): RawTopic[] {
  const verbs = ['Explain', 'Compare', 'Predict', 'Design'];
  const picks = (n: number) => seedTerms.filter(Boolean).slice(0, n);
  const name = apodTitle ?? 'Star-forming Regions';

  const candidates: RawTopic[] = [
    {
      title: `${verbs[0]}: Reading a Nebula Image (${variety.lens})`,
      summary: `How color maps/filters encode physics; build a ${variety.output} legend.`,
      keywords: ['nebula', 'filters', 'false color'],
      searchQueries: ['nebula color filters legend', ...picks(2)],
    },
    {
      title: `${verbs[1]}: Spiral vs Elliptical Galaxy`,
      summary: `Morphology, star formation, and halos; include the “${variety.challenge}” twist.`,
      keywords: ['galaxy', 'morphology'],
      searchQueries: ['spiral vs elliptical galaxy star formation', ...picks(2)],
    },
    {
      title: `${verbs[2]}: Where Will ${name} Form Stars?`,
      summary: `Use dust lanes & color to predict active regions; justify briefly.`,
      keywords: ['star formation', 'dust lanes'],
      searchQueries: ['star formation indicators color dust lanes', ...picks(2)],
    },
    {
      title: `${verbs[3]}: Mini Poster — “What am I seeing?”`,
      summary: `Create a mini guide for non-experts that decodes a JWST/Hubble image.`,
      keywords: ['legend', 'jwst', 'hubble'],
      searchQueries: ['how to read jwst image legend', ...picks(1)],
    },
  ];

  // de-dupe + cap
  return uniqueByTitle(candidates, TOPICS_MAX);
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

  // LLM runner (uses the process-wide bottleneck under the hood)
  const llm = makeLlmCall(context, {
    softMs: SOFT_MS,
    hardMs: HARD_MS,
    tag: 'space-poster-llm',
  });

  // 1) APOD (best-effort)
  let apodTitle: string | null = null;
  let apodLine: string | null = null;

  try {
    const apiKey = await getApiKey(); // required by fetchAPOD
    const apod = await retry(() => fetchAPOD(apiKey), { attempts: 2 });
    if (apod?.title) {
      apodTitle = apod.title;
      apodLine = `${apod.title}${apod.bgUrl ? ' — ' + apod.bgUrl : ''}`;
      logger.info('[SpacePoster] APOD fetched', { title: apod.title });
    } else {
      logger.warn('[SpacePoster] APOD returned without title');
    }
  } catch (e) {
    logger.warn('[SpacePoster] APOD fetch failed', { error: e });
  }

  // 2) NIVL seed tray (bounded, de-duped/https-upgraded)
  const nivlSeeds = buildNivlSeeds(apodTitle);
  let nivlLines: string[] = [];
  let nivlImagesForTray: Img[] = [];
  try {
    const imgs = await retry(
      () =>
        tryNivlQueries(nivlSeeds, {
          limitPerQuery: 2,
          mediaTypes: ['image'],
          randomizePage: true,
        }),
      { attempts: NIVL_ATTEMPTS },
    );

    const cleaned = dedupeAndCleanImages(imgs, NIVL_TRAY_MAX);
    nivlImagesForTray = cleaned;
    nivlLines = cleaned.slice(0, NIVL_LINES_MAX).map((i) => `${i.title ?? 'Untitled'} — ${i.href}`);
    logger.info('[SpacePoster] NIVL search results', { seeds: nivlSeeds, images: imgs.length });
  } catch (e) {
    logger.warn('[SpacePoster] NIVL search failed', { error: e });
  }

  // 3) LLM topics (gated + timed)
  const variety = makeVariety(seed, role, 'space-poster', attempt, [apodTitle ?? '', nivlLines.length]);
  const system =
    (templates && typeof templates.spacePosterTopics === 'function')
      ? templates.spacePosterTopics(aud, variety, apodLine, nivlLines)
      : [
          `# Space Poster — Topics`,
          `Lens: ${variety.lens} | Output: ${variety.output} | Mini-challenge: ${variety.challenge}`,
          apodLine ? `APOD: ${apodLine}` : '',
          nivlLines.length
            ? `Context (NIVL refs, do not copy):\n${nivlLines.map((l, i) => `- ${i + 1}. ${l}`).join('\n')}`
            : '',
          '',
          'Return ONLY a JSON array of 3–5 topic objects with this exact schema:',
          '[{"title":"...","summary":"...","keywords":["k1"],"searchQueries":["q1"]}]',
          'Guidelines:',
          `- Audience: ${aud.level}. ${aud.promptNote}`,
          '- Be specific/technical; avoid generic “history of space” items.',
          '- Topics must be distinct (no near-duplicates).',
        ].filter(Boolean).join('\n');

  let topicsRaw: RawTopic[] = [];
  try {
    const raw = await llm.call(system, { temperature: 0.85 });
    const parsed = extractFirstJsonArray(raw) ?? [];
    const arr = Array.isArray(parsed) ? (parsed as RawTopic[]) : [];
    topicsRaw = uniqueByTitle(arr, TOPICS_MAX);
  } catch (e) {
    logger.warn('[SpacePoster] LLM failed/timeout; using fallback topics', { error: e });
    topicsRaw = composeFallbackTopics(variety, apodTitle, nivlSeeds);
  }

  // 4) Final topics: attach a small, reusable image tray for the poster exercise
  const topics = uniqueByTitle(topicsRaw, TOPICS_MAX).map((t) =>
    ensureTopic({ ...t, images: nivlImagesForTray }),
  );

  return ensureMissionPlan({
    missionTitle: `Space Poster${apodTitle ? `: ${apodTitle}` : ''}`,
    introduction: `Design an educational poster using a ${variety.lens} lens and a ${variety.output} format. Your mission includes a special “${variety.challenge}” panel.`,
    topics,
  });
}
