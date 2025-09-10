// src/lib/queue.ts
import { Queue } from 'bullmq';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { resolveRedisUrl, getLlmQueueName } from '@/lib/secrets';
import * as net from 'net';
import * as tls from 'tls';

// ────────────────────────────────────────────────────────────────────────────────
// Module State
// ────────────────────────────────────────────────────────────────────────────────
let connection: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;
let queue: Queue | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// ────────────────────────────────────────────────────────────────────────────────
// Types & Type Guards
// ────────────────────────────────────────────────────────────────────────────────
type ErrnoLike = {
  code?: string;
  message?: string;
  stack?: string;
};

function isErrnoLike(e: unknown): e is ErrnoLike {
  return !!e && (typeof e === 'object') && ('message' in (e as Record<string, unknown>) || 'code' in (e as Record<string, unknown>));
}

// ────────────────────────────────────────────────────────────────────────────────
// Env helpers
// ────────────────────────────────────────────────────────────────────────────────
function asIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolEnv(name: string, truthy = '1'): boolean {
  return process.env[name] === truthy;
}

function asRegexEnv(name: string): RegExp | null {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    return new RegExp(raw);
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Error formatting (lint-safe, no `any`)
// ────────────────────────────────────────────────────────────────────────────────
function formatErrorBrief(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isErrnoLike(err)) return `${err.code ?? 'ERR'}: ${err.message ?? '(no message)'}`;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
/** Decide if TLS should be used, without hardcoding hostnames. */
function shouldUseTLS(u: URL): boolean {
  if (asBoolEnv('REDIS_FORCE_TLS')) return true;
  if (u.protocol === 'rediss:') return true;
  const re = asRegexEnv('REDIS_TLS_HOST_REGEX');
  return !!(re && re.test(u.hostname));
}

/** Optional: auto-upgrade redis:// → rediss:// when policy says so. */
function normalizeRedisUrl(input: string): string {
  if (process.env.REDIS_AUTO_UPGRADE_SCHEME === '1') {
    const u = new URL(input);
    if (u.protocol === 'redis:' && shouldUseTLS(u)) {
      u.protocol = 'rediss:';
      return u.toString();
    }
  }
  return input;
}

/** Production safety checks: enforce TLS+auth and hostname for SNI. */
function assertSecureInProd(url: string): void {
  const u = new URL(url);
  const isProd = process.env.NODE_ENV === 'production';
  const useTLS = shouldUseTLS(u);

  if (isProd && !useTLS) {
    throw new Error(`❌ In production, this endpoint must use TLS (host=${u.hostname}).`);
  }
  if (useTLS) {
    const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname);
    const isIPv6 = /^[A-F0-9:]+$/i.test(u.hostname);
    if (isIPv4 || isIPv6) {
      throw new Error('❌ TLS Redis must use a hostname (for SNI), not an IP.');
    }
    if (!u.password) {
      throw new Error(`❌ Missing password in Redis URL for ${u.hostname}. TLS endpoints require auth.`);
    }
  }

  const allow = asRegexEnv('REDIS_ALLOWED_HOST_REGEX');
  if (isProd && allow && !allow.test(u.hostname)) {
    throw new Error(`❌ Host not allowed in production: ${u.hostname}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// ioredis Options (with jittered backoff & auto-pipelining)
// ────────────────────────────────────────────────────────────────────────────────
function expBackoffWithJitter(times: number, capMs: number): number {
  const base = Math.min(1000 * 2 ** times, capMs);
  // Full jitter to smooth thundering herds.
  return Math.floor(Math.random() * base);
}

function buildRedisOptions(url: string): RedisOptions {
  const u = new URL(url);
  const useTLS = shouldUseTLS(u);

  const retryCapMs     = asIntEnv('REDIS_RETRY_CAP_MS',       15_000);
  const connectTimeout = asIntEnv('REDIS_CONNECT_TIMEOUT_MS', 10_000);
  const keepAliveMs    = asIntEnv('REDIS_KEEPALIVE_MS',       30_000);
  const family: 4 | 6  = process.env.REDIS_FAMILY === '6' ? 6 : 4;
  const insecureTLS    = asBoolEnv('REDIS_TLS_INSECURE');
  const commandTimeout = asIntEnv('REDIS_COMMAND_TIMEOUT_MS', 0); // 0 = disabled
  const autoPipe       = asBoolEnv('REDIS_ENABLE_AUTO_PIPELINING'); // optional perf

  const base: RedisOptions = {
    // BullMQ recommendations
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,

    // Networking hygiene
    family,
    connectTimeout,
    keepAlive: keepAliveMs,
    noDelay: true,
    retryStrategy: (times) => expBackoffWithJitter(times, retryCapMs),

    // Robustness on transient drops
    autoResendUnfulfilledCommands: true,
    autoResubscribe: true,
    enableOfflineQueue: true,

    // Optional perf: merge commands in-flight to reduce RTT (safe for most cases)
    ...(autoPipe ? { enableAutoPipelining: true } : {}),

    // Optional per-command timeout
    ...(commandTimeout > 0 ? { commandTimeout } : {}),
  };

  if (useTLS) {
    base.tls = {
      servername: u.hostname,
      rejectUnauthorized: !insecureTLS, // use container/system trust (LE/Upstash are public CA)
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
    };
  }
  return base;
}

// ────────────────────────────────────────────────────────────────────────────────
// TLS probe (proves TLS & logs protocol/CN/SAN, but never throws)
// ────────────────────────────────────────────────────────────────────────────────
async function probeTls(host: string, port: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const sock = net.connect({ host, port, timeout: 8000 }, () => {
      const t = tls.connect(
        {
          socket: sock,
          servername: host,
          minVersion: 'TLSv1.2',
          maxVersion: 'TLSv1.3',
          rejectUnauthorized: true,
        },
        () => {
          const proto = t.getProtocol() ?? 'TLS';
          const cert = t.getPeerCertificate();
          const cn = (cert && typeof cert === 'object' && 'subject' in cert && (cert as tls.PeerCertificate).subject?.CN) || '?';
          const san = (cert && typeof cert === 'object' && 'subjectaltname' in cert && (cert as tls.PeerCertificate).subjectaltname) || '?';
          console.log(`[redis][tls] OK ${proto} CN=${cn} SAN=${san}`);
          t.end();
          resolve();
        }
      );
      t.on('error', (e: unknown) => {
        const code = isErrnoLike(e) && e.code ? e.code : 'TLS_ERROR';
        console.error('[redis][tls] FAIL', code, formatErrorBrief(e));
        try { t.destroy(); } catch { /* ignore */ }
        resolve();
      });
    });

    sock.on('error', (e: unknown) => {
      const code = isErrnoLike(e) && e.code ? e.code : 'TCP_ERROR';
      console.error('[redis][tcp] FAIL', code, formatErrorBrief(e));
      resolve();
    });

    sock.on('timeout', () => {
      console.error('[redis][tcp] TIMEOUT');
      try { sock.destroy(); } catch { /* ignore */ }
      resolve();
    });
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Optional heartbeat (keeps long-lived connections warm across edges/NATs)
// ────────────────────────────────────────────────────────────────────────────────
function startHeartbeat(client: Redis): void {
  // Default 20s is a good balance; some providers drop idle at ~30s.
  const interval = asIntEnv('REDIS_HEARTBEAT_MS', 20_000);
  if (interval <= 0) return;

  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    void client.ping().catch(() => {
      // ioredis will reconnect via retryStrategy; keep logs quiet here
    });
  }, interval);

  // Don't keep the process alive solely for heartbeat (Node only)
  const maybeNodeTimer = heartbeatTimer as unknown as { unref?: () => void };
  if (typeof maybeNodeTimer.unref === 'function') maybeNodeTimer.unref();
}

function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
export async function getConnection(): Promise<Redis> {
  if (connection) return connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    const raw = await resolveRedisUrl();
    if (!raw) throw new Error('❌ No Redis URL resolved. Set REDIS_URL_ONLINE or REDIS_URL_LOCAL.');

    const url = normalizeRedisUrl(raw);
    assertSecureInProd(url);

    const u = new URL(url);
    const useTLS = shouldUseTLS(u);
    const host = u.hostname;
    const port = Number(u.port) || 6379;

    console.log('[redis] target', {
      scheme: u.protocol, host, port, useTLS,
      allowPlain: asBoolEnv('REDIS_ALLOW_PLAINTEXT'),
      tlsHostRegex: process.env.REDIS_TLS_HOST_REGEX ?? '',
      autoPipelining: asBoolEnv('REDIS_ENABLE_AUTO_PIPELINING'),
    });

    if (useTLS) {
      // Non-fatal probe: logs protocol + CN/SAN or the failure code
      await probeTls(host, port);
    }

    const client = new IORedis(url, buildRedisOptions(url));

    client.on('connect', () =>  console.log(`[redis] connect -> ${host}:${port} (tls=${useTLS})`));
    client.on('ready',   () =>  console.log('[redis] ready'));
    client.on('reconnecting', (ms: number) => console.warn(`[redis] reconnecting in ${ms}ms`));
    client.on('end',     () =>  console.warn('[redis] connection ended'));
    client.on('close',   () =>  console.warn('[redis] close'));
    client.on('error',   (err: unknown) => {
      const msg = formatErrorBrief(err);
      // Common transient errors during rollouts/flaps—downgrade to warn
      if (/EPIPE|ECONNRESET|ETIMEDOUT/i.test(msg)) {
        console.warn('[redis] transient error:', msg);
      } else {
        console.error('[redis] error:', msg);
      }
    });

    await client.connect(); // honors connectTimeout
    // Fail fast at boot so Cloud Run fails early instead of hanging
    await client.ping();

    startHeartbeat(client);

    connection = client;
    return client;
  })();

  return connectionPromise;
}

export function getQueueName(): string {
  return getLlmQueueName();
}

export async function getQueue(): Promise<Queue> {
  if (queue) return queue;
  const conn = await getConnection();
  queue = new Queue(getQueueName(), { connection: conn });
  return queue;
}

export async function closeQueue(): Promise<void> {
  stopHeartbeat();
  if (queue) {
    try { await queue.close(); } catch { /* ignore */ }
    queue = null;
  }
  if (connection) {
    try { await connection.quit(); } catch { /* ignore */ }
    connection = null;
  }
  connectionPromise = null;
}

/** Install once in your worker bootstrap to shut down cleanly. */
export function installWorkerSignalHandlers(): void {
  const handler = () => {
    console.warn('[worker] SIGTERM/SIGINT received, shutting down gracefully…');
    void (async () => {
      try {
        await closeQueue();
      } catch (err) {
        console.error('[worker] Error during graceful shutdown:', formatErrorBrief(err));
      } finally {
        process.exit(0);
      }
    })();
  };
  process.once('SIGTERM', handler);
  process.once('SIGINT', handler);
}
