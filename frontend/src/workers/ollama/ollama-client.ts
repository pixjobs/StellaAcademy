/* eslint-disable no-console */
import { getSecret, getRequiredSecret } from '@/lib/secrets';
import { clampInt, sleep } from './utils';

// ==========================================================================
// CONFIGURATION INTERFACE & STORE
// ==========================================================================

interface AppConfig {
  ollamaBaseUrl: string;
  ollamaModel: string;
  requestTimeoutMs: number;
  retries: number;
  ollamaBearerToken?: string;
  ollamaBasicAuth?: string;
  nasaApiKey?: string;
  isLoaded: boolean;
}

// Default values are set here. The loader function is the single source of truth.
const config: AppConfig = {
  ollamaBaseUrl: '', // Will be loaded and is required
  ollamaModel: process.env.OLLAMA_MODEL || 'gpt-oss:20b',
  requestTimeoutMs: clampInt(process.env.OLLAMA_TIMEOUT_MS, 5_000, 120_000, 60_000),
  retries: clampInt(process.env.OLLAMA_RETRIES, 0, 5, 2),
  ollamaBearerToken: undefined,
  ollamaBasicAuth: undefined,
  nasaApiKey: undefined,
  isLoaded: false,
};

/**
 * Initializes and validates the application config by delegating to the
 * authoritative `lib/secrets.ts` module. Throws a fatal error if secrets
 * marked as "required" are not found.
 */
export async function loadConfigFromSecrets(): Promise<void> {
  if (config.isLoaded) return;

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║      LOADING APPLICATION CONFIGURATION     ║');
  console.log('╚══════════════════════════════════════════╝');

  // --- Delegate all secret fetching to the authoritative library ---
  const [baseUrl, nasaKey, bearerToken, basicAuth] = await Promise.all([
    getRequiredSecret('OLLAMA_BASE_URL', 'Set in .env.local or GCP Secret Manager'),
    getSecret('nasa-api-key'), // Optional: returns '' if not found
    getSecret('OLLAMA_BEARER_TOKEN'), // Optional
    getSecret('OLLAMA_BASIC_AUTH'),   // Optional
  ]);

  // --- Populate the config object ---
  config.ollamaBaseUrl = baseUrl;
  if (nasaKey) config.nasaApiKey = nasaKey;
  if (bearerToken) config.ollamaBearerToken = bearerToken;
  if (basicAuth) config.ollamaBasicAuth = basicAuth;

  config.isLoaded = true;

  // --- Log the final, sanitized configuration for debugging ---
  const sanitizedConfig = {
    'OLLAMA Base URL': config.ollamaBaseUrl,
    'OLLAMA Model': config.ollamaModel,
    'NASA API Key': config.nasaApiKey ? '****** SET ******' : 'NOT SET (optional)',
    'Bearer Token': config.ollamaBearerToken ? '****** SET ******' : 'NOT SET (optional)',
    'Basic Auth': config.ollamaBasicAuth ? '****** SET ******' : 'NOT SET (optional)',
  };
  console.log('\n[config] ✅ Final Configuration Loaded:');
  console.table(sanitizedConfig);
  console.log('--------------------------------------------\n');
}

// --- CONFIG GETTERS & INITIALIZATION GUARD ---

function ensureConfigLoaded(): void {
  if (!config.isLoaded) {
    throw new Error('Configuration has not been loaded. Ensure "await loadConfigFromSecrets()" is called at application startup.');
  }
}

export function getOllamaInfo() {
  ensureConfigLoaded();
  return {
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
    reqTimeoutMs: config.requestTimeoutMs,
  };
}

// This function is now only used in places that strictly require the NASA key.
export function getNasaApiKey(): string | undefined {
  ensureConfigLoaded();
  return config.nasaApiKey;
}

// --- PRIVATE HELPERS ---

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (config.ollamaBearerToken) {
    h.Authorization = `Bearer ${config.ollamaBearerToken}`;
  } else if (config.ollamaBasicAuth) {
    h.Authorization = `Basic ${Buffer.from(config.ollamaBasicAuth).toString('base64')}`;
  }
  return h;
}

function jitteredBackoff(baseMs: number, attempt: number, capMs: number): number {
  const expo = baseMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * baseMs;
  return Math.min(capMs, Math.round(expo + jitter));
}

async function fetchWithTimeout(
  // FIX: Replace `RequestInfo` with `string` to make it Node.js compatible.
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = config.requestTimeoutMs
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- PUBLIC API ---

export async function pingOllama(): Promise<boolean> {
  ensureConfigLoaded();
  try {
    const res = await fetchWithTimeout(new URL('/api/tags', config.ollamaBaseUrl), { method: 'GET' }, 4000);
    return res.ok;
  } catch {
    return false;
  }
}

export async function callOllama(prompt: string, options: { retries?: number; temperature?: number } = {}): Promise<string> {
  ensureConfigLoaded();
  
  const { retries = config.retries, temperature = 0.6 } = options;
  const body = JSON.stringify({
    model: config.ollamaModel,
    stream: false,
    prompt,
    options: { temperature, keep_alive: '10m' },
  });
  let lastErr: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetchWithTimeout(new URL('/api/generate', config.ollamaBaseUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => `(Status: ${res.status})`);
        throw new Error(`Ollama request failed: ${txt}`);
      }
      const json = (await res.json()) as { response?: string };
      return json.response ?? '';
    } catch (e: unknown) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const delay = jitteredBackoff(300, attempt, 4000);
      console.warn(`[ollama-client] attempt ${attempt} failed: ${msg} (retrying in ${delay}ms)`);
      if (attempt <= retries) await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}