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
/** Up to 25 people per work item keeps each description far below Jira's limit, even with every field full. */
const PEOPLE_PER_ITEM = 25;
const MAX_ITEMS_PER_RUN = 8;
const NOTE_IN_DIGEST = 300;

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

type AdfNode = { type: string; text?: string; content?: AdfNode[] };

/** A text node. Atlassian Document Format shows text literally, so nothing a visitor types becomes a link or markup. */
const textNode = (text: string): AdfNode => ({ type: 'text', text });
const paragraph = (text: string): AdfNode => ({ type: 'paragraph', content: [textNode(text)] });

/** The work item's description as Atlassian Document Format, one bullet per person. */
function digestDocument(people: SignUp[]) {
  const items = people.map((p) => {
    const parts = [p.name, p.email, VOLUNTEER_ROLES[p.role] ?? String(p.role)];
    if (p.subject) parts.push(p.subject);
    const day = p.createdAt.toDate().toISOString().slice(0, 10);
    const content = [paragraph(`${parts.join(' · ')} (${day})`)];
    const note = p.note?.replace(/\s+/g, ' ').trim().slice(0, NOTE_IN_DIGEST);
    if (note) content.push(paragraph(`Note: ${note}`));
    return { type: 'listItem', content };
  });
  return {
    type: 'doc',
    version: 1,
    content: [
      paragraph(
        'New sign-ups from https://www.stella-academy.org/help since the last digest. Everyone confirmed they are 18 or over and happy to be contacted about testing.',
      ),
      { type: 'bulletList', content: items },
      paragraph(
        `These sign-ups are deleted from Firestore, and this work item from Jira, ${VOLUNTEER_RETENTION_MONTHS} months after they arrive. To remove someone sooner, delete them from Firestore (collection "${VOLUNTEER_COLLECTION}") and edit them out of this item.`,
      ),
    ],
  };
}

export async function POST(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: 'Not allowed.' }, { status: 401 });
  const token = process.env.JIRA_API_TOKEN;
  if (!token) return NextResponse.json({ error: 'JIRA_API_TOKEN is not set.' }, { status: 503 });

  const expired = await deleteExpiredDigests(token);
  const created: { key: string; count: number }[] = [];

  // Several small work items rather than one large one: Jira refuses a description over about 32,000 characters,
  // and a refused batch would otherwise be retried, and refused, every week.
  for (let run = 0; run < MAX_ITEMS_PER_RUN; run++) {
    const snapshot = await firestore().collection(VOLUNTEER_COLLECTION).where('digested', '==', false).limit(PEOPLE_PER_ITEM).get();
    if (snapshot.empty) break;

    const people = snapshot.docs
      .map((doc) => doc.data() as SignUp)
      .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());
    const count = people.length;
    const today = new Date().toISOString().slice(0, 10);

    const res = await fetch(`${JIRA_BASE}/rest/api/3/issue`, {
      method: 'POST',
      headers: jiraHeaders(token),
      body: JSON.stringify({
        fields: {
          project: { key: JIRA_PROJECT },
          issuetype: { name: 'Task' },
          summary: `Help test Stella: ${count} new sign-up${count === 1 ? '' : 's'} (week to ${today})`,
          labels: ['stella-academy', 'volunteers'],
          description: digestDocument(people),
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(JSON.stringify({ severity: 'ERROR', message: 'Volunteer digest: Jira refused the work item', status: res.status, detail: detail.slice(0, 500) }));
      return NextResponse.json({ error: 'Jira refused the work item.', created, expired }, { status: 502 });
    }
    const { key } = (await res.json()) as { key: string };

    const batch = firestore().batch();
    for (const doc of snapshot.docs) batch.update(doc.ref, { digested: true, digestKey: key });
    await batch.commit();

    console.log(JSON.stringify({ severity: 'NOTICE', message: `Volunteer digest: ${key} (${count})`, type: 'volunteer_digest', key, count }));
    created.push({ key, count });
  }

  return NextResponse.json({ created, expired });
}
