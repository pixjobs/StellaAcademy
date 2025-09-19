// src/lib/firebase/admin.ts
import 'server-only';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  // Uses the project of the current runtime via ADC
  // (metadata server on GCP/Cloud Run/Firebase, or GOOGLE_APPLICATION_CREDENTIALS locally)
  initializeApp({ credential: applicationDefault() });
}

export const db = getFirestore();
