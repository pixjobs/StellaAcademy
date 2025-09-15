/**
 * Unified, environment-safe secret access.
 *
 * Resolution order for secrets:
 * 1) In-memory cache (server only)
 * 2) Google Secret Manager (server only) by the same canonical name you pass in
 * 3) Environment variable (UPPER_SNAKE_CASE)
 *
 * IMPORTANT:
 * - No 'server-only' import here. We use dynamic import for '@google-cloud/secret-manager'
 *   and guard with `isBrowser()` so nothing leaks into the client bundle.
 */

import type { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// This provides a type hint for the `isBrowser` function without requiring the "DOM"
// library in your tsconfig, which is ideal for Node.js/worker environments.
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

// ---------------------------
// Core secret resolution
// ---------------------------

/**
 * Resolve a secret by "canonical name" with GSM as the priority.
 * - If name is kebab-case (e.g. 'nasa-api-key'), ENV lookup uses 'NASA_API_KEY'
 * - If name is already UPPER_SNAKE_CASE, it's used verbatim for ENV
 * - GSM lookup always uses the canonical name you pass (exact match)
 */
export async function getSecret(name: string): Promise<string> {
  // Browser environment can ONLY use environment variables.
  if (isBrowser()) {
    const browserEnvKey = name.replace(/-/g, '_').toUpperCase();
    return process.env[browserEnvKey] || '';
  }

  // --- NEW LOGIC ORDER FOR SERVER-SIDE ---

  // 1) Cache (server only, for performance)
  if (cache[name]) {
    return cache[name];
  }

  // 2) GSM (server only, PRIORITY)
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (project) { // Only attempt GSM if project is set
      const client = await getSecretManagerClient();
      if (client) {
        const secretPath = `projects/${project}/secrets/${name}/versions/latest`;
        const [response] = await client.accessSecretVersion({ name: secretPath });
        const value = response.payload?.data?.toString('utf8') || '';

        if (value) {
          cache[name] = value; // Cache the successful result.
          return value;
        }
        // If secret is found but empty, we warn and will proceed to env var fallback.
        console.warn(`[secrets] Secret '${name}' found in GSM but was empty.`);
      }
    }
  } catch (err: unknown) {
    const gcpError = err as { code?: number; message: string };
    const errorMessage = gcpError.message || String(err);
    
    const isAuthError = errorMessage.includes('invalid_grant') || errorMessage.includes('invalid_rapt');
    if (isAuthError && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)) {
        console.error('\n' + '╔'.padEnd(79, '═') + '╗');
        console.error('║' + '  ACTION REQUIRED: Google Cloud Authentication Expired  '.padStart(62) + ' '.padEnd(16) + '║');
        console.error('║' + "  Run: gcloud auth application-default login".padEnd(78) + '║');
        console.error('╚'.padEnd(79, '═') + '╝' + '\n');
        process.exit(1);
    }

    // For non-auth errors, we don't throw. We just log and fall back to env vars.
    if (gcpError.code !== 5) { // 5 is NOT_FOUND, which is a normal fallback case.
        console.error(`🔴 [secrets] Error fetching '${name}' from GSM (Code: ${gcpError.code ?? 'N/A'}). Will try environment variables. Message: ${errorMessage}`);
    }
  }

  // 3) ENV (server only, FALLBACK)
  const envKey = name.replace(/-/g, '_').toUpperCase();
  const fromEnv = process.env[envKey];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }

  // If we reach here, the secret was not found anywhere.
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
      (hint ? `Hint: ${hint}` : `Set as ENV (${name.replace(/-/g, '_').toUpperCase()}) or create GSM secret '${name}'.`)
    );
  }
  return v;
}

// ------------------------------------------
// Domain-specific, convenience accessors
// ------------------------------------------

export function getUseApodBg(): boolean { return asBool(process.env.USE_APOD_BG, true); }

// --- Third Party Services ---
export async function getNasaApiKey(): Promise<string> { return getSecret('nasa-api-key'); }
export async function getGoogleCustomSearchKey(): Promise<string> { return getSecret('GOOGLE_CUSTOM_SEARCH_KEY'); }
export async function getGoogleCustomSearchCx(): Promise<string> { return getSecret('GOOGLE_CUSTOM_SEARCH_CX'); }

// --- Authentication ---
export async function getClerkPublishableKey(): Promise<string> { return getSecret('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'); }
export async function getClerkSecretKey(): Promise<string> { return getSecret('CLERK_SECRET_KEY'); }

