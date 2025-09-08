import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { clampInt, sleep } from './utils';

// ==========================================================================
// CONFIGURATION INTERFACE & STORE
//
// This defines the structure of our application's configuration. The `config`
// object below holds the live, cached values for the entire application.
// ==========================================================================

interface AppConfig {
  OLLAMA_BASE_URL: string | undefined;
  OLLAMA_MODEL: string;
  REQUEST_TIMEOUT_MS: number;
  RETRIES: number;
  OLLAMA_BEARER_TOKEN: string | undefined;
  OLLAMA_BASIC_AUTH: string | undefined;
  NASA_API_KEY: string | undefined;
  isLoaded: boolean;
}

// Initialize with placeholders. The loader function is the single source of truth.
const config: AppConfig = {
  OLLAMA_BASE_URL: undefined,
  OLLAMA_MODEL: 'gpt-oss:20b',
  REQUEST_TIMEOUT_MS: 60000,
  RETRIES: 2,
  OLLAMA_BEARER_TOKEN: undefined,
  OLLAMA_BASIC_AUTH: undefined,
  NASA_API_KEY: undefined,
  isLoaded: false,
};

/**
 * Initializes and validates the application config. It first loads from .env.local as a
 * baseline, then attempts to override with secrets from GCP. Throws a fatal error
 * if required configuration is missing after attempting all sources.
 */
export async function loadConfigFromSecrets(): Promise<void> {
  if (config.isLoaded) return;

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║      LOADING APPLICATION CONFIGURATION     ║');
  console.log('╚══════════════════════════════════════════╝');

  // --- Step 1: Load baseline from .env.local (process.env) ---
  console.log('[config] STEP 1: Reading baseline environment variables from .env.local...');
  
  config.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
  config.OLLAMA_MODEL = process.env.OLLAMA_MODEL || config.OLLAMA_MODEL;
  config.REQUEST_TIMEOUT_MS = clampInt(process.env.OLLAMA_TIMEOUT_MS, 5_000, 120_000, config.REQUEST_TIMEOUT_MS);
  config.RETRIES = clampInt(process.env.OLLAMA_RETRIES, 0, 5, config.RETRIES);
  config.OLLAMA_BEARER_TOKEN = process.env.OLLAMA_BEARER_TOKEN;
  config.OLLAMA_BASIC_AUTH = process.env.OLLAMA_BASIC_AUTH;
  config.NASA_API_KEY = process.env.NASA_API_KEY;

  console.log(`[config]   > Initial NASA_API_KEY from .env.local: ${config.NASA_API_KEY ? "'******'" : "Not Set"}`);
  console.log(`[config]   > Initial OLLAMA_BASE_URL from .env.local: ${config.OLLAMA_BASE_URL || "Not Set"}`);

  // --- Step 2: Attempt to override with secrets from Google Secret Manager ---
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (projectId) {
    console.log(`[config] STEP 2: Attempting to load overrides from Secret Manager for project '${projectId}'...`);
    
    const client = new SecretManagerServiceClient();
    const accessSecret = async (secretName: string | undefined): Promise<string | undefined> => {
      if (!secretName) return undefined;
      try {
        const [version] = await client.accessSecretVersion({ name: `projects/${projectId}/secrets/${secretName}/versions/latest` });
        const payload = version.payload?.data?.toString();
        if (payload) {
          console.log(`[config] ✅ Successfully loaded secret: '${secretName}'`);
          return payload;
        }
      } catch (error: unknown) {
      // This is the most robust way to handle errors of an unknown type.
      // First, we check if the thrown value is an actual Error object.
      if (error instanceof Error) {
        // Now that we know it's an Error, we can safely access `error.message`.
        // We also cast it to a type that might have a `code` property, which is
        // common for GCP and gRPC errors.
        const err = error as { code?: number; message: string };

        // A switch statement is cleaner and safer for handling specific codes.
        switch (err.code) {
          case 3: // INVALID_ARGUMENT
            console.warn(`[config] 🟡 INVALID ARGUMENT for secret '${secretName}'. This usually means the secret name is malformed or contains invalid characters.`);
            break;

          case 5: // NOT_FOUND
            console.warn(`[config] 🟡 Secret named '${secretName}' NOT FOUND in your GCP project. Please verify the name is correct.`);
            break;

          case 7: // PERMISSION_DENIED
            console.warn(`[config] 🟡 PERMISSION DENIED for secret '${secretName}'. Ensure your application's service account has the "Secret Manager Secret Accessor" role. If running locally, you may need to re-authenticate with 'gcloud auth application-default login'.`);
            break;
          
          default:
            // This is the catch-all for any other type of error, including network
            // issues or errors that don't have a specific code. It provides the most context.
            console.warn(`[config] 🟡 An unexpected error occurred while accessing secret '${secretName}'. Code: ${err.code ?? 'N/A'}. Message: ${err.message}`);
            break;
        }
      } else {
        // This handles the rare case where something other than an Error object was thrown.
        console.warn(`[config] 🟡 An unexpected non-error value was thrown while accessing secret '${secretName}':`, error);
      }
    }
    // This was part of your original code, so it's preserved.
    return undefined;
  };

    const [baseUrl, nasaKey, bearerToken, basicAuth] = await Promise.all([
      accessSecret(process.env.OLLAMA_BASE_URL_SECRET),
      accessSecret(process.env.NASA_API_KEY_SECRET),
      accessSecret(process.env.OLLAMA_BEARER_TOKEN_SECRET),
      accessSecret(process.env.OLLAMA_BASIC_AUTH_SECRET),
    ]);

    // This logic ensures GCP values take priority
    if (baseUrl) {
      if (config.OLLAMA_BASE_URL !== baseUrl) console.log(`[config]   > OVERRIDING OLLAMA_BASE_URL with value from Secret Manager.`);
      config.OLLAMA_BASE_URL = baseUrl;
    }
    if (nasaKey) {
      if (config.NASA_API_KEY !== nasaKey) console.log(`[config]   > OVERRIDING NASA_API_KEY with value from Secret Manager.`);
      config.NASA_API_KEY = nasaKey;
    }
    if (bearerToken) {
      if (config.OLLAMA_BEARER_TOKEN !== bearerToken) console.log(`[config]   > OVERRIDING OLLAMA_BEARER_TOKEN with value from Secret Manager.`);
      config.OLLAMA_BEARER_TOKEN = bearerToken;
    }
    if (basicAuth) {
      if (config.OLLAMA_BASIC_AUTH !== basicAuth) console.log(`[config]   > OVERRIDING OLLAMA_BASIC_AUTH with value from Secret Manager.`);
      config.OLLAMA_BASIC_AUTH = basicAuth;
    }
  } else {
    console.log('[config] GOOGLE_CLOUD_PROJECT not set. Using .env.local values only.');
  }

  // --- Step 3: Validate the final configuration ---
  console.log('[config] STEP 3: Validating final configuration...');
  if (!config.OLLAMA_BASE_URL) {
    const errorMsg = '🔴 FATAL: OLLAMA_BASE_URL is not defined. Set it in your .env.local file or in GCP Secret Manager.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  if (!config.NASA_API_KEY) {
    const errorMsg = '🔴 FATAL: NASA_API_KEY is not defined. Set it in your .env.local file or in GCP Secret Manager.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  config.isLoaded = true;

  // --- Step 4: Log the final, sanitized configuration for debugging ---
  const sanitizedConfig = {
    'Source': projectId ? 'GCP Secrets / .env' : '.env.local ONLY',
    'OLLAMA Base URL': config.OLLAMA_BASE_URL,
    'OLLAMA Model': config.OLLAMA_MODEL,
    'NASA API Key': config.NASA_API_KEY ? '****** SET ******' : 'NOT SET',
    'Bearer Token': config.OLLAMA_BEARER_TOKEN ? '****** SET ******' : 'NOT SET',
    'Basic Auth': config.OLLAMA_BASIC_AUTH ? '****** SET ******' : 'NOT SET',
  };
  console.log('\n[config] ✅ Final Configuration Loaded:');
  console.table(sanitizedConfig);
  console.log('--------------------------------------------\n');
}

// --- CONFIG GETTERS & INITIALIZATION GUARD ---

function ensureConfigLoaded() {
  if (!config.isLoaded) {
    throw new Error('Configuration has not been loaded. Ensure "await loadConfigFromSecrets()" is called at application startup.');
  }
}

export const getNasaApiKey = (): string => {
  ensureConfigLoaded();
  return config.NASA_API_KEY!;
};

export function getOllamaInfo() {
  ensureConfigLoaded();
  return {
    baseUrl: config.OLLAMA_BASE_URL!,
    model: config.OLLAMA_MODEL,
    reqTimeoutMs: config.REQUEST_TIMEOUT_MS,
  };
}


// --- PRIVATE HELPERS ---

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (config.OLLAMA_BEARER_TOKEN) {
    h.Authorization = `Bearer ${config.OLLAMA_BEARER_TOKEN}`;
  } else if (config.OLLAMA_BASIC_AUTH) {
    const basicAuth = config.OLLAMA_BASIC_AUTH;
    if (typeof basicAuth === 'string') {
      h.Authorization = `Basic ${Buffer.from(basicAuth).toString('base64')}`;
    }
  }
  return h;
}

