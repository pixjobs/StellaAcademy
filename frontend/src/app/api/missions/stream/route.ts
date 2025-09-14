import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import type { EnrichedMissionPlan } from '@/types/mission';
import { getQueue, BACKGROUND_QUEUE_NAME } from '@/lib/queue';

/* ─────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */
type FastStatus = 'ready' | 'stale' | 'queued' | 'missing' | 'error';

type FastReady = {
  status: Extract<FastStatus, 'ready' | 'stale'>;
  plan: EnrichedMissionPlan;
  jobId?: string;
};
type FastQueued = {
  status: 'queued';
  jobId: string;
  plan?: EnrichedMissionPlan;
};
type FastMissing = { status: 'missing' };
type FastError = { status: 'error'; error?: string };

type ResponseBody = FastReady | FastQueued | FastMissing | FastError;

type DocShape = {
  plan: EnrichedMissionPlan;
  updatedAt: FirebaseFirestore.Timestamp;
  mission: string;
  role: string;
  hash?: string;
};

/* ─────────────────────────────────────────────────────────
   Small utils
────────────────────────────────────────────────────────── */
const json = (data: ResponseBody, status = 200): NextResponse =>
  NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

const hashId = (o: unknown): string =>
  crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');

const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null;

const isMissionPlan = (x: unknown): x is EnrichedMissionPlan =>
  isRecord(x) &&
  typeof x.missionTitle === 'string' &&
  Array.isArray(x.topics);

/* ─────────────────────────────────────────────────────────
   Firebase Admin
────────────────────────────────────────────────────────── */
if (getApps().length === 0) {
  try {
    initializeApp({ credential: applicationDefault() });
  } catch {
    // Fallback for environments where default credentials might not be set up initially.
    if (getApps().length === 0) {
      initializeApp();
    }
  }
}
const db = getFirestore();

/* ─────────────────────────────────────────────────────────
   Firestore helpers
────────────────────────────────────────────────────────── */
const docId = (mission: string, role: string): string => `${mission}:${role}`;

async function readDocExact(
  mission: string,
  role: string
): Promise<DocShape | null> {
  const ref = db.collection('mission_plans').doc(docId(mission, role));
  const snap = await ref.get();
  if (!snap.exists) {
    return null;
  }
  const data = snap.data();
  if (!data || !isMissionPlan(data.plan)) {
    return null;
  }
  return data as DocShape;
}

// Fallback: pick newest doc for same mission from ANY role
async function readNewestForMission(mission: string): Promise<DocShape | null> {
  try {
    const qs = await db
      .collection('mission_plans')
      .where('mission', '==', mission)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (qs.empty) {
      return null;
    }
    const data = qs.docs[0].data();
    if (!data || !isMissionPlan(data.plan)) {
      return null;
    }
    return data as DocShape;
  } catch (e) {
    // If an index is missing, Firestore throws. Fall back to client-side sort.
    const all = await db
      .collection('mission_plans')
      .where('mission', '==', mission)
      .get();
    if (all.empty) {
      return null;
    }
    let latest: DocShape | null = null;
    all.forEach((doc) => {
      const d = doc.data();
      if (
        d &&
        isMissionPlan(d.plan) &&
        d.updatedAt instanceof Timestamp &&
        (!latest || d.updatedAt.toMillis() > latest.updatedAt.toMillis())
      ) {
        latest = d as DocShape;
      }
    });
    return latest;
  }
}

async function writeDoc(
  mission: string,
  role: string,
  plan: EnrichedMissionPlan
): Promise<DocShape> {
  const ref = db.collection('mission_plans').doc(docId(mission, role));
  const now = Timestamp.now();
  const body: DocShape = { mission, role, plan, updatedAt: now };
  await ref.set(body, { merge: true });
  return body;
}

/* ─────────────────────────────────────────────────────────
   Queue helper (direct; no delegation loops)
────────────────────────────────────────────────────────── */
async function enqueueMissionDirectly(
  mission: string,
  role: string
): Promise<{ jobId: string }> {
  const payload = { missionType: mission, role };
  const jobData = { type: 'mission', payload };
  const jobId = hashId(jobData);

  const backgroundQueue = await getQueue(BACKGROUND_QUEUE_NAME);
  await backgroundQueue.add(jobData.type, jobData, {
    jobId,
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 300, count: 1000 },
    removeOnFail: { age: 3600, count: 1000 },
  });

  return { jobId };
}

/* ─────────────────────────────────────────────────────────
   Handler
────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const sp = req.nextUrl.searchParams;

    const mission = (sp.get('mission') || '').trim();
    const requestedRole = (sp.get('role') || 'explorer').trim();
    // default 6h
    const maxAgeMs = Math.max(
      60 * 1000,
      Number(sp.get('maxAgeMs')) || 6 * 60 * 60 * 1000
    );
    const force = sp.get('force') === '1';

    // NEVER enqueue when these flags are present
    const noEnqueue =
      sp.get('noEnqueue') === '1' ||
      req.headers.get('x-fast-noenqueue') === '1';

    if (!mission) {
      return json({ status: 'error', error: 'Missing mission query param' }, 400);
    }

    // 1) Try exact role
    let doc = await readDocExact(mission, requestedRole);

    // 2) If exact role missing, fall back to ANY role for this mission (freshest)
    if (!doc) {
      doc = await readNewestForMission(mission);
    }

    const now = Date.now();
    const isFresh =
      !!doc?.updatedAt && now - doc.updatedAt.toMillis() <= maxAgeMs;

    // A) Found a doc
    if (doc) {
      // i) Fresh and not forced → "ready"
      if (isFresh && !force) {
        return json({ status: 'ready', plan: doc.plan }, 200);
      }

      // ii) Stale or forced
      if (noEnqueue) {
        // Caller asked to NEVER enqueue; just return what we have as "stale"
        return json({ status: 'stale', plan: doc.plan }, 200);
      }

      // Enqueue a background refresh for the *requested* role
      const { jobId } = await enqueueMissionDirectly(mission, requestedRole);
      // Return stale plan immediately, mark that a refresh is queued
      return json({ status: 'stale', plan: doc.plan, jobId }, 202);
    }

    // B) No doc at all for this mission
    if (noEnqueue) {
      return json({ status: 'missing' }, 200);
    }

    // Enqueue initial build for the requested role
    const { jobId } = await enqueueMissionDirectly(mission, requestedRole);
    return json({ status: 'queued', jobId }, 202);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // The console.error call is kept for debugging purposes.
    console.error('[missions/stream] error', msg);
    return json({ status: 'error', error: msg }, 500);
  }
}