// --- LLM Provider ---
export async function getOllamaBaseUrl(): Promise<string> { return getSecret('OLLAMA_BASE_URL'); }
export async function getOllamaBearerToken(): Promise<string> { return getSecret('OLLAMA_BEARER_TOKEN'); }

// --- NEW: CLOUD TASKS & WORKER CONFIG ---
export async function getGcpLocation(): Promise<string> { return getSecretOr('GCP_LOCATION', 'europe-west1'); }
export async function getCloudRunWorkerUrl(): Promise<string> { return getRequiredSecret('CLOUD_RUN_WORKER_URL', 'This must be the public HTTPS URL of your deployed worker service.'); }
export async function getCloudTasksInvokerSa(): Promise<string> { return getRequiredSecret('CLOUD_TASKS_INVOKER_SA', 'This is the service account with roles/run.invoker permission.'); }
export async function getInteractiveTasksQueueId(): Promise<string> { return getSecretOr('INTERACTIVE_TASKS_QUEUE_ID', 'local-interactive-queue'); }
export async function getBackgroundTasksQueueId(): Promise<string> { return getSecretOr('BACKGROUND_TASKS_QUEUE_ID', 'local-background-queue'); }


// ---------------------------
// Infrastructure Helpers (Redis, etc.)
// ---------------------------
export async function resolveRedisUrl(): Promise<string> {
    if (asBool(process.env.FORCE_LOCAL_REDIS)) { const local = await getRedisUrlLocal(); if (local) { console.log('[secrets] resolveRedisUrl → using LOCAL (forced).'); return local; } console.warn('[secrets] FORCE_LOCAL_REDIS set but REDIS_URL_LOCAL is empty.'); }
    const online = await getRedisUrlOnline(); if (online) { console.log('[secrets] resolveRedisUrl → using ONLINE.'); return online; }
    const local = await getRedisUrlLocal(); if (local) { console.log('[secrets] resolveRedisUrl → using LOCAL (fallback).'); return local; }
    console.error('[secrets] resolveRedisUrl → no Redis URL configured.'); return '';
}
export async function getRedisUrlOnline(): Promise<string> { return getSecret('REDIS_URL_ONLINE'); }
export async function getRedisUrlLocal(): Promise<string> { return getSecret('REDIS_URL_LOCAL'); }


// ---------------------------
// Diagnostics & Performance
// ---------------------------
/**
 * Checks for the presence of key secrets in both GSM and environment variables.
 * This is used for startup logging to help diagnose configuration issues.
 */
export async function summariseSecretPresence(): Promise<Record<string, 'env' | 'gsm' | 'missing'>> {
  // --- UPDATED: Added new task-related secrets to the list ---
  const names = [
    'nasa-api-key',
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
    'CLOUD_TASKS_INVOKER_SA',
    'INTERACTIVE_TASKS_QUEUE_ID',
    'BACKGROUND_TASKS_QUEUE_ID',
  ];
  const out: Record<string, 'env' | 'gsm' | 'missing'> = {};
  const checkPromises = names.map(async (name) => {
    const envKey = name.replace(/-/g, '_').toUpperCase();
    if (process.env[envKey]) { return { name, status: 'env' }; }
    if (!isBrowser()) { try { const project = process.env.GOOGLE_CLOUD_PROJECT; const client = await getSecretManagerClient(); if (project && client) { const path = `projects/${project}/secrets/${name}/versions/latest`; await client.getSecretVersion({ name: path }); return { name, status: 'gsm' }; } } catch { /* ignore */ } }
    return { name, status: 'missing' };
  });
  const results = await Promise.allSettled(checkPromises);
  results.forEach(result => { if (result.status === 'fulfilled') { out[result.value.name] = result.value.status as 'env' | 'gsm' | 'missing'; } });
  return out;
}

/**
 * Logs a sample of secrets (masked) and their locations (env/gsm/missing)
 * to the console on server startup for easier debugging.
 */
export async function logSecretPresenceSample(): Promise<void> {
  const presence = await summariseSecretPresence();
  const sampleNames = ['OLLAMA_BASE_URL', 'nasa-api-key', 'CLERK_SECRET_KEY'];
  const maskedSamples: Record<string, string> = {};
  const samplePromises = sampleNames.map(name => getSecret(name));
  const sampleResults = await Promise.all(samplePromises);
  for (let i = 0; i < sampleNames.length; i++) {
    maskedSamples[sampleNames[i]] = mask(sampleResults[i]);
  }
  console.log('[secrets] presence:', presence, 'samples:', maskedSamples);
}