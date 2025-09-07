import http from 'http';
// CHANGED: Removed 'type' to import the class value, not just the type.
import IORedis from 'ioredis';
import { connection as bullConnection } from '@/lib/queue';

// This function creates a temporary Redis client if the exported `connection`
// is not already a client instance. It's a robust fallback.
// CHANGED: The return type is now simply 'IORedis', the class instance type.
function makeTempRedis(): IORedis {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not defined in the environment');
  
  // Use BullMQ-friendly defaults for the temporary client
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

// This function starts the HTTP server that Cloud Run will use for health checks.
export function startHealthServer() {
  // Cloud Run provides the PORT environment variable automatically.
  const port = Number(process.env.PORT || 8080);

  const server = http.createServer(async (_req, res) => {
    // CHANGED: The variable type is now 'IORedis'.
    let tempClient: IORedis | null = null;
    try {
      // This logic now works because `IORedis` is a runtime value.
      const client =
        bullConnection instanceof IORedis ? bullConnection : (tempClient = makeTempRedis());

      // It performs a lightweight check to ensure Redis is responsive.
      await client.ping();
      
      // Clean up the temporary client if one was created.
      if (tempClient) {
        await tempClient.quit();
      }
      
      res.writeHead(200).end('ok');
    } catch (e) {
      // If the ping fails, clean up and signal failure to Cloud Run.
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
  
  // Return the server instance so it can be gracefully shut down.
  return server;
}