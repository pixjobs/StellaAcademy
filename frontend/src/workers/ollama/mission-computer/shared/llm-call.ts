/* eslint-disable no-console */
/**
 * Hardened LLM caller with:
 * - In-process bottleneck (requireBottleneck) to cap concurrency
 * - Queue overflow guard (LLM_QUEUE_MAX)
 * - Soft/Hard timeouts
 * - Small retry with exponential backoff
 * - Back-compat aliases + a convenient makeLlmCall(context, defaults) factory
 */

import type { WorkerContext } from '../../context';
import { callOllama } from '../../ollama-client';
import { requireBottleneck, logger } from './core';

/** Minimal shape we rely on from the bottleneck. */
export type Bottleneck = {
  submit<T>(fn: () => Promise<T>): Promise<T>;
  readonly queued?: number;
  readonly running?: number;
  drainQueue?(): number;
};

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const LLM_TIMEOUT_MS   = intEnv('LLM_TIMEOUT_MS', 18_000); // hard cap default
const LLM_MAX_RETRIES  = intEnv('LLM_MAX_RETRIES', 1);
const LLM_QUEUE_MAX    = intEnv('LLM_QUEUE_MAX', 20);
const LLM_BACKOFF_CAP  = intEnv('LLM_BACKOFF_CAP', 4_000);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function backoffDelay(attempt: number, cap = LLM_BACKOFF_CAP): number {
  const base = Math.min(1200 * 2 ** Math.max(0, attempt - 1), cap);
  return Math.floor(Math.random() * base);
}

export type LlmCallOptions = {
  temperature?: number;
  /** label used in logs; `tag` kept as an alias for back-compat */
  label?: string;
  tag?: string;

  /** Optional timeouts (ms) */
  softMs?: number;  // advisory: logs when exceeded
  hardMs?: number;  // absolute timeout (defaults to LLM_TIMEOUT_MS)

  /** Retry count override */
  maxRetries?: number;

  /** Optional external concurrency gate (tests, custom gates) */
  concurrencyGate?: Bottleneck;

  /** Accepted but unused here (API compatibility) */
  dedupeTrackerKey?: string;
};

function getGate(context: WorkerContext, override?: Bottleneck): Bottleneck {
  const gate = override ?? (requireBottleneck(context) as Bottleneck);
  const queued = typeof gate.queued === 'number' ? gate.queued : 0;
  const running = typeof gate.running === 'number' ? gate.running : 0;

  if (queued >= LLM_QUEUE_MAX) {
    const err = new Error('LLM_QUEUE_OVERFLOW');
    (err as any).code = 'LLM_QUEUE_OVERFLOW';
    logger.warn('[LLM] queue overflow — rejecting new request', {
      queued, running, limit: LLM_QUEUE_MAX,
    });
    throw err;
  }
  return gate;
}

/** Core call (with concurrency, timeout, retry). Returns raw LLM string. */
export async function callWithBottleneck(
  context: WorkerContext,
  prompt: string,
  opts: LlmCallOptions = {},
): Promise<string> {
  const gate = getGate(context, opts.concurrencyGate);
  const temperature = opts.temperature ?? 0.7;
  const hardCap = Math.max(1_000, opts.hardMs ?? LLM_TIMEOUT_MS);
  const softCap = typeof opts.softMs === 'number' && opts.softMs > 0 ? opts.softMs : null;
  const maxRetries = Math.max(0, opts.maxRetries ?? LLM_MAX_RETRIES);
  const label = opts.label ?? opts.tag ?? 'llm';

  let attempt = 0;
  for (;;) {
    let softTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (softCap) {
        softTimer = setTimeout(() => {
          logger.warn('[LLM] soft timeout exceeded', { label, softMs: softCap });
        }, softCap);
      }

      const p: Promise<string> = gate.submit<string>(() =>
        callOllama(prompt, { temperature }) as Promise<string>
      );

      const timed: Promise<string> = Promise.race<string>([
        p,
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('LLM_TIMEOUT')), hardCap),
        ),
      ]);

      const out = await timed;
      return typeof out === 'string' ? out : String(out ?? '');
    } catch (e) {
      const code = (e as any)?.code ?? (e as Error)?.message;
      const msg  = (e as Error)?.message ?? String(e);
      const canRetry = attempt < maxRetries && msg !== 'LLM_QUEUE_OVERFLOW';

      logger.warn(`[LLM] ${label} failed${canRetry ? ' — retrying' : ''}`, {
        attempt: attempt + 1, max: maxRetries + 1, code, msg,
      });

      if (!canRetry) throw e;
      attempt++;
      await sleep(backoffDelay(attempt));
    } finally {
      if (softTimer) clearTimeout(softTimer);
    }
  }
}

/** Parses first JSON array from the LLM output (or returns []). */
export async function callJsonArrayWithBottleneck<T = unknown>(
  context: WorkerContext,
  prompt: string,
  opts: LlmCallOptions = {},
): Promise<T[]> {
  const raw = await callWithBottleneck(context, prompt, opts);
  try {
    const firstBracket = raw.indexOf('[');
    const lastBracket  = raw.lastIndexOf(']');
    const jsonish = firstBracket >= 0 && lastBracket > firstBracket
      ? raw.slice(firstBracket, lastBracket + 1)
      : raw;
    const parsed = JSON.parse(jsonish);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Back-compat + ergonomic factory                                             */
/* -------------------------------------------------------------------------- */

/** Alias expected by some missions (e.g., rocketLab). */
export async function llmCall(
  context: WorkerContext,
  prompt: string,
  opts: LlmCallOptions = {},
): Promise<string> {
  return callWithBottleneck(context, prompt, opts);
}

export type LlmCaller = {
  /** Perform a single LLM call with optional overrides. */
  call: (prompt: string, opts?: LlmCallOptions) => Promise<string>;
  /** JSON array helper bound to the same defaults. */
  callArray: <T = unknown>(prompt: string, opts?: LlmCallOptions) => Promise<T[]>;
  /** Queue stats (if the underlying gate exposes counters). */
  stats: () => { queued?: number; running?: number };
};

/**
 * Factory: create a caller bound to a context and default options.
 * Usage:
 *   const llm = makeLlmCall(context, { softMs: 6000, hardMs: 25000, tag: 'space' });
 *   const out = await llm.call(prompt, { temperature: 0.85 });
 */
export function makeLlmCall(context: WorkerContext, defaults: LlmCallOptions = {}): LlmCaller {
  return {
    call: (prompt, opts = {}) =>
      callWithBottleneck(context, prompt, { ...defaults, ...opts }),
    callArray: <T = unknown>(prompt: string, opts: LlmCallOptions = {}) =>
      callJsonArrayWithBottleneck<T>(context, prompt, { ...defaults, ...opts }),
    stats: () => {
      const gate = getGate(context, defaults.concurrencyGate);
      return {
        queued:  typeof gate.queued  === 'number' ? gate.queued  : undefined,
        running: typeof gate.running === 'number' ? gate.running : undefined,
      };
    },
  };
}

/** Optional tiny helper for logging queue stats without breaking types. */
export function getQueueStats(context: WorkerContext, override?: Bottleneck) {
  const gate = getGate(context, override);
  return {
    queued:  typeof gate.queued  === 'number' ? gate.queued  : undefined,
    running: typeof gate.running === 'number' ? gate.running : undefined,
  };
}
