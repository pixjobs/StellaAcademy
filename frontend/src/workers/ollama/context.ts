/* eslint-disable no-console */
import type { Redis } from 'ioredis';
import { Firestore } from '@google-cloud/firestore';
import { getConnection } from '@/lib/queue';
import { getLlmBottleneck } from './llm-bottleneck';
import { getNasaApiKey } from '@/lib/secrets';
// Optional: only used if you want NASA to use Redis L2 cache
import { setRedisProvider } from '@/lib/nasa';

export interface WorkerContext {
  redis: Redis;
  db: Firestore;
  llmBottleneck: ReturnType<typeof getLlmBottleneck>;
  nasaKeyPresent: boolean;
  redisReady: boolean;
}

function mask(val?: string): string {
  if (!val) return '(unset)';
  return val.length <= 6 ? '******' : `${val.slice(0, 2)}***${val.slice(-2)}`;
}

export async function initializeContext(): Promise<WorkerContext> {
  // 1) Shared Redis (via /lib/queue) — never throw the app if ping fails.
  const redis = await getConnection();

  // Probe (non-fatal) to gate background maintenance & optional NASA L2 cache
  let redisReady = false;
  try {
    await redis.ping();
    redisReady = true;
  } catch (e) {
    console.error('[context] Redis ping failed during init:', (e as Error).message);
  }

  // Helpful logs if connection flaps later
  redis.on('error', (err) => console.error('[redis] error (context):', err?.message || err));
  redis.on('reconnecting', (ms: number) =>
    console.warn(`[redis] reconnecting in ${ms}ms (context)`),
  );

  // 2) Firestore (uses GOOGLE_CLOUD_PROJECT creds/ADC)
  const db = new Firestore();

  // 3) LLM bottleneck singleton (required)
  const llmBottleneck = getLlmBottleneck();
  if (!llmBottleneck || typeof llmBottleneck.submit !== 'function') {
    throw new Error('[context] llmBottleneck missing submit()');
  }

  // 4) Resolve NASA key via lib/secrets (authoritative)
  const nasaKey = await getNasaApiKey();
  const nasaKeyPresent = typeof nasaKey === 'string' && nasaKey.trim().length > 0;

  // Backfill env var for any legacy paths still reading process.env
  if (nasaKeyPresent && !process.env.NASA_API_KEY) {
    process.env.NASA_API_KEY = nasaKey;
  }

  // 5) (Optional, safe) enable NASA L2 cache only if explicitly requested & Redis is healthy
  // Set NASA_USE_REDIS_CACHE=1 if you want this. It’s best-effort and won’t affect correctness.
  const useNasaRedis = (process.env.NASA_USE_REDIS_CACHE || '').trim().toLowerCase() === '1';
  if (useNasaRedis && redisReady) {
    setRedisProvider(() => redis);
    console.log('[context] NASA Redis L2 cache: ENABLED');
  } else if (useNasaRedis) {
    console.warn('[context] NASA Redis L2 cache requested but Redis not ready; leaving DISABLED.');
  } else {
    console.log('[context] NASA Redis L2 cache: DISABLED (default for maximum reliability)');
  }

  console.log(
    '[context] Created. redisReady=%s, nasaKeyPresent=%s (NASA_API_KEY=%s), bottleneck.submit=%s',
    String(redisReady),
    String(nasaKeyPresent),
    mask(process.env.NASA_API_KEY),
    typeof llmBottleneck.submit,
  );

  return { redis, db, llmBottleneck, nasaKeyPresent, redisReady };
}
