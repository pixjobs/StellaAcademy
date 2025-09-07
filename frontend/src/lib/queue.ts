import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// This is the crucial part. It will automatically parse the REDIS_URL from the environment.
// If process.env.REDIS_URL is not found, it falls back to a default.
export const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // Recommended for BullMQ
});

// Use the LLM_QUEUE_NAME from your .env.local or a default
export const LLM_QUEUE_NAME = process.env.LLM_QUEUE_NAME || 'llm-queue';

export const llmQueue = new Queue(LLM_QUEUE_NAME, { connection });

// Your worker.ts should also import and use this same LLM_QUEUE_NAME