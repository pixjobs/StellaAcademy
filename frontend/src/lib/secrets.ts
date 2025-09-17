/**
 * Unified, environment-safe secret + config access.
 *
 * Resolution order for secrets (server):
 * 1) In-memory cache
 * 2) Google Secret Manager (preferred) — **exact name only**
 * 3) Environment variable (UPPER_SNAKE_CASE)
 *
 * In browser: env only (never attempts GSM).
 */

import type { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Provide a type without needing DOM libs in tsconfig
declare let window: unknown;

// ---------------------------
// Internal state & utilities
// ---------------------------
let smClient: SecretManagerServiceClient | null = null;
const cache: Record<string, string> = {};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/** Light parser for booleans ("true"/"1"/"yes") */
function asBool(v: string | undefined | null, def = false): boolean {
  if (!v) return def;
  const t = v.trim().toLowerCase();
  return t === 'true' || t === '1' || t === 'yes';
}

/** Mask a secret for logs (keeps first/last 2 chars) */
function mask(s: string): string {
  if (!s) return '';
  if (s.length <= 6) return '*'.repeat(s.length);
  return `${s.slice(0, 2)}${'*'.repeat(Math.max(1, s.length - 4))}${s.slice(-2)}`;
}

function s(v?: string | null): string | undefined {
  const t = (v ?? '').toString().trim();
  return t || undefined;
}

function toEnvKey(name: string): string {
  // Keep exact UPPER_SNAKE vars if caller passes them already; otherwise convert.
  return /^[A-Z0-9_]+$/.test(name) ? name : name.replace(/-/g, '_').toUpperCase();
}

/** Dynamic load GSM client (server only), memoized for performance. */
async function getSecretManagerClient(): Promise<SecretManagerServiceClient | null> {
  if (isBrowser()) return null;
  if (smClient) return smClient;

  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    smClient = new SecretManagerServiceClient();
    return smClient;
  } catch (err) {
    console.warn(
      '[secrets] Secret Manager client unavailable. Falling back to env vars. Reason:',
      (err as Error)?.message || err
    );
    return null;
  }
}

/** Best-effort gcp-metadata fetcher (no hard dependency at runtime). */
async function tryGcpMetadata(path: string): Promise<string | undefined> {
  try {
    const { default: gcpMetadata } = await import('gcp-metadata'); // npm i gcp-metadata
    const available = await gcpMetadata.isAvailable();
    if (!available) return undefined;
    // Try instance first; fallback to project scope
    return await gcpMetadata
      .instance(path)
      .catch(async () => gcpMetadata.project(path).catch(() => undefined));
  } catch {
    return undefined;
  }
}

// ------------------------------------------
// Project / location auto-discovery
// ------------------------------------------

export async function getProjectId(): Promise<string> {
  const env = s(process.env.GOOGLE_CLOUD_PROJECT) || s(process.env.GCLOUD_PROJECT);
  if (env) return env;

  const meta = await tryGcpMetadata('project-id');
  if (meta) return meta;

  throw new Error('GOOGLE_CLOUD_PROJECT not set and GCP metadata unavailable');
}

async function resolveProjectIdForSecrets(): Promise<string | undefined> {
  try {
    return await getProjectId();
  } catch {
    return undefined;
  }
}

export async function getProjectNumber(): Promise<string | undefined> {
  const env = s(process.env.GOOGLE_CLOUD_PROJECT_NUMBER);
  if (env) return env;

  const meta = await tryGcpMetadata('numeric-project-id'); // e.g. "123456789012"
  return meta || undefined;
}

export async function getGcpLocation(): Promise<string> {
  const env = s(process.env.GCP_LOCATION);
  if (env) return env;

  const regionPath = await tryGcpMetadata('region');
  if (regionPath) {
    const match = regionPath.match(/regions\/([a-z0-9-]+)$/i);
    if (match?.[1]) return match[1];
  }
  return 'europe-west1'; // default
}

// ---------------------------
/** Core secret resolution (GSM exact-name first, then env) */
// ---------------------------

