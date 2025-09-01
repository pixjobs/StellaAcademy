// src/lib/nasa.ts (or wherever you keep this function)
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
let cachedKey: string | null = null;

export async function getNasaApiKey(): Promise<string> {
  // 1. Check for a running environment variable first.
  if (process.env.NASA_API_KEY) {
    console.log('Using NASA_API_KEY from environment variable.');
    return process.env.NASA_API_KEY;
  }

  // 2. Check in-memory cache.
  if (cachedKey) {
    console.log('Using cached NASA API key.');
    return cachedKey;
  }

  // --- Start of Secret Manager Logic with Debugging ---
  console.log('No cached key. Attempting to fetch from Google Cloud Secret Manager...');

  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) {
      // This is a critical failure. The function cannot proceed.
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set.');
    }

    const secretName = `projects/${project}/secrets/nasa-api-key/versions/latest`;
    console.log(`Accessing secret: ${secretName}`);

    const [response] = await client.accessSecretVersion({ name: secretName });

    // 3. Validate the response from Secret Manager.
    const key = response.payload?.data?.toString('utf8');
    if (!key) {
      // This prevents silent failures.
      throw new Error('Fetched secret payload is empty or invalid.');
    }

    console.log('Successfully fetched and cached NASA API key from Secret Manager.');
    cachedKey = key;
    return cachedKey;

  } catch (error) {
    // 4. Log the specific error to your server console. This is the most important part!
    console.error('🔴 FAILED to fetch NASA API key from Secret Manager:', error);

    // Return an empty string to allow the app to fall back to DEMO_KEY, but log the failure.
    return '';
  }
}