function jitteredBackoff(baseMs: number, attempt: number, capMs: number): number {
  const expo = baseMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * baseMs;
  return Math.min(capMs, Math.round(expo + jitter));
}

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
  timeoutMs = config.REQUEST_TIMEOUT_MS
): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(input, { ...(init ?? {}), signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

// --- PUBLIC API ---

export async function pingOllama(): Promise<boolean> {
  ensureConfigLoaded();
  try {
    const res = await fetchWithTimeout(`${config.OLLAMA_BASE_URL!}/api/tags`, { method: 'GET' }, 4000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function callOllama(prompt: string, options: { retries?: number; temperature?: number } = {}): Promise<string> {
  ensureConfigLoaded();
  
  const { retries = config.RETRIES, temperature = 0.6 } = options;
  const body = JSON.stringify({
    model: config.OLLAMA_MODEL,
    stream: false,
    prompt,
    options: { temperature, keep_alive: '10m' },
  });
  let lastErr: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetchWithTimeout(`${config.OLLAMA_BASE_URL!}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Ollama ${res.status}: ${txt || res.statusText}`);
      }
      const json = (await res.json()) as { response?: string };
      return json.response ?? '';
    } catch (e: unknown) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const delay = jitteredBackoff(300, attempt, 4000);
      console.warn(`[ollama-client] attempt ${attempt} failed: ${msg} (retry in ${delay}ms)`);
      if (attempt <= retries) await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}