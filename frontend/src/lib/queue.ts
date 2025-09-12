import { Queue } from 'bullmq';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { resolveRedisUrl } from '@/lib/secrets';
import * as fs from 'fs';
import { promises as dnsPromises, lookup as dnsLookupNative } from 'dns';

/* ─────────────────────────────────────────────────────────
   Configuration
────────────────────────────────────────────────────────── */
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
  try { return new RegExp(raw); } catch { return null; }
}

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dns: {
    ttlCapMs: asIntEnv('REDIS_DNS_TTL_CAP_MS', 30_000),
    negTtlMs: asIntEnv('REDIS_DNS_NEG_TTL_MS', 5_000),
    cacheMax: asIntEnv('REDIS_DNS_CACHE_MAX', 128),
    preferFamily: (process.env.REDIS_FAMILY === '6' ? 6 : 4) as 4 | 6,
  },
  redis: {
    retryCapMs: asIntEnv('REDIS_RETRY_CAP_MS', 60_000),
    connectTimeout: asIntEnv('REDIS_CONNECT_TIMEOUT_MS', 20_000),
    keepAliveMs: asIntEnv('REDIS_KEEPALIVE_MS', 30_000),
    commandTimeout: asIntEnv('REDIS_COMMAND_TIMEOUT_MS', 0),
    enableAutoPipelining: asBoolEnv('REDIS_ENABLE_AUTO_PIPELINING'),
    connectionName: process.env.REDIS_CONNECTION_NAME ?? 'llm-queue',
    caCertPath: process.env.REDIS_CA_CERT_PATH,
    heartbeatMs: asIntEnv('REDIS_HEARTBEAT_MS', 15_000),
  },
  bootRetries: {
    attempts: asIntEnv('REDIS_BOOT_RETRY_ATTEMPTS', 10),
    baseMs: asIntEnv('REDIS_BOOT_RETRY_BASE_MS', 1000),
    maxMs: asIntEnv('REDIS_BOOT_RETRY_MAX_MS', 8000),
  },
  tls: {
    force: asBoolEnv('REDIS_FORCE_TLS'),
    insecure: asBoolEnv('REDIS_TLS_INSECURE'),
    hostRegex: asRegexEnv('REDIS_TLS_HOST_REGEX'),
    autoUpgradeScheme: process.env.REDIS_AUTO_UPGRADE_SCHEME === '1',
    allowedHostRegex: asRegexEnv('REDIS_ALLOWED_HOST_REGEX'),
  },
};

/* ─────────────────────────────────────────────────────────
   Module State
────────────────────────────────────────────────────────── */
let connection: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;
const queueCache = new Map<string, Queue>();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isShuttingDown = false;

/* ─────────────────────────────────────────────────────────
   Types & Utils
────────────────────────────────────────────────────────── */
type ErrnoLike = { code?: string; message?: string; stack?: string };
function isErrnoLike(e: unknown): e is ErrnoLike {
  return !!e && typeof e === 'object' && ('message' in (e as Record<string, unknown>) || 'code' in (e as Record<string, unknown>));
}
function formatErrorBrief(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isErrnoLike(err)) return `${err.code ?? 'ERR'}: ${err.message ?? '(no message)'}`;
  try { return JSON.stringify(err); } catch { return String(err); }
}

/* ─────────────────────────────────────────────────────────
   TLS, DNS, Redis Options, Backoff, Heartbeat (All Restored)
────────────────────────────────────────────────────────── */
const MANAGED_TLS_HOST_REGEX_DEFAULT = /(?:^|\.)(upstash\.io)$/i;
function shouldUseTLS(u: URL): boolean {
  if (config.tls.force) return true;
  if (u.protocol === 'rediss:') return true;
  const managedDefault = MANAGED_TLS_HOST_REGEX_DEFAULT.test(u.hostname);
  const policy = config.tls.hostRegex;
  return managedDefault || !!(policy && policy.test(u.hostname));
}
function normalizeRedisUrl(input: string): string {
  if (config.tls.autoUpgradeScheme) {
    const u = new URL(input);
    if (u.protocol === 'redis:' && shouldUseTLS(u)) { u.protocol = 'rediss:'; return u.toString(); }
  }
  return input;
}
function assertSecureInProd(url: string): void {
  const u = new URL(url);
  const isProd = config.nodeEnv === 'production';
  const useTLS = shouldUseTLS(u);

  if (isProd && !useTLS) throw new Error(`❌ In production, this endpoint must use TLS (host=${u.hostname}).`);
  if (useTLS) {
    const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname);
    const isIPv6 = /^[A-F0-9:]+$/i.test(u.hostname);
    if (isIPv4 || isIPv6) throw new Error('❌ TLS Redis must use a hostname (for SNI), not a raw IP.');
    if (!u.password) throw new Error(`❌ Missing password in Redis URL for ${u.hostname}. TLS endpoints require auth.`);
  }
  const allow = config.tls.allowedHostRegex;
  if (isProd && allow && !allow.test(u.hostname)) throw new Error(`❌ Host not allowed in production: ${u.hostname}`);
}

