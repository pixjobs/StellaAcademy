import { Firestore } from '@google-cloud/firestore';
import { getLlmBottleneck } from './llm-bottleneck';
import { getNasaApiKey } from '@/lib/secrets';

/**
 * The context for the serverless worker.
 * It provides access to shared resources like the database and LLM rate limiter.
 * Redis has been completely removed.
 */
export interface WorkerContext {
  db: Firestore;
  llmBottleneck: ReturnType<typeof getLlmBottleneck>;
  nasaKeyPresent: boolean;
}

function mask(val?: string): string {
  if (!val) return '(unset)';
  return val.length <= 6 ? '******' : `${val.slice(0, 2)}***${val.slice(-2)}`;
}

/**
 * Initializes the context for the serverless worker. This function is designed
 * to run once per container instance (during a cold start on Cloud Run).
 */
export async function initializeContext(): Promise<WorkerContext> {
  // 1) Firestore (uses GOOGLE_CLOUD_PROJECT creds/ADC)
  // This is now a primary component for storing job results.
  const db = new Firestore();

  // 2) LLM bottleneck singleton (still required to manage concurrency to Ollama)
  const llmBottleneck = getLlmBottleneck();
  if (!llmBottleneck || typeof llmBottleneck.submit !== 'function') {
    throw new Error('[context] llmBottleneck missing submit()');
  }

  // 3) Resolve NASA key via lib/secrets (authoritative)
  const nasaKey = await getNasaApiKey();
  const nasaKeyPresent = typeof nasaKey === 'string' && nasaKey.trim().length > 0;

  // Backfill env var for any legacy paths still reading process.env
  if (nasaKeyPresent && !process.env.NASA_API_KEY) {
    process.env.NASA_API_KEY = nasaKey;
  }

  console.log(
    '[context] Created for serverless environment. nasaKeyPresent=%s (NASA_API_KEY=%s)',
    String(nasaKeyPresent),
    mask(process.env.NASA_API_KEY),
  );

  return { db, llmBottleneck, nasaKeyPresent };
}