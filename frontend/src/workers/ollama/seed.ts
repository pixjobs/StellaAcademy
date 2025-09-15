/* eslint-disable no-console */
import { initializeContext } from './context';
import { runLibraryMaintenance } from './mission-library';
import { loadConfigFromSecrets } from './ollama-client';

async function runSeed() {
  console.log('--- Starting Production Seeding and Library Enrichment ---');

  try {
    await loadConfigFromSecrets();
    const context = await initializeContext();

    // --- FIX: Call the correct, exported function name ---
    // The `isFirstBoot = true` flag ensures it performs a thorough check.
    await runLibraryMaintenance(context, true);

    console.log('--- Seeding and Enrichment Process Completed Successfully ---');
    
    // Allow a moment for any asynchronous logging to complete before exiting.
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.exit(0);

  } catch (err) {
    console.error('--- FATAL: Seeding and Enrichment Process Failed ---');
    console.error(err);
    process.exit(1);
  }
}

runSeed();