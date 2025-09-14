// workers/ollama/llm-bottleneck.ts
// A minimal in-process concurrency gate for LLM calls.
// - No imports (avoids circular init issues)
// - Lazy singleton (safer module evaluation)
// - Clear guards and small diagnostics

/* eslint-disable no-console */

// ---- tiny local helpers (avoid importing utils) ----
function clampInt(
  raw: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

type Task = () => void;

class LlmBottleneck {
  private queue: Task[] = [];
  private activeRequests = 0;
  private readonly concurrency: number;

  constructor() {
    this.concurrency = clampInt(process.env.OLLAMA_API_CONCURRENCY, 1, 16, 2);
    // Log once at construction so you can confirm which build is live
    console.log(`[bottleneck] Ollama concurrency limited to ${this.concurrency}`);
  }

  private next(): void {
    if (this.activeRequests >= this.concurrency) return;
    const task = this.queue.shift();
    if (!task) return;
    this.activeRequests++;
    // Run on microtask to avoid deep sync recursion if submit() is nested
    queueMicrotask(task);
  }

  /** Enqueue a promise-returning function; resolves with that function’s result. */
  public submit<T>(fn: () => Promise<T>): Promise<T> {
    if (typeof fn !== 'function') {
      throw new TypeError('[bottleneck] submit() expects a function returning a Promise');
    }

    return new Promise<T>((resolve, reject) => {
      const run = async (): Promise<void> => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.activeRequests--;
          this.next();
        }
      };
      this.queue.push(run);
      this.next();
    });
  }

  /** Number of tasks currently executing (≤ concurrency). */
  public get running(): number {
    return this.activeRequests;
  }

  /** Number of tasks queued (not yet started). */
  public get queued(): number {
    return this.queue.length;
  }

  /** Convenience: returns true if nothing is running or queued. */
  public get idle(): boolean {
    return this.activeRequests === 0 && this.queue.length === 0;
  }

  /**
   * Best-effort drain: clears queued (not-yet-started) tasks.
   * Running tasks continue and will release slots as they finish.
   */
  public drainQueue(): number {
    const removed = this.queue.length;
    this.queue.length = 0;
    return removed;
  }
}

// ---- lazy singleton (avoids undefined due to circular module evaluation) ----
let _instance: LlmBottleneck | null = null;

/** Obtain the process-wide bottleneck instance. */
export function getLlmBottleneck(): LlmBottleneck {
  if (_instance === null) {
    _instance = new LlmBottleneck();
  }
  return _instance;
}
