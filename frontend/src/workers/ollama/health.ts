// src/workers/ollama/health.ts
import http from 'http';
import IORedis, { Redis } from 'ioredis';
import { resolveRedisUrl } from '@/lib/secrets';

/**
 * Start an HTTP server that Cloud Run can use for health checks.
 * Optionally accepts a getter for the primary Redis client
 * so we don’t create unnecessary new clients.
 */
export function startHealthServer(getPrimaryClient?: () => Redis | null) {
  const port = Number(process.env.PORT || 8080);

  const server = http.createServer(async (_req, res) => {
    let tempClient: Redis | null = null;

    try {
      // Try reusing the main connection if available
      const existing = getPrimaryClient?.();
      const client =
        existing && existing.status === 'ready'
          ? existing
          : (tempClient = await makeTempRedis());

      await client.ping();

      if (tempClient) {
        await tempClient.quit();
      }

      res.writeHead(200).end('ok');
    } catch (e) {
      if (tempClient) {
        try { await tempClient.quit(); } catch {}
      }
      console.error('[health] Health check failed:', e instanceof Error ? e.message : String(e));
      res.writeHead(500).end('fail');
    }
  });

  server.listen(port, () => {
    console.log(`[worker] Health check server listening on port ${port}`);
  });

  return server;
}

async function makeTempRedis(): Promise<Redis> {
  const url = await resolveRedisUrl();
  if (!url) throw new Error('REDIS_URL (online/local) could not be resolved');
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
