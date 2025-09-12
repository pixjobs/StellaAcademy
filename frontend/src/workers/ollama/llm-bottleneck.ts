// workers/ollama/llm-bottleneck.ts

import { clampInt } from './utils'; // Assuming utils.ts is in the same directory

// This module ensures we only send a limited number of requests to Ollama at once,
// regardless of how many concurrent jobs the worker is processing.
class LlmBottleneck {
  private queue: (() => void)[] = [];
  private activeRequests = 0;
  private readonly concurrency: number;

  constructor() {
    // Limit concurrent requests to Ollama to a safe number (e.g., 2 or 4).
    // This value should be much lower than your interactive worker concurrency.
    this.concurrency = clampInt(process.env.OLLAMA_API_CONCURRENCY, 1, 4, 2);
    console.log(`[bottleneck] Ollama concurrency limited to ${this.concurrency}`);
  }

  private next() {
    if (this.activeRequests >= this.concurrency || this.queue.length === 0) {
      return;
    }
    this.activeRequests++;
    const task = this.queue.shift();
    if (task) {
      task();
    }
  }

  public async submit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.next();
        }
      };
      this.queue.push(task);
      this.next();
    });
  }
}

// Create a singleton instance for the entire worker process
export const llmBottleneck = new LlmBottleneck();