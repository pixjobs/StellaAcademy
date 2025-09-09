// src/lib/queue.ts
import { Queue } from 'bullmq';
import IORedis, { Redis } from 'ioredis';
import { resolveRedisUrl, getLlmQueueName } from '@/lib/secrets';

let connection: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;
let queue: Queue | null = null;

/**
 * Return (or create) a shared ioredis connection.
 * - ONLINE-first via resolveRedisUrl()
 * - TLS SNI + IPv4 forced (helps Upstash)
 * - Exponential backoff on reconnects
 * - Singleton promise prevents race-creating multiple clients
 */
export async function getConnection(): Promise<Redis> {
  if (connection) return connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const url = await resolveRedisUrl();
    if (!url) {
      throw new Error('❌ No Redis URL resolved. Set REDIS_URL_ONLINE or REDIS_URL_LOCAL.');
    }

    const u = new URL(url);

    const client = new IORedis(url, {
      maxRetriesPerRequest: null,   // recommended for BullMQ
      enableReadyCheck: false,      // skip INFO on connect (faster, less noisy)
      tls: { servername: u.hostname }, // ensure proper SNI during TLS
      family: 4,                    // prefer IPv4 to avoid odd IPv6 routes
      retryStrategy: (times) => Math.min(1000 * 2 ** times, 15000), // 1s → 15s
    });

    client.on('error', (err) => {
      console.error('[redis] error:', err?.message || err);
    });
    client.on('end', () => {
      console.warn('[redis] connection ended');
    });

    // Optional: fail fast at boot; retryStrategy will handle later hiccups
    await client.ping();

    connection = client;
    return client;
  })();

  return connectionPromise;
}

/** Return the queue name from env (default: "llm-queue"). */
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

/** Gracefully close connection and queue (useful for tests / shutdown). */
export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (connection) {
    try { await connection.quit(); } catch {}
    connection = null;
  }
  connectionPromise = null;
}