export async function getSecret(name: string): Promise<string> {
  // Browser: env only
  if (isBrowser()) {
    const browserEnvKey = toEnvKey(name);
    return process.env[browserEnvKey] || '';
  }

  // Cache
  if (cache[name]) return cache[name];

  // Google Secret Manager (preferred) — **exact name only**
  try {
    const client = await getSecretManagerClient();
    const project = await resolveProjectIdForSecrets();
    if (client && project) {
      const secretPath = `projects/${project}/secrets/${name}/versions/latest`;
      const [resp] = await client.accessSecretVersion({ name: secretPath });
      const value = resp.payload?.data?.toString('utf8') || '';
      if (value) {
        cache[name] = value;
        return value;
      }
      console.warn(`[secrets] Secret '${name}' found in GSM but was empty.`);
    }
  } catch (err: unknown) {
    // code 5 = NOT_FOUND is normal if the secret isn't in GSM; other codes we log
    const gcpError = (err ?? {}) as { code?: number; message?: string };

    if (gcpError.code && gcpError.code !== 5) {
      console.warn(
        `[secrets] GSM lookup error for '${name}' (code ${gcpError.code}): ${
          gcpError.message || String(err)
        }`
      );
    }
  }

  // ENV fallback
  const envKey = toEnvKey(name);
  const fromEnv = process.env[envKey];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }

  // None found
  return '';
}

/** Convenience: fetch with default */
export async function getSecretOr(name: string, defaultValue: string): Promise<string> {
  const v = await getSecret(name);
  return v || defaultValue;
}

/** Convenience: fetch or throw a helpful error */
export async function getRequiredSecret(name: string, hint?: string): Promise<string> {
  const v = await getSecret(name);
  if (!v) {
    throw new Error(
      `[secrets] Required secret '${name}' is missing. ` +
        (hint
          ? `Hint: ${hint}`
          : `Set as ENV (${toEnvKey(name)}) or create GSM secret '${name}'.`)
    );
  }
  return v;
}

// ---------------------------
// Domain-specific accessors
// ---------------------------

export function getUseApodBg(): boolean {
  return asBool(process.env.USE_APOD_BG, true);
}

// --- Third Party Services ---
// Keep names EXACTLY as in GCP (--set-secrets=NASA_API_KEY=NASA_API_KEY:latest etc.)
export async function getNasaApiKey(): Promise<string> {
  return getSecret('NASA_API_KEY');
}
export async function getGoogleCustomSearchKey(): Promise<string> {
  return getSecret('GOOGLE_CUSTOM_SEARCH_KEY');
}
export async function getGoogleCustomSearchCx(): Promise<string> {
  return getSecret('GOOGLE_CUSTOM_SEARCH_CX');
}

// --- LLM Provider ---
export async function getOllamaBaseUrl(): Promise<string> {
  return getSecret('OLLAMA_BASE_URL');
}
export async function getOllamaBearerToken(): Promise<string> {
  return getSecret('OLLAMA_BEARER_TOKEN');
}

// --- Cloud Run Worker / Cloud Tasks ---
// Keep names EXACTLY as in your deploy flags.
export async function getCloudRunWorkerUrl(): Promise<string> {
  return getRequiredSecret('CLOUD_RUN_WORKER_URL', 'Public HTTPS URL of your deployed worker service.');
}

export async function getCloudRunWorkerAudience(): Promise<string> {
  const explicit = await getSecret('WORKER_RUN_AUDIENCE');
  if (explicit) return explicit;
  const url = await getSecret('CLOUD_RUN_WORKER_URL');
  return url || '';
}

/**
 * Cloud Tasks invoker SA.
 * - Prefer CLOUD_TASKS_INVOKER_SA (env/secret).
 * - Else Compute Engine default: "<PROJECT_NUMBER>-compute@developer.gserviceaccount.com".
 * - Else App Engine default: "<PROJECT_ID>@appspot.gserviceaccount.com".
 * - Else return empty string; caller can treat as “no OIDC”.
 */
export async function getCloudTasksInvokerSa(): Promise<string> {
  const env = await getSecret('CLOUD_TASKS_INVOKER_SA');
  if (env) return env;

  const pn = await getProjectNumber().catch(() => undefined);
  if (pn) return `${pn}-compute@developer.gserviceaccount.com`;

  const pid = await getProjectId().catch(() => undefined);
  if (pid) return `${pid}@appspot.gserviceaccount.com`;

  return '';
}

