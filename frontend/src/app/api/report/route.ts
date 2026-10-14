import { NextRequest, NextResponse } from 'next/server';
import { clientAddress, createRateLimiter } from '@/lib/rate-limit';
import { REPORT_KINDS, type ReportKind } from '@/lib/report';
import { studyModules } from '@/lib/study-modules';

/**
 * "Report a problem" on a lesson. Each report becomes one structured log line
 * in Cloud Logging (Cloud Run turns JSON on stdout into jsonPayload); nothing
 * is stored anywhere else. The caller's address is used only for the rate
 * limit and is not written to the report. Read reports with the command in
 * DEPLOYMENT.md.
 */
const rateLimited = createRateLimiter(10 * 60_000, 5);

const MAX_BODY = 4_000;
const MAX_TEXT = 1_000;
const LESSONS = new Set<string>(studyModules.map((m) => m.id));

export async function POST(req: NextRequest) {
  if (rateLimited(clientAddress(req))) {
    return NextResponse.json({ error: 'Too many reports. Please try again in a few minutes.' }, { status: 429 });
  }

  let body: { lesson?: unknown; kind?: unknown; text?: unknown };
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ error: 'Report too long.' }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid report.' }, { status: 400 });
  }

  const lesson = typeof body.lesson === 'string' && LESSONS.has(body.lesson) ? body.lesson : null;
  const kind = typeof body.kind === 'string' && Object.hasOwn(REPORT_KINDS, body.kind) ? (body.kind as ReportKind) : null;
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, MAX_TEXT) : '';
  if (!lesson || !kind || !text) {
    return NextResponse.json({ error: 'Choose what kind of problem it is and describe it.' }, { status: 400 });
  }

  console.log(JSON.stringify({ severity: 'NOTICE', message: `Lesson report: ${lesson} (${kind})`, type: 'lesson_report', lesson, kind, text }));
  return NextResponse.json({ ok: true });
}
