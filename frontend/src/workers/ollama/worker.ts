/* eslint-disable no-console */
import { Worker, QueueEvents } from 'bullmq';
import { connection, LLM_QUEUE_NAME } from '@/lib/queue';

// Import job-specific types from the LLM definitions
import type { LlmJobData, LlmJobResult, Role, MarsPhoto } from '@/types/llm';

// Import the rich, canonical data structures from the mission definitions
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';

import { searchNIVL, fetchMarsPhotos, fetchAPOD } from '@/lib/nasa';

/* ─────────────────────────────────────────────────────────
   Config & Environment
────────────────────────────────────────────────────────── */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
const CONCURRENCY = clampInt(process.env.OLLAMA_WORKER_CONCURRENCY, 1, 8, 1);
const REQUEST_TIMEOUT_MS = clampInt(process.env.OLLAMA_TIMEOUT_MS, 5_000, 120_000, 60_000);
const RETRIES = clampInt(process.env.OLLAMA_RETRIES, 0, 5, 2);
const DEBUG = process.env.DEBUG_WORKER === '1';

/* ─────────────────────────────────────────────────────────
   Utilities & Type Guards
────────────────────────────────────────────────────────── */
function clampInt(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (process.env.OLLAMA_BEARER_TOKEN) h.Authorization = `Bearer ${process.env.OLLAMA_BEARER_TOKEN}`;
  else if (process.env.OLLAMA_BASIC_AUTH) h.Authorization = `Basic ${Buffer.from(process.env.OLLAMA_BASIC_AUTH).toString('base64')}`;
  return h;
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function jitteredBackoff(baseMs: number, attempt: number, capMs: number): number {
  const expo = baseMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * baseMs;
  return Math.min(capMs, Math.round(expo + jitter));
}

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(input, { ...(init ?? {}), signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

async function pingOllama(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' }, 4000);
    return res.ok;
  } catch {
    return false;
  }
}

const VALID_ROLES = ['explorer', 'cadet', 'scholar'] as const;
function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value);
}

const VALID_MISSION_TYPES = ['rocket-lab', 'rover-cam', 'space-poster'] as const;
type MissionType = (typeof VALID_MISSION_TYPES)[number];
function isMissionType(value: unknown): value is MissionType {
  return typeof value === 'string' && (VALID_MISSION_TYPES as readonly string[]).includes(value);
}

/* ─────────────────────────────────────────────────────────
   LLM Call & Safety Net
────────────────────────────────────────────────────────── */
function postProcessLlmResponse(text: string): string {
  if (!text) return '';
  let processed = text;
  processed = processed.replace(/(\w)(\\[a-zA-Z]+)/g, '$1 $2');
  processed = processed.replace(/(\})(\w)/g, '$1 $2');
  const latexPattern = /\\(frac|int|sum|mathbf|left|right|cdot|times|gamma|sigma|approx)|[\^_]/;
  processed = processed
    .split('\n')
    .map((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('$$') || trimmedLine.includes('$') || !latexPattern.test(trimmedLine)) return line;
      const match = line.match(/^(.*?)((?:[A-Za-z]|\\sum)\s*?=\s*.*)$/);
      if (match) {
        const introText = (match[1] || '').trim();
        const formulaText = (match[2] || '').trim();
        if (latexPattern.test(formulaText)) {
          console.log(`[worker][safety-net] Wrapping naked block formula: "${formulaText}"`);
          return `${introText}\n\n$$ ${formulaText} $$`;
        }
      }
      return line;
    })
    .join('\n');
  processed = processed.replace(/(\s)([A-Za-z]\s*=\s*[A-Za-z].*?)([\s.,]|$)/g, (match, startChar, formula, endChar) => {
    if (formula.includes('$') || formula.includes('$$') || formula.length > 30) return match;
    console.log(`[worker][safety-net] Wrapping naked inline formula: "${formula}"`);
    return `${startChar}$${formula.trim()}$${endChar}`;
  });
  return processed;
}