type CacheKey = `${string}|${4 | 6}`;
type CachedAddr = { address: string; family: 4 | 6; expiresAt: number };
interface ResolveWithTtl { address: string; ttl: number }

const dnsCache = new Map<CacheKey, CachedAddr>();
const now = () => Date.now();

function dnsCacheSet(key: CacheKey, entry: CachedAddr): void {
  if (dnsCache.size >= config.dns.cacheMax) {
    const first = dnsCache.keys().next().value as CacheKey | undefined;
    if (first) dnsCache.delete(first);
  }
  dnsCache.set(key, entry);
}

function evictDnsCacheFor(hostname: string, family: 4 | 6): void {
  dnsCache.delete(`${hostname}|${family}` as CacheKey);
}

async function resolveWithTtl(hostname: string, family: 4 | 6): Promise<CachedAddr> {
  const key: CacheKey = `${hostname}|${family}`;
  const cached = dnsCache.get(key);
  if (cached && cached.expiresAt > now()) return cached;

  try {
    const resolver = family === 4 ? dnsPromises.resolve4 : dnsPromises.resolve6;
    const answers = (await resolver(hostname, { ttl: true })) as unknown as ResolveWithTtl[];
    if (answers.length > 0) {
      const a = answers[0];
      const ttlMs = Math.min((a.ttl ? a.ttl * 1000 : config.dns.ttlCapMs), config.dns.ttlCapMs);
      const entry: CachedAddr = { address: a.address, family, expiresAt: now() + ttlMs };
      dnsCacheSet(key, entry);
      return entry;
    }
    throw new Error('NO_DNS_RESULTS');
  } catch (e) {
    return new Promise<CachedAddr>((resolve, reject) => {
      dnsLookupNative(hostname, { family, all: false }, (err, address, fam) => {
        if (err || !address) {
          const neg: CachedAddr = { address: '', family, expiresAt: now() + config.dns.negTtlMs };
          dnsCacheSet(key, neg);
          reject(e instanceof Error ? e : new Error(String(e)));
          return;
        }
        const entry: CachedAddr = { address, family: fam === 6 ? 6 : 4, expiresAt: now() + config.dns.ttlCapMs };
        dnsCacheSet(key, entry);
        resolve(entry);
      });
    });
  }
}

function expBackoffWithJitter(times: number, capMs: number): number {
  const base = Math.min(1500 * 2 ** times, capMs);
  return Math.floor(Math.random() * base);
}

function buildRedisOptions(url: string, overrideHost?: string): RedisOptions {
  const u = new URL(url);
  const useTLS = shouldUseTLS(u);

  const base: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    host: overrideHost || undefined,
    family: config.dns.preferFamily,
    connectTimeout: config.redis.connectTimeout,
    keepAlive: config.redis.keepAliveMs,
    noDelay: true,
    retryStrategy: (times) => {
      const delay = expBackoffWithJitter(times, config.redis.retryCapMs);
      console.log(`[redis] Connection lost. Attempting reconnect #${times + 1} in ${delay}ms...`);
      return delay;
    },
    autoResendUnfulfilledCommands: true,
    autoResubscribe: true,
    enableOfflineQueue: true,
    ...(config.redis.enableAutoPipelining ? { enableAutoPipelining: true } : {}),
    ...(config.redis.commandTimeout > 0 ? { commandTimeout: config.redis.commandTimeout } : {}),
    connectionName: config.redis.connectionName,
  };

  if (useTLS) {
    base.tls = {
      servername: u.hostname,
      rejectUnauthorized: !config.tls.insecure,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ...(config.redis.caCertPath ? { ca: fs.readFileSync(config.redis.caCertPath) } : {}),
    };
  }
  return base;
}

function isRedisLoadingError(e: unknown): boolean {
  return String(e).toUpperCase().includes('LOADING REDIS IS LOADING');
}
function isHardNetworkRefusal(e: unknown): boolean {
  return /ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|TIMEDOUT|TIMEOUT/.test(String(e).toUpperCase());
}
async function untilOk<T>(fn: () => Promise<T>): Promise<T> {
  const { attempts, baseMs, maxMs } = config.bootRetries;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === attempts - 1 || (!isRedisLoadingError(e) && !isHardNetworkRefusal(e))) throw e;
      const backoff = Math.min(baseMs * 2 ** i, maxMs);
      const jitter = Math.round(backoff * (0.6 + Math.random() * 0.8));
      console.warn(`[redis][boot] Attempt ${i + 1}/${attempts} failed. Retrying in ${jitter}ms...`, formatErrorBrief(e));
      await new Promise((r) => setTimeout(r, jitter));
    }
  }
  throw new Error('Unreachable: exceeded boot retries.');
}

