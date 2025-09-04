/**
 * =========================================================================
 * APPLICATION BOOTSTRAPPER
 *
 * This is the FIRST file that should be executed. Its sole responsibility
 * is to load the environment configuration and validate it.
 * It ensures that by the time the main application logic runs, all
 * necessary configuration is loaded and ready.
 * =========================================================================
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { loadConfigFromSecrets } from './ollama-client';

// Explicitly load the .env.local file from the project root.
// This is more robust than relying on the default behavior.
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

/**
 * The main bootstrap function. It loads dotenv, checks it, then loads secrets.
 * It will throw a fatal error and exit if configuration fails.
 */
export async function bootstrap() {
  // --- Definitive .env.local Debugger ---
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║           BOOTSTRAP & ENV CHECK          ║');
  console.log('╚══════════════════════════════════════════╝');
  
  if (process.env.GOOGLE_CLOUD_PROJECT) {
    console.log(`[dotenv] ✅ SUCCESS: .env.local loaded! GOOGLE_CLOUD_PROJECT = "${process.env.GOOGLE_CLOUD_PROJECT}"`);
  } else {
    console.error('[dotenv] 🔴 FAILED: .env.local was NOT loaded or is missing GOOGLE_CLOUD_PROJECT.');
    console.error(`[dotenv]   > Checked path: ${envPath}`);
    console.error('[dotenv]   > Please ensure the file exists and the variable is set.');
    // Exit immediately if the core .env file isn't working.
    process.exit(1);
  }
  console.log('--------------------------------------------');

  try {
    // Now that dotenv is confirmed to be loaded, run the secret loader.
    await loadConfigFromSecrets();
  } catch (err: any) {
    console.error('\n🔴🔴🔴 A FATAL ERROR OCCURRED DURING CONFIGURATION 🔴🔴🔴');
    console.error(err.message);
    console.error('[bootstrap] The worker cannot start without a valid configuration. Exiting.');
    process.exit(1);
  }
}