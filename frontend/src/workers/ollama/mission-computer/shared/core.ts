/* eslint-disable no-console */

/**
 * @file core.ts
 * @description
 * This file contains shared core utilities for mission generation. It orchestrates
 * calls to specialized API clients by fetching and providing the necessary API key.
 */

import type { WorkerContext } from '../../context';
import type { EnrichedMissionPlan, EnrichedTopic, Img } from '@/types/mission';
import type { Role, MissionType } from '@/types/llm';
import { searchNIVLFull, toCard, type NivlItem, type NivlSearchResult } from '../../apis';
import { getNasaApiKey } from '@/lib/secrets';
import { logger } from '../../utils/logger';

// Re-export the logger for convenience in other modules
export { logger };

// --- API Key Management ---
let nasaApiKey: string | null = null;
/**
 * Fetches the NASA API key once and caches it in memory.
 * This is exported so mission files can use it to pass to API clients that require it.
 */
export async function getApiKey(): Promise<string> {
  if (nasaApiKey !== null) return nasaApiKey;
  try {
    const key = await getNasaApiKey();
    if (key) {
      nasaApiKey = key;
    } else {
      logger.warn('[core] NASA API key is missing. Using public DEMO_KEY, which has strict rate limits.');
      nasaApiKey = 'DEMO_KEY';
    }
  } catch (error) {
    logger.error('[core] Failed to fetch NASA API key from secrets manager. Using DEMO_KEY.', error);
    nasaApiKey = 'DEMO_KEY';
  }
  return nasaApiKey;
}

/* ─────────────────────────────────────────────────────────
   Type Guards & Utilities
────────────────────────────────────────────────────────── */

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function jitter(baseMs: number): number {
  return Math.floor(baseMs * (0.6 + Math.random() * 0.8));
}

export function uniq<T>(arr: Array<T | null | undefined>): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)));
}

/* ─────────────────────────────────────────────────────────
   Resiliency & Infrastructure
────────────────────────────────────────────────────────── */

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

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      options?.onError?.(err, attempt);
      if (attempt === attempts) throw err;
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await sleep(jitter(delay));
    }
  }
  throw new Error('Retry exhausted');
}

export function requireBottleneck(ctx: WorkerContext): { submit<T>(fn: () => Promise<T>): Promise<T> } {
  const b = (ctx as { llmBottleneck?: unknown }).llmBottleneck;
  if (!b || typeof (b as { submit?: unknown }).submit !== 'function') {
    throw new Error('[mission] llmBottleneck missing from WorkerContext. Ensure bootstrap injects it.');
  }
  return b as { submit<T>(fn: () => Promise<T>): Promise<T> };
}

/* ─────────────────────────────────────────────────────────
   NIVL Live Fetching
────────────────────────────────────────────────────────── */

export interface NivlQueryOptions {
  limitPerQuery?: number;
  mediaTypes?: ('image' | 'video')[];
  randomizePage?: boolean;
}

export async function tryNivlQueries(
  seeds: string[],
  options: NivlQueryOptions,
): Promise<Img[]> {
  const queries = uniq(seeds).slice(0, 5);
  if (queries.length === 0) return [];

  const mediaMap = new Map<string, Img>();
  const page = options.randomizePage ? Math.floor(1 + Math.random() * 9) : 1;

  const searchPromises = queries.map((q) =>
    searchNIVLFull({
      q,
      page,
      page_size: options.limitPerQuery ?? 5,
      media_type: options.mediaTypes ?? ['image', 'video'],
    }),
  );

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('NIVL query aggregation timed out')), 15_000),
  );

  try {
    const settledResults = (await Promise.race([
      Promise.allSettled(searchPromises),
      timeout,
    ])) as PromiseSettledResult<NivlSearchResult>[];

    for (const res of settledResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value.items)) {
        for (const item of res.value.items) {
          const card = toCard(item);
          if (card.previewHref && !mediaMap.has(card.previewHref)) {
            mediaMap.set(card.previewHref, {
              href: card.previewHref,
              title: card.title,
              nasaId: card.nasaId,
              mediaType: card.mediaType === 'video' ? 'video' : 'image',
            });
          }
        }
      } else if (res.status === 'rejected') {
        logger.warn('[mission][nasa] A NIVL query failed:', res.reason);
      }
    }
  } catch (e) {
    logger.error('[mission] Live NIVL fetch operation failed entirely.', e);
  }

  return Array.from(mediaMap.values());
}

/* ─────────────────────────────────────────────────────────
   Sanitizers, Builders, and LLM Helpers
────────────────────────────────────────────────────────── */

export function ensureImageList(images: unknown): Img[] {
  if (!Array.isArray(images)) return [];
  return images.reduce<Img[]>((acc, i) => {
    if (isRecord(i) && typeof i.href === 'string' && i.href.trim()) {
      acc.push({
        href: i.href.trim(),
        ...(typeof i.title === 'string' && { title: i.title.slice(0, 200) }),
        ...(typeof i.nasaId === 'string' && { nasaId: i.nasaId }),
        ...(i.mediaType === 'video' && { mediaType: 'video' }),
      });
    }
    return acc;
  }, []);
}

export function ensureTopic(
  t: Partial<{ title: string; summary: string; keywords: string[]; images: unknown }>,
): EnrichedTopic {
  return {
    title: (typeof t.title === 'string' ? t.title : 'Topic').slice(0, 160),
    summary: (typeof t.summary === 'string' ? t.summary : '').slice(0, 400),
    images: ensureImageList(t.images),
    keywords: Array.isArray(t.keywords) ? uniq(t.keywords) : [],
  };
}

export function ensureMissionPlan(
  p: Partial<{ missionTitle: string; introduction: string; topics?: Array<Partial<EnrichedTopic> | undefined> }>,
): EnrichedMissionPlan {
  const title = (typeof p.missionTitle === 'string' ? p.missionTitle : 'Mission Plan').slice(0, 200);
  const intro = (typeof p.introduction === 'string' ? p.introduction : 'Welcome.').slice(0, 600);
  const topics: EnrichedTopic[] = (Array.isArray(p.topics) ? p.topics : [])
    .filter((t): t is Partial<EnrichedTopic> => Boolean(t))
    .map((t) => ensureTopic(t));

  if (topics.length === 0 && !p.missionTitle) {
    throw new Error('Mission generation resulted in no topics and no title.');
  }
  return { missionTitle: title, introduction: intro, topics };
}

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
    if (ch === '[') {
      depth += 1;
    } else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        try {
          const slice = cleaned.slice(start, i + 1);
          const parsed = JSON.parse(slice);
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export type { Role, MissionType };