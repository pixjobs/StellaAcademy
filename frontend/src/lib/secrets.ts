/**
 * Unified, environment-safe secret access.
 *
 * Resolution order for secrets:
 * 1) Environment variable (UPPER_SNAKE_CASE)
 * 2) In-memory cache (server only)
 * 3) Google Secret Manager (server only) by the same canonical name you pass in
 *
 * IMPORTANT:
 * - No 'server-only' import here. We use dynamic import for '@google-cloud/secret-manager'
 *   and guard with `isBrowser()` so nothing leaks into the client bundle.
 */

import type { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// FIX: Declare 'window' to satisfy the strict Node.js TypeScript compiler.
// This provides a type hint for the `isBrowser` function without affecting the runtime logic
// or requiring the "DOM" library in your tsconfig.worker.json.
declare let window: unknown;

// ---------------------------
// Internal state & utilities
// ---------------------------
let smClient: SecretManagerServiceClient | null = null;
const cache: Record<string, string> = {};

/**
 * Safely checks if the current environment is a browser.
 * This function is the key to making this module "isomorphic".
 */
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

/** Dynamic load GSM client (server only) */
async function getSecretManagerClient(): Promise<SecretManagerServiceClient | null> {
  if (isBrowser()) return null;
  if (smClient) return smClient;

  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    smClient = new SecretManagerServiceClient();
    return smClient;
  } catch (err) {
    console.warn(
      '[secrets] Secret Manager client unavailable (likely local dev without creds). Falling back to env. Reason:',
      (err as Error)?.message || err
    );
    return null;
  }
}

// ---------------------------
// Core secret resolution
// ---------------------------

/**
 * Resolve a secret by "canonical name".
 * - If name is kebab-case (e.g. 'nasa-api-key'), ENV lookup uses 'NASA_API_KEY'
 * - If name is already UPPER_SNAKE_CASE, it's used verbatim for ENV
 * - GSM lookup always uses the canonical name you pass (exact match)
 */
export async function getSecret(name: string): Promise<string> {
  // 1) ENV (works in browser/server)
  const envKey = name.replace(/-/g, '_').toUpperCase();
  const fromEnv = process.env[envKey];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }

  // 2) Browser cannot read GSM, stop here.
  if (isBrowser()) return '';

  // 3) Cache (server only)
  if (cache[name]) {
    return cache[name];
  }

  // 4) GSM (server only)
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) {
      console.warn(`[secrets] GOOGLE_CLOUD_PROJECT not set; cannot fetch '${name}' from GSM.`);
      return '';
    }

    const client = await getSecretManagerClient();
    if (!client) return '';

    const secretPath = `projects/${project}/secrets/${name}/versions/latest`;
    const [response] = await client.accessSecretVersion({ name: secretPath });
    const value = response.payload?.data?.toString('utf8') || '';

    if (!value) {
      console.warn(`[secrets] Secret '${name}' found in GSM but empty.`);
    }
    cache[name] = value;
    return value;
  } catch (err: unknown) {
      if (err instanceof Error) {
        const gcpError = err as { code?: number; message: string };

        switch (gcpError.code) {
          case 5: // NOT_FOUND
            console.warn(
              `[secrets] 🟡 Secret '${name}' not found in GSM for project '${process.env.GOOGLE_CLOUD_PROJECT}'.`
            );
            break;

          case 7: // PERMISSION_DENIED
            console.error(
              `🔴 [secrets] PERMISSION DENIED for secret '${name}'. Ensure the service account has the 'Secret Manager Secret Accessor' role.`
            );
            break;

          default:
            console.error(
              `🔴 [secrets] Failed to fetch '${name}' from GSM. Code: ${gcpError.code ?? 'N/A'}. Message: ${gcpError.message}`
            );
            break;
        }
      } else {
        console.error(
          `🔴 [secrets] An unexpected non-error value was thrown while fetching '${name}':`,
          err
        );
      }
      return '';
    }
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
      (hint ? `Hint: ${hint}` : `Set as ENV (${name.replace(/-/g, '_').toUpperCase()}) or create GSM secret '${name}'.`)
    );
  }
  return v;
}


// --- (The rest of the file is unchanged as it was already correct) ---

// ------------------------------------------
// Domain-specific, convenience accessors
// ------------------------------------------

// NASA
export async function getNasaApiKey(): Promise<string> {
  return getSecret('nasa-api-key');
}

// Google Custom Search (optional)
export async function getGoogleCustomSearchKey(): Promise<string> {
  return getSecret('GOOGLE_CUSTOM_SEARCH_KEY');
}
export async function getGoogleCustomSearchCx(): Promise<string> {
  return getSecret('GOOGLE_CUSTOM_SEARCH_CX');
}

// Clerk
export async function getClerkPublishableKey(): Promise<string> {
  return getSecret('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
}
export async function getClerkSecretKey(): Promise<string> {
  return getSecret('CLERK_SECRET_KEY');
}

// Ollama / LLM provider
export async function getOllamaBaseUrl(): Promise<string> {
  return getSecret('OLLAMA_BASE_URL');
}
export async function getOllamaBearerToken(): Promise<string> {
  return getSecret('OLLAMA_BEARER_TOKEN');
}

// Feature flags / general app config
export function getUseApodBg(): boolean {
  return asBool(process.env.USE_APOD_BG, true);
}

// ---------------------------
// Queue / Redis helpers
// ---------------------------
export function getLlmQueueName(): string {
  return (process.env.LLM_QUEUE_NAME && process.env.LLM_QUEUE_NAME.trim()) || 'llm-queue';
}

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

export async function summariseSecretPresence(): Promise<Record<string, 'env' | 'gsm' | 'missing'>> {
  const names = [ 'nasa-api-key', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'OLLAMA_BASE_URL', 'OLLAMA_BEARER_TOKEN', 'GOOGLE_CUSTOM_SEARCH_KEY', 'GOOGLE_CUSTOM_SEARCH_CX', 'REDIS_URL_ONLINE', 'REDIS_URL_LOCAL', ];
  const out: Record<string, 'env' | 'gsm' | 'missing'> = {};
  for (const name of names) {
    const envKey = name.replace(/-/g, '_').toUpperCase();
    if (process.env[envKey]) {
      out[name] = 'env';
      continue;
    }
    if (!isBrowser()) {
      try {
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const client = await getSecretManagerClient();
        if (project && client) {
          const path = `projects/${project}/secrets/${name}/versions/latest`;
          await client.accessSecretVersion({ name: path });
          out[name] = 'gsm';
          continue;
        }
      } catch { /* ignore */ }
    }
    out[name] = 'missing';
  }
  return out;
}

export async function logSecretPresenceSample(): Promise<void> {
  const presence = await summariseSecretPresence();
  const sampleNames = ['REDIS_URL_ONLINE', 'REDIS_URL_LOCAL', 'OLLAMA_BASE_URL'];
  const maskedSamples: Record<string, string> = {};
  for (const n of sampleNames) {
    const v = await getSecret(n);
    maskedSamples[n] = mask(v);
  }
  console.log('[secrets] presence:', presence, 'samples:', maskedSamples);
}