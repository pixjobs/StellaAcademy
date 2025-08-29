import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
let cachedKey: string | null = null;

export async function getNasaApiKey(): Promise<string> {
  // Prefer env (e.g., Cloud Run --set-secrets)
  if (process.env.NASA_API_KEY) return process.env.NASA_API_KEY;
  if (cachedKey) return cachedKey;
  const project = process.env.GOOGLE_CLOUD_PROJECT!;
  const [res] = await client.accessSecretVersion({
    name: `projects/${project}/secrets/nasa-api-key/versions/latest`,
  });
  cachedKey = res.payload?.data?.toString('utf8') ?? '';
  return cachedKey;
}

