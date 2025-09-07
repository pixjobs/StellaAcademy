// src/lib/secrets.ts

/**
 * @file This module provides a unified and safe way to access secrets.
 * It is designed to work seamlessly in different environments:
 * - Next.js Server Components / API Routes
 * - Edge Middleware / Workers
 * - Local Development
 *
 * It follows a specific precedence for resolving secret values:
 * 1. Environment Variables (e.g., process.env.MY_SECRET_KEY)
 * 2. In-memory Cache (to reduce redundant lookups in a single server instance)
 * 3. Google Cloud Secret Manager (for production and staging environments)
 *
 * CRITICAL: This module should NEVER import 'server-only' as it needs to be
 * tree-shaken correctly to avoid shipping server code to the client. The logic
 * inside handles the environment checks safely.
 */

import type { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// The SecretManagerServiceClient instance is loaded lazily to avoid bundling it on the client.
let smClient: SecretManagerServiceClient | null = null;
// A simple in-memory cache to prevent refetching secrets from GCP on every call.
const cache: Record<string, string> = {};

/**
 * Checks if the code is currently running in a browser environment.
 * @returns {boolean} True if in a browser, false otherwise.
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Lazily initializes and returns a singleton instance of the Secret Manager client.
 * This function uses a dynamic import() to ensure the '@google-cloud/secret-manager'
 * module is never included in the client-side bundle.
 * @returns {Promise<SecretManagerServiceClient | null>} The client instance or null if unavailable/in browser.
 */
async function getSecretManagerClient(): Promise<SecretManagerServiceClient | null> {
  if (isBrowser()) {
    return null;
  }
  if (smClient) {
    return smClient;
  }

  try {
    // Dynamic import is the key to preventing this server-side dependency from
    // being bundled into client-side code.
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    smClient = new SecretManagerServiceClient();
    return smClient;
  } catch (err) {
    console.warn(
      '[secrets] Google Secret Manager client is unavailable. This is expected in local development if the library is not installed or credentials are not set. Falling back to environment variables.',
      (err as Error)?.message || err
    );
    return null;
  }
}

/**
 * Fetches a secret value by its canonical name.
 * The function searches for the secret in the following order:
 * 1. Environment Variable: Checks for a variable named by converting the secret name
 *    from 'kebab-case' to 'UPPER_SNAKE_CASE' (e.g., 'my-secret' -> 'MY_SECRET').
 * 2. In-memory Cache: Returns the cached value if available (server-side only).
 * 3. GCP Secret Manager: Fetches the secret from GCP using its canonical name (server-side only).
 *
 * @param {string} name - The canonical name of the secret (e.g., 'nasa-api-key' or 'GOOGLE_CUSTOM_SEARCH_KEY').
 * @returns {Promise<string>} The secret value. Returns an empty string ('') if the secret
 *          cannot be found in any of the sources, allowing the application to fail gracefully.
 */
export async function getSecret(name: string): Promise<string> {
  // 1. Check Environment Variables (works everywhere)
  // Converts a name like 'nasa-api-key' to 'NASA_API_KEY'.
  // If the name is already 'GOOGLE_CUSTOM_SEARCH_KEY', it remains unchanged.
  const envKey = name.replace(/-/g, '_').toUpperCase();
  const fromEnv = process.env[envKey];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }

  // --- Server-Side Logic Begins Here ---
  // If we are in a browser, we've already checked process.env, so we can stop.
  if (isBrowser()) {
    return '';
  }

  // 2. Check In-Memory Cache (server-side only)
  if (cache[name]) {
    return cache[name];
  }

  // 3. Fetch from GCP Secret Manager (server-side only)
  try {
    // This env var is automatically set in most Google Cloud environments.
    // For local development, it must be set in your .env.local file.
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    if (!project) {
      // This is a common misconfiguration, so we provide a clear warning.
      console.warn(`[secrets] GOOGLE_CLOUD_PROJECT env var is not set. Cannot look up '${name}' in Secret Manager.`);
      return '';
    }

    const client = await getSecretManagerClient();
    if (!client) {
      // The reason for the client being unavailable will have been logged in getSecretManagerClient().
      return '';
    }

    const secretPath = `projects/${project}/secrets/${name}/versions/latest`;
    const [response] = await client.accessSecretVersion({ name: secretPath });
    const value = response.payload?.data?.toString('utf8') || '';

    if (!value) {
      console.warn(`[secrets] Secret '${name}' was found in Secret Manager but its value is empty.`);
      return '';
    }

    // Cache the successfully fetched secret to avoid future lookups.
    cache[name] = value;
    return value;
  } catch (err: any) {
    // Prettify common errors for better debuggability.
    if (err.code === 5) { // 'NOT_FOUND' error code
      console.warn(`[secrets] Secret '${name}' was not found in Secret Manager for project '${process.env.GOOGLE_CLOUD_PROJECT}'.`);
    } else if (err.code === 7) { // 'PERMISSION_DENIED' error code
      console.error(`🔴 [secrets] PERMISSION DENIED when trying to access secret '${name}'. Ensure the service account has the 'Secret Manager Secret Accessor' role.`);
    } else {
      console.error(`🔴 [secrets] Failed to fetch secret '${name}' from Secret Manager:`, err);
    }
    return '';
  }
}

/* ========================================================================== */
/*                  DOMAIN-SPECIFIC, CONVENIENCE ACCESSORS                    */
/* ========================================================================== */
// Using specific accessor functions is a best practice. It makes the code
// more readable and reduces the chance of typos in secret names.

export async function getNasaApiKey(): Promise<string> {
  // This uses a kebab-case name, which is a common convention.
  return getSecret('nasa-api-key');
}

export async function getGoogleCustomSearchKey(): Promise<string> {
  // Using the original UPPER_SNAKE_CASE name as requested.
  // This will work for both environment variables and Secret Manager,
  // as long as the name is consistent in both places.
  return getSecret('GOOGLE_CUSTOM_SEARCH_KEY');
}

export async function getGoogleCustomSearchCx(): Promise<string> {
  // --- BUG FIX ---
  // This now correctly fetches its own secret instead of the search key's secret.
  // The original name is preserved as requested.
  return getSecret('GOOGLE_CUSTOM_SEARCH_CX');
}