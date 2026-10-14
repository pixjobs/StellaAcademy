import { Firestore } from '@google-cloud/firestore';

let db: Firestore | null = null;

/**
 * The project's (default) Firestore database (eur3). On Cloud Run the service
 * account's credentials and project are picked up automatically; locally, sign
 * in with `gcloud auth application-default login` and set GOOGLE_CLOUD_PROJECT.
 */
export function firestore(): Firestore {
  db ??= new Firestore({ ignoreUndefinedProperties: true });
  return db;
}
