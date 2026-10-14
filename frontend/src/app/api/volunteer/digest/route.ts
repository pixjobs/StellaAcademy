import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firestore';
import { VOLUNTEER_COLLECTION, VOLUNTEER_RETENTION_MONTHS, VOLUNTEER_ROLES, type VolunteerRole } from '@/lib/volunteer';

/**
 * Weekly digest of "Help test Stella" sign-ups. Cloud Scheduler calls this every
 * Monday with `Authorization: Bearer <VOLUNTEER_DIGEST_KEY>`. If anyone new has
 * signed up, it creates one Jira work item in KAN listing them and marks them as
 * sent, so nobody has to watch an inbox. With no new sign-ups it creates nothing.
 * It also deletes digest work items older than the retention period, because the
 * privacy policy promises the Jira copy goes when the Firestore copy does.
 *
 * Secrets (Secret Manager, mounted as environment variables on Cloud Run):
 * VOLUNTEER_DIGEST_KEY, and JIRA_API_TOKEN for the account in JIRA_EMAIL.
 */
const JIRA_BASE = 'https://pixjobs-40721496.atlassian.net';
const JIRA_EMAIL = 'hello@pixjobs.com';
const JIRA_PROJECT = 'KAN';
const MAX_PER_DIGEST = 200;

function authorised(req: NextRequest): boolean {
  const key = process.env.VOLUNTEER_DIGEST_KEY;
  if (!key) return false;
  const given = Buffer.from(req.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${key}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

type SignUp = { name: string; email: string; role: VolunteerRole; subject?: string; note?: string; createdAt: { toDate(): Date } };

function jiraHeaders(token: string) {
  return {
    Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${token}`).toString('base64')}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/** Delete digest work items older than the retention period. Returns the keys deleted. */
async function deleteExpiredDigests(token: string): Promise<string[]> {
  const days = Math.ceil(VOLUNTEER_RETENTION_MONTHS * 30.5);
  const jql = `project = ${JIRA_PROJECT} AND labels = volunteers AND created <= -${days}d`;
  const res = await fetch(`${JIRA_BASE}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=summary&maxResults=50`, { headers: jiraHeaders(token) });
  if (!res.ok) {
    console.error(JSON.stringify({ severity: 'ERROR', message: 'Volunteer digest: could not search for expired items', status: res.status }));
    return [];
  }
  const { issues = [] } = (await res.json()) as { issues?: { key: string }[] };
  const deleted: string[] = [];
  for (const { key } of issues) {
    const del = await fetch(`${JIRA_BASE}/rest/api/2/issue/${key}`, { method: 'DELETE', headers: jiraHeaders(token) });
    if (del.ok) deleted.push(key);
    else console.error(JSON.stringify({ severity: 'ERROR', message: `Volunteer digest: could not delete ${key}`, status: del.status }));
  }
  return deleted;
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  const token = process.env.JIRA_API_TOKEN;
  if (!token) return NextResponse.json({ error: 'JIRA_API_TOKEN is not set.' }, { status: 503 });

  const expired = await deleteExpiredDigests(token);
  const snapshot = await firestore().collection(VOLUNTEER_COLLECTION).where('digested', '==', false).limit(MAX_PER_DIGEST).get();
  if (snapshot.empty) return NextResponse.json({ created: false, count: 0, expired });

  const people = snapshot.docs
    .map((doc) => doc.data() as SignUp)
    .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());
  const lines = people.map((p) => {
    const parts = [`${p.name} <${p.email}>`, VOLUNTEER_ROLES[p.role] ?? p.role];
    if (p.subject) parts.push(p.subject);
    const day = p.createdAt.toDate().toISOString().slice(0, 10);
    return `* ${parts.join(' · ')} (${day})${p.note ? `\n** "${p.note.replace(/\s+/g, ' ')}"` : ''}`;
  });
  const today = new Date().toISOString().slice(0, 10);
  const count = people.length;

  const res = await fetch(`${JIRA_BASE}/rest/api/2/issue`, {
    method: 'POST',
    headers: jiraHeaders(token),
    body: JSON.stringify({
      fields: {
        project: { key: JIRA_PROJECT },
        issuetype: { name: 'Task' },
        summary: `Help test Stella: ${count} new sign-up${count === 1 ? '' : 's'} (week to ${today})`,
        labels: ['stella-academy', 'volunteers'],
        description:
          `New sign-ups from https://www.stella-academy.org/help since the last digest. ` +
          `Everyone confirmed they are 18 or over and happy to be contacted about testing.\n\n${lines.join('\n')}\n\n` +
          `These sign-ups are deleted from Firestore, and this work item from Jira, ${VOLUNTEER_RETENTION_MONTHS} months after they arrive. To remove someone sooner, delete them from Firestore (collection "${VOLUNTEER_COLLECTION}") and edit them out of this item.`,
      },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(JSON.stringify({ severity: 'ERROR', message: 'Volunteer digest: Jira refused the work item', status: res.status, detail: detail.slice(0, 500) }));
    return NextResponse.json({ error: 'Jira refused the work item.' }, { status: 502 });
  }
  const { key } = (await res.json()) as { key: string };

  const batch = firestore().batch();
  for (const doc of snapshot.docs) batch.update(doc.ref, { digested: true, digestKey: key });
  await batch.commit();

  console.log(JSON.stringify({ severity: 'NOTICE', message: `Volunteer digest: ${key} (${count})`, type: 'volunteer_digest', key, count }));
  return NextResponse.json({ created: true, key, count, expired });
}
