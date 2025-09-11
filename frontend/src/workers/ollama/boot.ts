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
import { getSecret } from '@/lib/secrets';

/* ------------------------------ helpers --------------------------------- */

// THIS IS THE MASK FUNCTION YOU NEED
function mask(val?: string, show = 3) {
  if (!val) return '(unset)';
  if (val.length <= show + 2) return `${val[0]}***`;
  return `${val.slice(0, show)}***${val.slice(-2)}`;
}

// THIS IS THE loadEnvFiles FUNCTION YOU NEED
function loadEnvFiles() {
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

  dotenv.config();
  return { path: '(none found)', kind: '(process env only)' };
}

/* ------------------------- optional: diagnostics ------------------------- */

// Define the expected shape of the module to avoid using `any`.
interface SearchModule {
  googleCustomSearch?: (...args: never[]) => unknown;
  default?: ((...args: never[]) => unknown) | { googleCustomSearch?: (...args: never[]) => unknown };
}

// THIS IS THE checkSearchModuleResolvable FUNCTION YOU NEED
async function checkSearchModuleResolvable() {
  try {
    // FIX for 'Unexpected any': Cast the dynamic import to our defined interface.
    const mod = (await import('@/lib/search')) as SearchModule;
    const keys = Object.keys(mod || {});
    const hasFn =
      typeof mod?.googleCustomSearch === 'function' ||
      (typeof mod?.default === 'function') ||
      (typeof mod?.default === 'object' && mod.default !== null && typeof mod.default.googleCustomSearch === 'function');
      
    console.log('[bootstrap] search module found:', {
      exportKeys: keys,
      hasCallable:
        hasFn ? 'yes (googleCustomSearch detected)' : 'no callable export',
    });
  } catch (e: unknown) {
    console.warn(
      '[bootstrap] ⚠️ search module not resolvable (alias or file missing). Web enrichment will be skipped.',
      (e as Error)?.message || e
    );
  }
}

/* -------------------------------- boot ---------------------------------- */

// THIS IS THE NEW, FASTER BOOTSTRAP FUNCTION
export async function bootstrap() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║           BOOTSTRAP & ENV CHECK          ║');
  console.log('╚══════════════════════════════════════════╝');

  // --- Step 1: Handle synchronous setup first ---
  const used = loadEnvFiles(); // This will now work
  console.log(`[dotenv] Loaded: ${used.kind}  @  ${used.path}`);

  const summary = {
    NODE_ENV: process.env.NODE_ENV || '(unset)',
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || '(unset)',
    REDIS_URL: mask(process.env.REDIS_URL), // This will now work
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

  // --- Step 2: Fire off all async operations in parallel ---
  console.log('[bootstrap] Warming secrets and checking modules in parallel...');

  const [
    ollamaResult,
    searchKeyResult,
    searchCxResult,
    searchModuleResult,
  ] = await Promise.allSettled([
    loadConfigFromSecrets(),
    getSecret('google-custom-search-key'),
    getSecret('google-custom-search-cx'),
    checkSearchModuleResolvable(), // This will now work
  ]);

  // --- Step 3: Process the results of the parallel operations ---

  if (ollamaResult.status === 'fulfilled') {
    console.log('[bootstrap] ✅ Secrets loaded (ollama-client).');
  } else {
    console.warn(
      '[bootstrap] ⚠️ Non-fatal: loadConfigFromSecrets() failed. Continuing with existing env.',
      (ollamaResult.reason as Error)?.message || ollamaResult.reason
    );
  }

  if (searchKeyResult.status === 'fulfilled' && searchKeyResult.value && !process.env.GOOGLE_CUSTOM_SEARCH_KEY) {
    process.env.GOOGLE_CUSTOM_SEARCH_KEY = searchKeyResult.value;
  }
  if (searchCxResult.status === 'fulfilled' && searchCxResult.value && !process.env.GOOGLE_CUSTOM_SEARCH_CX) {
    process.env.GOOGLE_CUSTOM_SEARCH_CX = searchCxResult.value;
  }

  if (searchKeyResult.status === 'rejected') {
     console.warn('[bootstrap] ⚠️ Failed to warm GOOGLE_CUSTOM_SEARCH_KEY secret:', (searchKeyResult.reason as Error)?.message);
  }
   if (searchCxResult.status === 'rejected') {
     console.warn('[bootstrap] ⚠️ Failed to warm GOOGLE_CUSTOM_SEARCH_CX secret:', (searchCxResult.reason as Error)?.message);
  }
  
  console.log('[bootstrap] Google Custom Search:', {
    key: mask(process.env.GOOGLE_CUSTOM_SEARCH_KEY),
    cx: mask(process.env.GOOGLE_CUSTOM_SEARCH_CX),
  });

  if (searchModuleResult.status === 'rejected') {
      console.warn('[bootstrap] ⚠️ The checkSearchModuleResolvable() promise failed unexpectedly.', searchModuleResult.reason);
  }

  console.log('--------------------------------------------\n');
}