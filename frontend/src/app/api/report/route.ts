import { NextRequest, NextResponse } from 'next/server';
import { clientAddress, createRateLimiter } from '@/lib/rate-limit';
import { readCapped } from '@/lib/read-capped';
import { REPORT_KINDS, redactReport, type ReportKind } from '@/lib/report';
import { studyModules } from '@/lib/study-modules';

/**
 * "Report a problem" on a lesson. Each report becomes one structured log line
 * in Cloud Logging (Cloud Run turns JSON on stdout into jsonPayload); nothing
 * is stored anywhere else. Email addresses and phone numbers are removed from
 * the text first. The caller's address is used only for the rate limit (held
 * in memory for at most ten minutes) and is not written to the report. Read
 * reports with the command in DEPLOYMENT.md.
 */
const rateLimited = createRateLimiter(10 * 60_000, 5);

const MAX_BODY = 4_000;
const MAX_TEXT = 1_000;
const LESSONS = new Set<string>(studyModules.map((m) => m.id));

export async function POST(req: NextRequest) {
  if (rateLimited(clientAddress(req))) {
    return NextResponse.json({ error: 'Too many reports. Please try again in a few minutes.' }, { status: 429 });
  }

  const tooLong = () => NextResponse.json({ error: 'Report too long.' }, { status: 413 });
  if (Number(req.headers.get('content-length')) > MAX_BODY) return tooLong();

  let body: { lesson?: unknown; kind?: unknown; text?: unknown };
  try {
    const raw = await readCapped(req, MAX_BODY);
    if (raw === null) return tooLong();
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid report.' }, { status: 400 });
  }

  const lesson = typeof body.lesson === 'string' && LESSONS.has(body.lesson) ? body.lesson : null;
  const kind = typeof body.kind === 'string' && Object.hasOwn(REPORT_KINDS, body.kind) ? (body.kind as ReportKind) : null;
  const text = typeof body.text === 'string' ? redactReport(body.text.trim().slice(0, MAX_TEXT)) : '';
  if (!lesson || !kind || !text) {
    return NextResponse.json({ error: 'Choose what kind of problem it is and describe it.' }, { status: 400 });
  }

  console.log(JSON.stringify({ severity: 'NOTICE', message: `Lesson report: ${lesson} (${kind})`, type: 'lesson_report', lesson, kind, text }));
  return NextResponse.json({ ok: true });
}