export async function getInteractiveTasksQueueId(): Promise<string> {
  return getSecretOr('INTERACTIVE_TASKS_QUEUE_ID', 'interactive');
}
export async function getBackgroundTasksQueueId(): Promise<string> {
  return getSecretOr('BACKGROUND_TASKS_QUEUE_ID', 'background');
}

/** DEV worker URL + path */
export async function getDevWorkerUrl(): Promise<string> {
  return getSecretOr('WORKER_DEV_URL', 'http://localhost:8080');
}
export async function getDevWorkerPath(): Promise<string> {
  return getSecretOr('WORKER_DEV_PATH', '/');
}

// ---------------------------
// Infrastructure Helpers (Redis, etc.)
// ---------------------------
export async function resolveRedisUrl(): Promise<string> {
  if (asBool(process.env.FORCE_LOCAL_REDIS)) {
    const local = await getRedisUrlLocal();
    if (local) {
      console.log('[secrets] resolveRedisUrl → using LOCAL (forced).');
      return local;
    }
    console.warn('[secrets] FORCE_LOCAL_REDIS set but REDIS_URL_LOCAL is empty.');
  }
  const online = await getRedisUrlOnline();
  if (online) {
    console.log('[secrets] resolveRedisUrl → using ONLINE.');
    return online;
  }
  const local = await getRedisUrlLocal();
  if (local) {
    console.log('[secrets] resolveRedisUrl → using LOCAL (fallback).');
    return local;
  }
  console.error('[secrets] resolveRedisUrl → no Redis URL configured.');
  return '';
}
export async function getRedisUrlOnline(): Promise<string> {
  return getSecret('REDIS_URL_ONLINE');
}
export async function getRedisUrlLocal(): Promise<string> {
  return getSecret('REDIS_URL_LOCAL');
}

// ---------------------------
// Diagnostics & Performance
// ---------------------------
export async function summariseSecretPresence(): Promise<
  Record<string, 'env' | 'gsm' | 'missing'>
> {
  const names = [
    'NASA_API_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'OLLAMA_BASE_URL',
    'OLLAMA_BEARER_TOKEN',
    'GOOGLE_CUSTOM_SEARCH_KEY',
    'GOOGLE_CUSTOM_SEARCH_CX',
    'REDIS_URL_ONLINE',
    'REDIS_URL_LOCAL',
    'GCP_LOCATION',
    'CLOUD_RUN_WORKER_URL',
    'WORKER_RUN_AUDIENCE',
    'CLOUD_TASKS_INVOKER_SA',
    'INTERACTIVE_TASKS_QUEUE_ID',
    'BACKGROUND_TASKS_QUEUE_ID',
    'WORKER_DEV_URL',
    'WORKER_DEV_PATH',
  ];

  const out: Record<string, 'env' | 'gsm' | 'missing'> = {};
  const project = await resolveProjectIdForSecrets();
  const client = await getSecretManagerClient();

  const checkPromises = names.map(async (name) => {
    if (process.env[name]) return { name, status: 'env' as const };
    if (!isBrowser() && client && project) {
      try {
        const path = `projects/${project}/secrets/${name}/versions/latest`;
        await client.getSecretVersion({ name: path });
        return { name, status: 'gsm' as const };
      } catch {
        // not found in GSM
      }
    }
    return { name, status: 'missing' as const };
  });

  const results = await Promise.allSettled(checkPromises);
  for (const r of results) {
    if (r.status === 'fulfilled') {
      out[r.value.name] = r.value.status;
    }
  }
  return out;
}

export async function logSecretPresenceSample(): Promise<void> {
  const presence = await summariseSecretPresence();
  const sampleNames = ['OLLAMA_BASE_URL', 'NASA_API_KEY', 'CLERK_SECRET_KEY'];
  const masked: Record<string, string> = {};
  const vals = await Promise.all(sampleNames.map((n) => getSecret(n)));
  sampleNames.forEach((n, i) => (masked[n] = mask(vals[i])));
  console.log('[secrets] presence:', presence, 'samples:', masked);
}
