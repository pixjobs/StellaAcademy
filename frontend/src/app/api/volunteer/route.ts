import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firestore';
import { clientAddress, createRateLimiter } from '@/lib/rate-limit';
import { readCapped } from '@/lib/read-capped';
import {
  MIN_FILL_MS,
  VOLUNTEER_COLLECTION,
  VOLUNTEER_LIMITS,
  VOLUNTEER_RETENTION_MONTHS,
  VOLUNTEER_ROLES,
  isEmail,
  type VolunteerRole,
} from '@/lib/volunteer';

/**
 * "Help test Stella" sign-ups from /help, for adults only. A genuine sign-up is
 * stored in Firestore (Europe) and listed in the weekly Jira digest
 * (/api/volunteer/digest). Likely bots (the hidden field filled in, or the form
 * sent faster than a person could type) get the same "thank you" but nothing is
 * stored, so they learn nothing. The caller's address is used only for the rate
 * limit, held in memory, and is not stored.
 */
const rateLimited = createRateLimiter(60 * 60_000, 5);

const MAX_BODY = 4_000;

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export async function POST(req: NextRequest) {
  if (rateLimited(clientAddress(req))) {
    return NextResponse.json({ error: 'Too many sign-ups from here. Please try again later.' }, { status: 429 });
  }

  const tooLong = () => NextResponse.json({ error: 'Too long.' }, { status: 413 });
  if (Number(req.headers.get('content-length')) > MAX_BODY) return tooLong();

  let body: Record<string, unknown>;
  try {
    const raw = await readCapped(req, MAX_BODY);
    if (raw === null) return tooLong();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid form.' }, { status: 400 });
  }

  const looksLikeBot = text(body.website, 200) !== '' || !(Number(body.elapsed) >= MIN_FILL_MS);
  if (looksLikeBot) {
    console.log(JSON.stringify({ severity: 'INFO', message: 'Volunteer sign-up dropped as likely spam', type: 'volunteer_dropped' }));
    return NextResponse.json({ ok: true });
  }

  const name = text(body.name, VOLUNTEER_LIMITS.name);
  const email = text(body.email, VOLUNTEER_LIMITS.email).toLowerCase();
  const role = typeof body.role === 'string' && Object.hasOwn(VOLUNTEER_ROLES, body.role) ? (body.role as VolunteerRole) : null;
  const subject = text(body.subject, VOLUNTEER_LIMITS.subject);
  const note = text(body.note, VOLUNTEER_LIMITS.note);
  if (!name || !isEmail(email) || !role) {
    return NextResponse.json({ error: 'Please give your name, a valid email address and your role.' }, { status: 400 });
  }
  if (body.adult !== true) {
    return NextResponse.json({ error: 'Please confirm you are 18 or over and happy to be contacted.' }, { status: 400 });
  }

  const now = new Date();
  const expireAt = new Date(now);
  expireAt.setMonth(expireAt.getMonth() + VOLUNTEER_RETENTION_MONTHS);

  try {
    await firestore().collection(VOLUNTEER_COLLECTION).add({ name, email, role, subject, note, createdAt: now, expireAt, digested: false });
  } catch (err) {
    console.error(JSON.stringify({ severity: 'ERROR', message: 'Volunteer sign-up could not be saved', error: String(err) }));
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }

  console.log(JSON.stringify({ severity: 'NOTICE', message: `Volunteer sign-up (${role})`, type: 'volunteer_signup', role }));
  return NextResponse.json({ ok: true });
}