async function callOllama(prompt: string, options: { retries?: number; temperature?: number } = {}): Promise<string> {
  const { retries = RETRIES, temperature = 0.6 } = options;
  const body = JSON.stringify({
    model: OLLAMA_MODEL,
    stream: false,
    prompt,
    options: { temperature, keep_alive: '10m' },
  });
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Ollama ${res.status}: ${txt || res.statusText}`);
      }
      const json = (await res.json()) as { response?: string };
      return json.response ?? '';
    } catch (e: unknown) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const delay = jitteredBackoff(300, attempt, 4000);
      console.warn(`[worker] ollama attempt ${attempt} failed: ${msg} (retry in ${delay}ms)`);
      if (attempt <= retries) await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/* ─────────────────────────────────────────────────────────
   Mission-related Logic (Type-Safe)
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

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { missionTitle: string; introduction: string; topics: RawTopic[] };

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

async function tryNivlQueries(seeds: string[], limit = 6): Promise<Img[]> {
  const queries = uniq(seeds.flatMap((q) => [q, `${q} rocket`, `${q} launch`, `${q} NASA`])).slice(0, 6);
  for (const q of queries) {
    const items = await searchNIVL(q, { limit, expandAssets: true, prefer: 'large' });
    if (items.length) {
      return items.filter((i: any) => i.href).map((i: any) => ({ title: i.title as string, href: i.href as string }));
    }
  }
  return [];
}

function fallbackRocketImages(): Img[] {
  return [{ title: 'Rocket Fallback 1', href: '/fallback/rocket/1.jpg' }];
}
function fallbackMarsImages(): Img[] {
  return [{ title: 'Mars Fallback 1', href: '/fallback/mars/1.jpg' }];
}
function fallbackSpaceImages(): Img[] {
  return [{ title: 'Space Fallback 1', href: '/fallback/space/1.jpg' }];
}

function ensureImageList(images: Img[] | undefined, fallback: Img[]): Img[] {
  const src = Array.isArray(images) ? images : [];
  const clean: Img[] = [];
  for (const i of src) {
    if (!i) continue;
    const title = (i.title ?? 'Untitled').slice(0, 200);
    const href = String(i.href ?? '').trim();
    if (href.length > 0) clean.push({ title, href });
  }
  return clean.length ? clean : fallback;
}

function ensureTopic(
  t: Partial<RawTopic> & { images?: Img[] },
  fallbackSet: 'rocket' | 'mars' | 'space' = 'rocket'
): EnrichedTopic {
  const fb =
    fallbackSet === 'mars'
      ? fallbackMarsImages()
      : fallbackSet === 'space'
      ? fallbackSpaceImages()
      : fallbackRocketImages();
  return {
    title: (t.title ?? 'Topic').slice(0, 160),
    summary: (t.summary ?? '').slice(0, 400),
    images: ensureImageList(t.images, fb),
    keywords: t.keywords ?? [],
  };
}

function ensureMissionPlan(
  p: Partial<Pick<RawMission, 'missionTitle' | 'introduction'>> & { topics?: EnrichedTopic[] },
  fallbackSet: 'rocket' | 'mars' | 'space' = 'rocket'
): EnrichedMissionPlan {
  const fbTopic = ensureTopic({
    title: fallbackSet === 'mars' ? 'Mars Gallery' : fallbackSet === 'space' ? 'Space Gallery' : 'Rocket Gallery',
    summary: 'Fallback images.',
    images: fallbackSet === 'mars' ? fallbackMarsImages() : fallbackSet === 'space' ? fallbackSpaceImages() : fallbackRocketImages(),
  });

  const title = (p.missionTitle ??
    (fallbackSet === 'mars' ? 'Mars Mission' : fallbackSet === 'space' ? 'Space Poster' : 'Rocket Mission')
  ).slice(0, 200);

  const intro = (p.introduction ??
    (fallbackSet === 'mars' ? 'Welcome to Rover Cam.' : fallbackSet === 'space' ? 'Welcome to Space Poster.' : 'Welcome to Rocket Lab.')
  ).slice(0, 600);

  const topics = (p.topics ?? []).filter((t) => t.images.length > 0);

  return {
    missionTitle: title,
    introduction: intro,
    topics: topics.length ? topics : [fbTopic],
  };
}

type APODLike = Partial<{ title: string; explanation: string; bgUrl: string }>;

async function computeMission(role: Role, missionType: MissionType): Promise<EnrichedMissionPlan> {
  if (missionType === 'space-poster') {
    try {
      const apod = (await fetchAPOD().catch(() => null)) as APODLike | null;
      const seeds = uniq([apod?.title || '', 'nebula', 'galaxy', 'space telescope', 'star field']).filter(Boolean);
      let extras: Img[] = [];
      for (const q of seeds) {
        const items = await searchNIVL(q, { limit: 6, expandAssets: true, prefer: 'large' }).catch(() => []);
        extras = (items as any[]).filter((i) => i && i.href).map((i) => ({ title: String(i.title ?? 'Untitled'), href: String(i.href) }));
        if (extras.length >= 4) break;
      }
      const images: Img[] = ensureImageList(
        [
          ...(apod?.bgUrl ? [{ title: apod.title || 'APOD', href: apod.bgUrl }] : []),
          ...extras,
        ],
        fallbackSpaceImages()
      ).slice(0, 8);

      const summary = (apod?.explanation || 'Create a space poster using today’s featured image and related NASA visuals.').slice(0, 400);
      const topic = ensureTopic({ title: apod?.title || 'APOD Selection', summary, images }, 'space');
      return ensureMissionPlan(
        {
          missionTitle: `Space Poster: ${apod?.title || 'Astronomy Picture of the Day'}`,
          introduction: `Welcome, ${role}. We’ll build a one-page space poster from APOD and a few related visuals. Pick an image, ask Stella for a caption, and export your poster.`,
          topics: [topic],
        },
        'space'
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[worker] space-poster failed, using fallback.', msg);
      return ensureMissionPlan({}, 'space');
    }
  }

  if (missionType === 'rocket-lab') {
    const systemPrompt = `You output ONLY JSON in this exact schema: {"missionTitle":"","introduction":"","topics":[{"title":"","summary":"","keywords":["",""],"searchQueries":["","",""]}]}. Rules: Titles must be concrete & rocket-specific. "summary": 1–2 sentences. "keywords": 2–4 domain terms. "searchQueries": 3 short phrases for NASA images. Total <= ~600 chars. No extra text.`.trim();
    const r = await callOllama(systemPrompt, { temperature: 0.7 });
    const jsonStr = extractFirstJsonObject(r);
    if (!jsonStr) return ensureMissionPlan({}, 'rocket');

    const base = validateMissionJson(JSON.parse(jsonStr));
    const topics = await Promise.all(
      base.topics.map(async (t) => {
        const seeds = t.searchQueries.length ? t.searchQueries : t.keywords.length ? t.keywords : [t.title];
        try {
          const items = await tryNivlQueries(seeds, 6);
          return ensureTopic({ ...t, images: items }, 'rocket');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('[worker] NIVL error for', seeds.join(' | '), msg);
          return ensureTopic({ ...t, images: [] }, 'rocket');
        }
      })
    );
    return ensureMissionPlan({ ...base, topics }, 'rocket');
  }

  // rover-cam
  const rover = 'curiosity';
  const sol = 1000;
  const predefined: Array<Pick<RawTopic, 'title' | 'summary' | 'keywords'>> = [
    { title: 'Navigation Camera (Navcam)', summary: 'Images taken by the main navigation cameras.', keywords: ['navcam'] },
    { title: 'Front Hazard Cams (FHAZ)', summary: 'Views from the front of the rover, used for avoiding obstacles.', keywords: ['fhaz'] },
    { title: 'Rear Hazard Cams (RHAZ)', summary: 'Views from the back of the rover.', keywords: ['rhaz'] },
  ];

  const topics = await Promise.all(
    predefined.map(async (t) => {
      try {
        const camera = t.keywords[0]!;
        const photos: MarsPhoto[] = await fetchMarsPhotos({ rover, sol, camera, page: 1 });
        const images: Img[] = (photos ?? [])
          .map((p) => ({
            title: `${p.rover?.name ?? rover} - ${p.camera?.name ?? camera} (${p.earth_date ?? ''})`,
            href: String(p.img_src ?? '').trim(),
          }))
          .filter((x) => x.href.length > 0);
        return ensureTopic({ title: t.title, summary: t.summary, images }, 'mars');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[worker] Mars photos error for', t.title, msg);
        return ensureTopic({ title: t.title, summary: t.summary, images: [] }, 'mars');
      }
    })
  );

  return ensureMissionPlan(
    {
      missionTitle: `Curiosity Rover: Sol ${sol}`,
      introduction: `Welcome, ${role}. We have several camera feeds from the Curiosity rover on Mars. Select a camera to analyze its images.`,
      topics,
    },
    'mars'
  );
}

/* ─────────────────────────────────────────────────────────
   Worker Boot & Logging
────────────────────────────────────────────────────────── */
(async () => {
  const ollamaOk = await pingOllama();
  console.log('[worker] boot', {
    queue: LLM_QUEUE_NAME,
    redisUrl: maskRedisUrl(process.env.REDIS_URL),
    ollama: { baseUrl: OLLAMA_BASE_URL, model: OLLAMA_MODEL, reachable: ollamaOk },
    concurrency: CONCURRENCY,
    reqTimeoutMs: REQUEST_TIMEOUT_MS,
    pid: process.pid,
  });
})().catch(() => {});

function maskRedisUrl(u?: string) {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (url.password) url.password = '****';
    return url.toString();
  } catch {
    return u;
  }
}

/* ─────────────────────────────────────────────────────────
   Main Worker Process
────────────────────────────────────────────────────────── */
const worker = new Worker<LlmJobData, LlmJobResult>(
  LLM_QUEUE_NAME,
  async (job) => {
    const { id, name, data } = job;
    console.log(`[worker] processing job`, { id, name, type: (data as any)?.type });

    try {
      if (data.type === 'mission') {
        const mt = (data as any).payload?.missionType;
        const missionType = isMissionType(mt) ? mt : 'rocket-lab';
        const r = (data as any).payload?.role;
        const role = isRole(r) ? r : 'explorer';

        await job.updateProgress(5);
        const mission = await computeMission(role, missionType);
        await job.updateProgress(100);
        return { type: 'mission', result: mission };
      }

      if (data.type === 'ask') {
        const payload = (data as any).payload;
        const prompt = payload?.prompt;
        const context = payload?.context;

        if (typeof prompt !== 'string' || !prompt) {
          throw new Error('Job payload is missing a valid prompt.');
        }

        const hardenedPrompt = context
          ? `Use the following context to answer the question.\n\n--- CONTEXT ---\n${context}\n\n--- QUESTION ---\n${prompt}`
          : prompt;

        if (DEBUG) {
          console.log(`[worker][Job ${id}] Sending hardened prompt to Ollama.`);
          console.log(`[worker][Job ${id}] Context length: ${context?.length ?? 0}`);
        }

        await job.updateProgress(5);
        const rawAnswer = await callOllama(hardenedPrompt, { temperature: 0.6 });
        const fixedAnswer = postProcessLlmResponse(rawAnswer);

        await job.updateProgress(100);
        return { type: 'ask', result: { answer: fixedAnswer } };
      }

      const unknownType = (data as { type?: unknown }).type;
      throw new Error(`Unknown job type: ${String(unknownType)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error('[worker] job error', { id, name, msg, stack });
      throw new Error(msg);
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
    lockDuration: 90_000,
    stalledInterval: 30_000,
    maxStalledCount: 1,
    autorun: true,
  }
);

/* ─────────────────────────────────────────────────────────
   Event Listeners & Graceful Shutdown
────────────────────────────────────────────────────────── */
const events = new QueueEvents(LLM_QUEUE_NAME, { connection });

events.on('active', (args: { jobId: string }) => {
  if (DEBUG) console.log('[worker] active', args.jobId);
});
events.on('completed', (args: { jobId: string }) => {
  if (DEBUG) console.log('[worker] completed', args.jobId);
});
events.on('failed', (args: { jobId: string; failedReason?: string | null }) => {
  console.error('[worker] failed', { jobId: args.jobId, failedReason: args.failedReason });
});
events.on('stalled', (args: { jobId: string }) => {
  console.warn('[worker] stalled', { jobId: args.jobId });
});

worker.on('ready', () => console.log(`[worker] ready on "${LLM_QUEUE_NAME}"`));
worker.on('error', (e: Error) => {
  console.error('[worker] error', e?.message || e);
});

const shutdown = async () => {
  console.log('[worker] shutting down...');
  await worker.close();
  await events.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('[worker] unhandledRejection', { reason, promise });
});
process.on('uncaughtException', (error: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
  console.error('[worker] uncaughtException', { error, origin });
});