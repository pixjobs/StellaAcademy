// src/lib/queue.ts
import { Queue } from 'bullmq';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { resolveRedisUrl, getLlmQueueName } from '@/lib/secrets';

// ────────────────────────────────────────────────────────────────────────────────
// Module state (typed)
// ────────────────────────────────────────────────────────────────────────────────
let connection: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;
let queue: Queue | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// ────────────────────────────────────────────────────────────────────────────────
// Utilities: typed env parsing & error rendering
// ────────────────────────────────────────────────────────────────────────────────
function asIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolEnv(name: string, truthyValue = '1'): boolean {
  return process.env[name] === truthyValue;
}

function logErrorMessage(err: unknown): string {
  if (err instanceof Error && typeof err.message === 'string') return err.message;
  try { return JSON.stringify(err); } catch { /* no-op */ }
  return String(err);
}

// ────────────────────────────────────────────────────────────────────────────────
/** Force secure scheme unless explicitly allowed to use plaintext. */
function normalizeRedisUrl(input: string): string {
  const allowPlain = asBoolEnv('REDIS_ALLOW_PLAINTEXT');
  if (allowPlain) return input;

  const u = new URL(input);
  if (u.protocol === 'redis:') {
    u.protocol = 'rediss:';
    return u.toString();
  }
  return input;
}

// ────────────────────────────────────────────────────────────────────────────────
/** Build ioredis options robust for cloud edges (Upstash) and LE Redis. */
function buildRedisOptions(url: string): RedisOptions {
  const u = new URL(url);
  const isTLS = u.protocol === 'rediss:';

  const retryCapMs      = asIntEnv('REDIS_RETRY_CAP_MS',        15_000);
  const connectTimeout  = asIntEnv('REDIS_CONNECT_TIMEOUT_MS',  10_000);
  const keepAliveMs     = asIntEnv('REDIS_KEEPALIVE_MS',        30_000);
  const family: 4 | 6   = process.env.REDIS_FAMILY === '6' ? 6 : 4;
  const insecureTLS     = asBoolEnv('REDIS_TLS_INSECURE');

  const base: RedisOptions = {
    // BullMQ recommendations
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,

    // Networking hygiene
    family,
    connectTimeout,
    retryStrategy: (times) => Math.min(1000 * 2 ** times, retryCapMs),
    keepAlive: keepAliveMs,
    noDelay: true,
  };

  if (isTLS) {
    base.tls = {
      servername: u.hostname,            // SNI (required for Upstash; correct for LE)
      rejectUnauthorized: !insecureTLS,  // system trust (LE/Upstash are public CA)
      // minVersion: 'TLSv1.2',          // uncomment to hard-pin the minimum
    };
  }

  return base;
}

// ────────────────────────────────────────────────────────────────────────────────
/** Optional heartbeat to keep strict NATs/edges from resetting idle sockets. */
function startHeartbeat(client: Redis): void {
  const interval = asIntEnv('REDIS_HEARTBEAT_MS', 25_000);
  if (interval <= 0) return;

  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    void client.ping().catch(() => {
      // ioredis will handle reconnects via retryStrategy
    });
  }, interval);

  unrefIfPossible(heartbeatTimer);
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/** In Node.js, Timer has .unref(); in browsers it’s a number — guard safely. */
function unrefIfPossible(timer: ReturnType<typeof setInterval>): void {
  const maybeNodeTimer = timer as unknown as { unref?: () => void };
  if (typeof maybeNodeTimer.unref === 'function') {
    maybeNodeTimer.unref();
  }
}

// ────────────────────────────────────────────────────────────────────────────────
/**
 * Return (or create) a shared ioredis connection.
 * - Resolves URL, auto-secures to rediss:// unless REDIS_ALLOW_PLAINTEXT=1
 * - Sets SNI, IPv4, keepalive, connect timeout, capped exponential backoff
 * - One-time PING at boot to fail fast
 */
export async function getConnection(): Promise<Redis> {
  if (connection) return connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const raw = await resolveRedisUrl(); // should be Promise<string>
    if (!raw) {
      throw new Error('❌ No Redis URL resolved. Set REDIS_URL_ONLINE or REDIS_URL_LOCAL.');
    }

    const url = normalizeRedisUrl(raw);
    const u = new URL(url);

    // For TLS endpoints (Upstash/LE): require a password in URL
    if (u.protocol === 'rediss:' && !u.password) {
      throw new Error(`❌ Missing password in Redis URL for ${u.hostname}. TLS endpoints require auth.`);
    }

    const client = new IORedis(url, buildRedisOptions(url));

    client.on('connect', () =>  console.log(`[redis] connect -> ${u.hostname}:${u.port || 6379}`));
    client.on('ready',   () =>  console.log('[redis] ready'));
    client.on('reconnecting', (ms: number) => console.warn(`[redis] reconnecting in ${ms}ms`));
    client.on('end',     () =>  console.warn('[redis] connection ended'));
    client.on('close',   () =>  console.warn('[redis] close'));
    client.on('error',   (err: unknown) => console.error('[redis] error:', logErrorMessage(err)));

    await client.connect(); // honors connectTimeout
    await client.ping();    // fail fast at boot
    startHeartbeat(client);

    connection = client;
    return client;
  })();

  return connectionPromise;
}

// ────────────────────────────────────────────────────────────────────────────────
/** Queue name from env (default provided by your secret helper). */
export function getQueueName(): string {
  return getLlmQueueName();
}

/** Return (or create) a shared BullMQ Queue instance. */
export async function getQueue(): Promise<Queue> {
  if (queue) return queue;
  const conn = await getConnection();
  queue = new Queue(getQueueName(), { connection: conn });
  return queue;
}

/** Graceful shutdown for tests / process exit. */
export async function closeQueue(): Promise<void> {
  stopHeartbeat();
  if (queue) {
    try { await queue.close(); } catch { /* swallow */ }
    queue = null;
  }
  if (connection) {
    try { await connection.quit(); } catch { /* swallow */ }
    connection = null;
  }
  connectionPromise = null;
}
