/**
 * =========================================================================
 * APPLICATION BOOTSTRAPPER
 *
 * Runs FIRST. Loads env files, enables tsconfig path aliases, and optionally
 * pulls additional configuration from GCP Secret Manager.
 * =========================================================================
 */

import 'tsconfig-paths/register'; // ensure "@/..." aliases work in worker
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { loadConfigFromSecrets } from './ollama-client';
import { getSecret } from '@/lib/secrets'; // uses your fail-soft Secret Manager helper

/* ------------------------------ helpers --------------------------------- */

function mask(val?: string, show = 3) {
  if (!val) return '(unset)';
  if (val.length <= show + 2) return `${val[0]}***`;
  return `${val.slice(0, show)}***${val.slice(-2)}`;
}

function loadEnvFiles() {
  // Prefer .env.local if present, otherwise .env
  const root = process.cwd();
  const dotEnvLocal = path.resolve(root, '.env.local');
  const dotEnv = path.resolve(root, '.env');

  if (fs.existsSync(dotEnvLocal)) {
    dotenv.config({ path: dotEnvLocal });
    return { path: dotEnvLocal, kind: '.env.local' };
  }

  if (fs.existsSync(dotEnv)) {
    dotenv.config({ path: dotEnv });
    return { path: dotEnv, kind: '.env' };
  }

  // Nothing found — still OK; environment may come from the host
  dotenv.config();
  return { path: '(none found)', kind: '(process env only)' };
}

/* ------------------------- optional: diagnostics ------------------------- */

// Non-fatal check that "@/lib/search" can be resolved by the runtime.
// This does NOT call the network; it only imports the module and prints its keys.
async function checkSearchModuleResolvable() {
  try {
    const mod: any = await import('@/lib/search');
    const keys = Object.keys(mod || {});
    const hasFn =
      typeof mod?.googleCustomSearch === 'function' ||
      typeof mod?.default?.googleCustomSearch === 'function' ||
      typeof mod?.default === 'function';
    console.log('[bootstrap] search module found:', {
      exportKeys: keys,
      hasCallable:
        hasFn ? 'yes (googleCustomSearch detected)' : 'no callable export',
    });
  } catch (e) {
    console.warn(
      '[bootstrap] ⚠️ search module not resolvable (alias or file missing). Web enrichment will be skipped.',
      (e as Error)?.message || e
    );
  }
}

/* -------------------------------- boot ---------------------------------- */

export async function bootstrap() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║           BOOTSTRAP & ENV CHECK          ║');
  console.log('╚══════════════════════════════════════════╝');

  const used = loadEnvFiles();
  console.log(`[dotenv] Loaded: ${used.kind}  @  ${used.path}`);

  // Light summary (avoid printing secrets)
  const summary = {
    NODE_ENV: process.env.NODE_ENV || '(unset)',
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '(unset)',
    REDIS_URL: mask(process.env.REDIS_URL),
    OLLAMA_HOST: process.env.OLLAMA_HOST || '(unset)',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || '(unset)',
    ENABLE_WEB_ENRICH: process.env.ENABLE_WEB_ENRICH ?? '(unset)',
    GOOGLE_CUSTOM_SEARCH_KEY: mask(process.env.GOOGLE_CUSTOM_SEARCH_KEY),
    GOOGLE_CUSTOM_SEARCH_CX: mask(process.env.GOOGLE_CUSTOM_SEARCH_CX),
  };
  console.log('[env] summary:', summary);

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    console.warn(
      '[bootstrap] ⚠️ GOOGLE_CLOUD_PROJECT is not set. Secret Manager lookups may return empty strings (fail-soft).'
    );
  }

  // 1) Best-effort secret loading for Ollama (and anything you already do there)
  try {
    await loadConfigFromSecrets();
    console.log('[bootstrap] ✅ Secrets loaded (ollama-client).');
  } catch (err: any) {
    console.warn(
      '[bootstrap] ⚠️ Non-fatal: loadConfigFromSecrets() failed. Continuing with existing env.',
      err?.message || err
    );
  }

  // 2) Warm Google Custom Search secrets (fail-soft). If they exist in Secret
  //    Manager and env is not set, mirror into process.env so modules that read
  //    env directly will work seamlessly.
  try {
    const key =
      process.env.GOOGLE_CUSTOM_SEARCH_KEY ||
      (await getSecret('google-custom-search-key'));
    const cx =
      process.env.GOOGLE_CUSTOM_SEARCH_CX ||
      (await getSecret('google-custom-search-cx'));

    if (key && !process.env.GOOGLE_CUSTOM_SEARCH_KEY) {
      process.env.GOOGLE_CUSTOM_SEARCH_KEY = key;
    }
    if (cx && !process.env.GOOGLE_CUSTOM_SEARCH_CX) {
      process.env.GOOGLE_CUSTOM_SEARCH_CX = cx;
    }

    console.log('[bootstrap] Google Custom Search:', {
      key: mask(process.env.GOOGLE_CUSTOM_SEARCH_KEY),
      cx: mask(process.env.GOOGLE_CUSTOM_SEARCH_CX),
    });
  } catch (e) {
    console.warn(
      '[bootstrap] ⚠️ Failed to warm Google Custom Search secrets (continuing):',
      (e as Error)?.message || e
    );
  }

  // 3) Optional: confirm the search module is resolvable (path alias & export shape)
  await checkSearchModuleResolvable();

  console.log('--------------------------------------------\n');
}
