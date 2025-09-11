// src/lib/queue.ts
import { Queue } from 'bullmq';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import { resolveRedisUrl, getLlmQueueName } from '@/lib/secrets';
import * as net from 'net';
import * as tls from 'tls';
import * as fs from 'fs';
import { promises as dnsPromises, lookup as dnsLookupNative } from 'dns';

// ────────────────────────────────────────────────────────────────────────────────
// Module State
// ────────────────────────────────────────────────────────────────────────────────
let connection: Redis | null = null;
let connectionPromise: Promise<Redis> | null = null;
let queue: Queue | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// ────────────────────────────────────────────────────────────────────────────────
// Types & utils
// ────────────────────────────────────────────────────────────────────────────────
type ErrnoLike = { code?: string; message?: string; stack?: string };
function isErrnoLike(e: unknown): e is ErrnoLike {
  return !!e && typeof e === 'object' && ('message' in (e as Record<string, unknown>) || 'code' in (e as Record<string, unknown>));
}
function formatErrorBrief(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isErrnoLike(err)) return `${err.code ?? 'ERR'}: ${err.message ?? '(no message)'}`;
  try { return JSON.stringify(err); } catch { return String(err); }
}
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

// ────────────────────────────────────────────────────────────────────────────────
// TLS policy helpers
// ────────────────────────────────────────────────────────────────────────────────
const MANAGED_TLS_HOST_REGEX_DEFAULT = /(?:^|\.)(upstash\.io)$/i;
function shouldUseTLS(u: URL): boolean {
  if (asBoolEnv('REDIS_FORCE_TLS')) return true;
  if (u.protocol === 'rediss:') return true;
  const managedDefault = MANAGED_TLS_HOST_REGEX_DEFAULT.test(u.hostname);
  const policy = asRegexEnv('REDIS_TLS_HOST_REGEX');
  return managedDefault || !!(policy && policy.test(u.hostname));
}
function normalizeRedisUrl(input: string): string {
  if (process.env.REDIS_AUTO_UPGRADE_SCHEME === '1') {
    const u = new URL(input);
    if (u.protocol === 'redis:' && shouldUseTLS(u)) { u.protocol = 'rediss:'; return u.toString(); }
  }
  return input;
}
function assertSecureInProd(url: string): void {
  const u = new URL(url);
  const isProd = process.env.NODE_ENV === 'production';
  const useTLS = shouldUseTLS(u);

  if (isProd && !useTLS) throw new Error(`❌ In production, this endpoint must use TLS (host=${u.hostname}).`);
  if (useTLS) {
    const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname);
    const isIPv6 = /^[A-F0-9:]+$/i.test(u.hostname);
    if (isIPv4 || isIPv6) throw new Error('❌ TLS Redis must use a hostname (for SNI), not a raw IP.');
    if (!u.password) throw new Error(`❌ Missing password in Redis URL for ${u.hostname}. TLS endpoints require auth.`);
  }
  const allow = asRegexEnv('REDIS_ALLOWED_HOST_REGEX');
  if (isProd && allow && !allow.test(u.hostname)) throw new Error(`❌ Host not allowed in production: ${u.hostname}`);
}

// ────────────────────────────────────────────────────────────────────────────────
// DNS cache (TTL-aware). IPv4 preferred.
// ────────────────────────────────────────────────────────────────────────────────
type CacheKey = `${string}|${4|6}`;
type CachedAddr = { address: string; family: 4|6; expiresAt: number };
type ResolveWithTtl4 = { address: string; ttl: number };
type ResolveWithTtl6 = { address: string; ttl: number };

const dnsCache = new Map<CacheKey, CachedAddr>();
const DNS_TTL_CAP_MS = asIntEnv('REDIS_DNS_TTL_CAP_MS', 5 * 60_000);
const DNS_NEG_TTL_MS = asIntEnv('REDIS_DNS_NEG_TTL_MS', 5_000);
const preferFamily: 4|6 = process.env.REDIS_FAMILY === '6' ? 6 : 4;

const now = () => Date.now();