function startHeartbeat(client: Redis): void {
  if (config.redis.heartbeatMs <= 0) return;
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    client.ping().catch(() => { /* ioredis will handle the reconnect */ });
  }, config.redis.heartbeatMs);
  (heartbeatTimer as unknown as { unref?: () => void }).unref?.();
}
function stopHeartbeat(): void {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

/* ─────────────────────────────────────────────────────────
   Public API
────────────────────────────────────────────────────────── */
export async function getConnection(): Promise<Redis> {
  if (isShuttingDown) throw new Error('Shutdown in progress, not accepting new connections.');
  if (connection) return connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async (): Promise<Redis> => {
    try {
      const raw = await resolveRedisUrl();
      if (!raw) throw new Error('❌ No Redis URL resolved. Set REDIS_URL_ONLINE or REDIS_URL_LOCAL.');
      const url = normalizeRedisUrl(raw);
      assertSecureInProd(url);
      const u = new URL(url);
      const host = u.hostname;
      const port = Number(u.port) || 6379;

      let resolvedHost = host;
      try {
        const addr = await resolveWithTtl(host, config.dns.preferFamily);
        if (addr.address) resolvedHost = addr.address;
      } catch (e) {
        console.warn('[redis][dns] resolution failed (will use native resolver):', formatErrorBrief(e));
      }

      const client = new IORedis(url, buildRedisOptions(url, resolvedHost));

      client.on('connect', () => console.log(`[redis] connected: ${host}:${port}`));
      client.on('ready', () => console.log('[redis] ready'));
      client.on('reconnecting', (ms: number) => console.warn(`[redis] reconnecting in ${ms}ms`));
      client.on('error', (er: unknown) => {
        const upperMsg = String(er).toUpperCase();
        if (/ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|EAI_AGAIN/.test(upperMsg)) {
          console.warn(`[redis] Network error detected. Evicting DNS cache for ${host}.`);
          evictDnsCacheFor(host, config.dns.preferFamily);
        }
        console.error('[redis] error:', formatErrorBrief(er));
      });

      await untilOk(() => client.ping());

      startHeartbeat(client);
      connection = client;
      return client;
    } catch (error) {
      console.error('[redis] ❌ FATAL: Failed to establish initial connection after all retries.', formatErrorBrief(error));
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

export const INTERACTIVE_QUEUE_NAME = process.env.INTERACTIVE_QUEUE_NAME || 'llm-interactive-queue';
export const BACKGROUND_QUEUE_NAME = process.env.BACKGROUND_QUEUE_NAME || 'llm-background-queue';

export async function getQueue(queueName: string): Promise<Queue> {
  if (queueName !== INTERACTIVE_QUEUE_NAME && queueName !== BACKGROUND_QUEUE_NAME) {
    throw new Error(`Requested unknown queue name: "${queueName}"`);
  }
  const cachedQueue = queueCache.get(queueName);
  if (cachedQueue) return cachedQueue;

  const conn = await getConnection();
  const newQueue = new Queue(queueName, { connection: conn });
  queueCache.set(queueName, newQueue);
  console.log(`[redis] BullMQ queue "${queueName}" initialized.`);
  return newQueue;
}

export async function closeQueue(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('[redis] Starting graceful shutdown...');
  stopHeartbeat();

  const queuesToClose = Array.from(queueCache.values());
  if (queuesToClose.length > 0) {
    try {
      await Promise.all(queuesToClose.map(q => q.close()));
      console.log(`[redis] BullMQ queues (${queuesToClose.length}) closed.`);
    } catch (e) {
      console.error('[redis] Error closing one or more queues:', formatErrorBrief(e));
    } finally {
      queueCache.clear();
    }
  }

  if (connection) {
    try { await connection.quit(); console.log('[redis] Redis connection closed.'); }
    catch (e) { console.error('[redis] Error quitting Redis:', formatErrorBrief(e)); }
    finally { connection = null; }
  }
  connectionPromise = null;
  console.log('[redis] Graceful shutdown complete.');
}

export function installWorkerSignalHandlers(): void {
  const handler = (signal: string): void => {
    if (isShuttingDown) return;
    console.warn(`[worker] ${signal} received, shutting down gracefully…`);
    
    const forceExitTimeout = setTimeout(() => {
      console.error('[worker] Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10_000);

    closeQueue()
      .catch((err) => {
        console.error('[worker] Error during graceful shutdown:', formatErrorBrief(err));
        process.exitCode = 1;
      })   
      .finally(() => {
        clearTimeout(forceExitTimeout);
        process.exit(process.exitCode ?? 0);
      });
  };

  process.once('SIGTERM', () => handler('SIGTERM'));
  process.once('SIGINT', () => handler('SIGINT'));
}