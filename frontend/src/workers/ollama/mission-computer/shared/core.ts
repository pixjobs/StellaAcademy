/* eslint-disable no-console */
import type { Redis } from 'ioredis';
import type { WorkerContext } from '../../context';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';
import type { Role, MissionType, NivlItem } from '@/types/llm';
import { searchNIVL } from '@/lib/nasa';

const DEBUG_NASA = process.env.DEBUG_NASA === '1';
export const logNasa = (...args: unknown[]): void => { if (DEBUG_NASA) console.log('[NASA]', ...args); };

/* ─────────────────────────────────────────────────────────
   Type guards & utils
────────────────────────────────────────────────────────── */
export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
export function jitter(baseMs: number): number {
  return Math.floor(baseMs * (0.6 + Math.random() * 0.8));
}

export type RetryOpts = {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onError?: (err: unknown, attempt: number) => void;
};

export async function retry<T>(fn: () => Promise<T>, options?: RetryOpts): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 700;
  const maxDelayMs = options?.maxDelayMs ?? 5_000;
  for (let a = 1; a <= attempts; a += 1) {
    try {
      return await fn();
    } catch (err) {
      options?.onError?.(err, a);
      if (a === attempts) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (a - 1), maxDelayMs);
      await sleep(jitter(delay));
    }
  }
  // Should be unreachable due to throw above, but keep TS happy:
  throw new Error('Retry exhausted');
}

export function requireBottleneck(ctx: WorkerContext): { submit<T>(fn: () => Promise<T>): Promise<T> } {
  const b = (ctx as unknown as { llmBottleneck?: unknown }).llmBottleneck;
  if (!b || typeof (b as { submit?: unknown }).submit !== 'function') {
    throw new Error('[mission] llmBottleneck missing from WorkerContext (no submit). Ensure bootstrap injects it.');
  }
  return b as { submit<T>(fn: () => Promise<T>): Promise<T> };
}

export function hasNasaApiKey(): boolean {
  return typeof process.env.NASA_API_KEY === 'string' && process.env.NASA_API_KEY.trim().length > 0;
}

export function uniq<T>(arr: Array<T | null | undefined>): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)));
}

/* ─────────────────────────────────────────────────────────
   NIVL caching (search image library)
────────────────────────────────────────────────────────── */
const QUERY_AGGREGATION_TIMEOUT_MS = 15_000;
const CACHE_KEYS = { NIVL_QUERY_PREFIX: 'nivl-query:' } as const;
const CACHE_TTL_SECONDS = { NIVL: 86_400 } as const; // 24h

export async function tryNivlQueries(
  seeds: string[],
  redis: Redis,
  limitPerQuery = 4,
): Promise<Img[]> {
  const queries = uniq(seeds).slice(0, 5);
  if (queries.length === 0) return [];

  const imageMap = new Map<string, Img>();
  const cacheKeys = queries.map((q) => `${CACHE_KEYS.NIVL_QUERY_PREFIX}${q.toLowerCase().replace(/\s+/g, '-')}`);
  let toFetch: string[] = [];

  // Cache pass
  try {
    const cached = await redis.mget(cacheKeys);
    cached.forEach((json, i) => {
      if (!json) {
        toFetch.push(queries[i]);
        return;
      }
      try {
        const imgs = JSON.parse(json) as Img[];
        if (Array.isArray(imgs)) {
          for (const img of imgs) {
            if (isRecord(img) && typeof (img as { href?: unknown }).href === 'string' && typeof (img as { title?: unknown }).title === 'string') {
              const href = (img as { href: string }).href;
              if (!imageMap.has(href)) imageMap.set(href, { title: (img as { title: string }).title, href });
            }
          }
        }
      } catch {
        toFetch.push(queries[i]);
      }
    });
  } catch (e) {
    console.error('[mission][redis] MGET failed, fetching live:', e);
    toFetch = [...queries];
  }

  // Live fetch
  if (toFetch.length > 0) {
    const searchPromises = toFetch.map((q) => searchNIVL(q, { limit: limitPerQuery }));
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('NIVL timeout')), QUERY_AGGREGATION_TIMEOUT_MS));
    try {
      const settled = (await Promise.race([Promise.allSettled(searchPromises), timeout])) as PromiseSettledResult<NivlItem[]>[];
      if (Array.isArray(settled)) {
        const pipeline = redis.pipeline();
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

            for (const img of fetched) {
              if (!imageMap.has(img.href)) imageMap.set(img.href, img);
            }

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

/* ─────────────────────────────────────────────────────────
   Sanitizers & builders
────────────────────────────────────────────────────────── */
export function ensureImageList(images: unknown): Img[] {
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

export function ensureTopic(t: Partial<{ title: string; summary: string; keywords: string[] }> & { images?: unknown }): EnrichedTopic {
  return {
    title: (typeof t.title === 'string' ? t.title : 'Topic').slice(0, 160),
    summary: (typeof t.summary === 'string' ? t.summary : '').slice(0, 400),
    images: ensureImageList(t.images),
    keywords: Array.isArray(t.keywords) ? t.keywords : [],
  };
}

export function ensureMissionPlan(
  p: Partial<{ missionTitle: string; introduction: string }> & { topics?: Array<Partial<EnrichedTopic> | undefined> },
): EnrichedMissionPlan {
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
  if (topics.length === 0 && !p.missionTitle) {
    throw new Error('Mission generation resulted in no topics and no title.');
  }
  return { missionTitle: title, introduction: intro, topics };
}

/* ─────────────────────────────────────────────────────────
   LLM helpers
────────────────────────────────────────────────────────── */
export function stripFences(s: string): string {
  return s ? s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1').trim() : '';
}

export function extractFirstJsonArray(text: string): Record<string, unknown>[] | null {
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
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────
   Types exported for consumers
────────────────────────────────────────────────────────── */
export type { Role, MissionType };