async function resolveWithTtl(hostname: string, family: 4|6): Promise<CachedAddr> {
  const key: CacheKey = `${hostname}|${family}`;
  const cached = dnsCache.get(key);
  if (cached && cached.expiresAt > now()) return cached;

  try {
    if (family === 4) {
      const answers: ResolveWithTtl4[] = await dnsPromises.resolve4(hostname, { ttl: true }) as unknown as ResolveWithTtl4[];
      if (answers.length) {
        const a = answers[0];
        const ttlMs = Math.min((a.ttl ? a.ttl * 1000 : DNS_TTL_CAP_MS), DNS_TTL_CAP_MS);
        const entry: CachedAddr = { address: a.address, family: 4, expiresAt: now() + ttlMs };
        dnsCache.set(key, entry); return entry;
      }
    } else {
      const answers: ResolveWithTtl6[] = await dnsPromises.resolve6(hostname, { ttl: true }) as unknown as ResolveWithTtl6[];
      if (answers.length) {
        const a = answers[0];
        const ttlMs = Math.min((a.ttl ? a.ttl * 1000 : DNS_TTL_CAP_MS), DNS_TTL_CAP_MS);
        const entry: CachedAddr = { address: a.address, family: 6, expiresAt: now() + ttlMs };
        dnsCache.set(key, entry); return entry;
      }
    }
    const neg: CachedAddr = { address: '', family, expiresAt: now() + DNS_NEG_TTL_MS };
    dnsCache.set(key, neg);
    throw new Error('NO_DNS_RESULTS');
  } catch (e) {
    // Fallback to OS resolver
    return new Promise<CachedAddr>((resolve, reject) => {
      dnsLookupNative(hostname, { family, all: false }, (err, address, fam) => {
        if (err || !address) {
          const neg: CachedAddr = { address: '', family, expiresAt: now() + DNS_NEG_TTL_MS };
          dnsCache.set(key, neg);
          reject(e instanceof Error ? e : new Error(String(e)));
          return;
        }
        const entry: CachedAddr = {
          address,
          family: (fam === 6 ? 6 : 4),
          expiresAt: now() + DNS_TTL_CAP_MS
        };
        dnsCache.set(key, entry);
        resolve(entry);
      });
    });
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Redis options & backoff
// ────────────────────────────────────────────────────────────────────────────────
function expBackoffWithJitter(times: number, capMs: number): number {
  const base = Math.min(1500 * 2 ** times, capMs);
  return Math.floor(Math.random() * base);
}

function buildRedisOptions(url: string, overrideHost?: string): RedisOptions {
  const u = new URL(url);
  const useTLS = shouldUseTLS(u);

  const retryCapMs     = asIntEnv('REDIS_RETRY_CAP_MS', 20_000);
  const connectTimeout = asIntEnv('REDIS_CONNECT_TIMEOUT_MS', 10_000);
  const keepAliveMs    = asIntEnv('REDIS_KEEPALIVE_MS', 30_000);
  const insecureTLS    = asBoolEnv('REDIS_TLS_INSECURE');
  const commandTimeout = asIntEnv('REDIS_COMMAND_TIMEOUT_MS', 0);
  const autoPipe       = asBoolEnv('REDIS_ENABLE_AUTO_PIPELINING');
  const connectionName = process.env.REDIS_CONNECTION_NAME ?? 'llm-queue';
  const caPath         = process.env.REDIS_CA_CERT_PATH;

  const base: RedisOptions = {
    // BullMQ recommendations
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,

    // Networking
    host: overrideHost || undefined,
    family: preferFamily,
    connectTimeout,
    keepAlive: keepAliveMs,
    noDelay: true,
    retryStrategy: (times) => expBackoffWithJitter(times, retryCapMs),

    // Robustness
    autoResendUnfulfilledCommands: true,
    autoResubscribe: true,
    enableOfflineQueue: true,

    // Optional perf
    ...(autoPipe ? { enableAutoPipelining: true } : {}),

    ...(commandTimeout > 0 ? { commandTimeout } : {}),

    connectionName,
  };

  if (useTLS) {
    base.tls = {
      servername: u.hostname,
      rejectUnauthorized: !insecureTLS,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      ...(caPath ? { ca: fs.readFileSync(caPath) } : {}),
    };
  }
  return base;
}

// ────────────────────────────────────────────────────────────────────────────────
// TLS probe (non-fatal)
// ────────────────────────────────────────────────────────────────────────────────
function getCertFields(cert: tls.PeerCertificate | tls.DetailedPeerCertificate): { cn: string; san: string } {
  const detailed = cert as tls.DetailedPeerCertificate;

  // CN
  const cnRaw: unknown = detailed?.subject?.CN;
  const cn: string = typeof cnRaw === 'string' && cnRaw.length > 0 ? cnRaw : '?';

  // SAN (Node exposes as a string like: 'DNS:example.com, DNS:*.example.com')
  const sanRaw: unknown = detailed?.subjectaltname;
  const san: string = typeof sanRaw === 'string' && sanRaw.length > 0 ? sanRaw : '?';

  return { cn, san };
}

async function probeTls(host: string, port: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const sock = net.connect({ host, port, timeout: 8000 }, () => {
      const t = tls.connect(
        { socket: sock, servername: host, minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3', rejectUnauthorized: true },
        () => {
          const proto = t.getProtocol() ?? 'TLS';
          const fields = getCertFields(t.getPeerCertificate());
          console.log(`[redis][tls] OK ${proto} CN=${fields.cn} SAN=${fields.san}`);
          t.end(); resolve();
        }
      );
      t.on('error', (er: unknown) => {
        const code = isErrnoLike(er) && er.code ? er.code : 'TLS_ERROR';
        console.error('[redis][tls] FAIL', code, formatErrorBrief(er));
        try { t.destroy(); } catch {}
        resolve();
      });
    });
    sock.on('error', (er: unknown) => {
      console.error('[redis][tcp] FAIL', (isErrnoLike(er) && er.code) || 'TCP_ERROR', formatErrorBrief(er));
      resolve();
    });
    sock.on('timeout', () => { console.error('[redis][tcp] TIMEOUT'); try { sock.destroy(); } catch {} resolve(); });
  });
}

// ────────────────────────────────────────────────────────────────────────────────
function startHeartbeat(client: Redis): void {
  const interval = asIntEnv('REDIS_HEARTBEAT_MS', 15_000);
  if (interval <= 0) return;
  stopHeartbeat();
  heartbeatTimer = setInterval(() => { void client.ping().catch(() => {}); }, interval);
  (heartbeatTimer as unknown as { unref?: () => void }).unref?.();
}
function stopHeartbeat(): void {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
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
      family: preferFamily,
      tlsInsecure: asBoolEnv('REDIS_TLS_INSECURE'),
      ca: !!process.env.REDIS_CA_CERT_PATH,
    });

    if (useTLS) await probeTls(host, port);

    let resolvedHost = host;
    try {
      const addr = await resolveWithTtl(host, preferFamily);
      if (addr.address) resolvedHost = addr.address;
    } catch (e) {
      console.warn('[redis][dns] resolution failed (will let Node resolve):', formatErrorBrief(e));
    }

    const client = new IORedis(url, buildRedisOptions(url, resolvedHost));

    client.on('connect', () => console.log(`[redis] connect -> ${host}:${port} (tls=${useTLS})`));
    client.on('ready',   () => console.log('[redis] ready'));
    client.on('reconnecting', (ms: number) => console.warn(`[redis] reconnecting in ${ms}ms`));
    client.on('end',   () => console.warn('[redis] connection ended'));
    client.on('close', () => console.warn('[redis] close'));
    client.on('error', (er: unknown) => {
      const msg = formatErrorBrief(er);
      if (/EPIPE|ECONNRESET|ETIMEDOUT|NR_CLOSED|READONLY|ENODNS/i.test(msg)) {
        console.warn('[redis] transient error:', msg);
      } else {
        console.error('[redis] error:', msg);
      }
    });

    await client.connect();
    await Promise.race([
      client.ping(),
      new Promise<void>((_resolve, reject) => setTimeout(() => reject(new Error('PING_TIMEOUT')), 3000)),
    ]);

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
  if (queue) { try { await queue.close(); } catch {} queue = null; }
  if (connection) { try { await connection.quit(); } catch {} connection = null; }
  connectionPromise = null;
}

export function installWorkerSignalHandlers(): void {
  const handler = (): void => {
    console.warn('[worker] SIGTERM/SIGINT received, shutting down gracefully…');
    void (async () => {
      try { await closeQueue(); }
      catch (err) { console.error('[worker] Error during graceful shutdown:', formatErrorBrief(err)); }
      finally { process.exit(0); }
    })();
  };
  process.once('SIGTERM', handler);
  process.once('SIGINT', handler);
}
