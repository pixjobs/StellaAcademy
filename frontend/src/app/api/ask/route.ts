import { NextRequest, NextResponse } from 'next/server';
import { Job } from 'bullmq'; // Import the Job type for type safety
import {
  hashId,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import { getQueues } from '@/lib/bullmq/queues';
import { INTERACTIVE_QUEUE_NAME, BACKGROUND_QUEUE_NAME } from '@/lib/queue';
import { getSecret } from '@/lib/secrets';
import { isRole } from '@/workers/ollama/utils';
import type { Role } from '@/types/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*                                Local Types                                 */
/* -------------------------------------------------------------------------- */

type LinkPreview = {
  url: string;
  title?: string;
  faviconUrl?: string;
  meta?: string;
};

type AskPayload = {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
};

type CseItem = {
  title?: string;
  link?: string;
  snippet?: string;
};

type CseResponse = {
  items?: CseItem[];
};

/* -------------------------------------------------------------------------- */
/*                             Link Helpers (local)                           */
/* -------------------------------------------------------------------------- */

// This section contains your robust link parsing and enrichment logic.
// It is well-structured and does not require changes.

const URL_RE = /(https?:\/\/[^\s<>()\][}{"']+?[^\s<>()\][}{"'.,!?;:])/gi;

function markdownifyBareUrls(text: string): string {
  const parts = splitByCodeRegions(text);
  return parts.map(p => (p.code ? p.raw : autolinkInTextBlock(p.raw))).join('');
}

function splitByCodeRegions(raw: string): Array<{ code: boolean; raw: string }> {
  const out: Array<{ code: boolean; raw: string }> = [];
  const fenced = /```[\s\S]*?```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fenced.exec(raw))) {
    if (m.index > last) splitInline(raw.slice(last, m.index), out);
    out.push({ code: true, raw: m[0] });
    last = fenced.lastIndex;
  }
  if (last < raw.length) splitInline(raw.slice(last), out);
  return out;
}

function splitInline(segment: string, out: Array<{ code: boolean; raw: string }>) {
  const inline = /`[^`\n]*`/g;
  let iLast = 0;
  let im: RegExpExecArray | null;
  while ((im = inline.exec(segment))) {
    if (im.index > iLast) out.push({ code: false, raw: segment.slice(iLast, im.index) });
    out.push({ code: true, raw: im[0] });
    iLast = inline.lastIndex;
  }
  if (iLast < segment.length) out.push({ code: false, raw: segment.slice(iLast) });
}

function autolinkInTextBlock(block: string): string {
  return block.replace(URL_RE, (match: string, ...args: (string | number)[]) => {
    const offset = args[args.length - 2] as number;
    const whole = args[args.length - 1] as string;
    const before2 = whole.slice(Math.max(0, offset - 2), offset);
    if (before2 === '](') return match;
    const before6 = whole.slice(Math.max(0, offset - 6), offset).toLowerCase();
    if (before6.includes('href="') || before6.includes("href='")) return match;
    const host = safeHost(match);
    return `[${host}](${stripTracking(match)})`;
  });
}

function extractLinksFromText(text: string, cap = 8): LinkPreview[] {
  const links: string[] = [];
  const seen = new Set<string>();
  const MD_RE = /\[[^\]]*?\]\((https?:\/\/[^\s)]+)\)/gi;
  let mdMatch: RegExpExecArray | null;
  while ((mdMatch = MD_RE.exec(text)) !== null) {
    const u = stripTracking(mdMatch[1]);
    if (!seen.has(u)) {
      seen.add(u);
      links.push(u);
      if (links.length >= cap) break;
    }
  }
  if (links.length < cap) {
    const BARE_RE = new RegExp(URL_RE.source, 'gi');
    let bareMatch: RegExpExecArray | null;
    while ((bareMatch = BARE_RE.exec(text)) !== null) {
      const u = stripTracking(bareMatch[0]);
      if (!seen.has(u)) {
        seen.add(u);
        links.push(u);
        if (links.length >= cap) break;
      }
    }
  }
  return links.map((url) => ({
    url,
    title: safeHost(url),
    faviconUrl: `https://icons.duckduckgo.com/ip3/${safeHostname(url)}.ico`,
  }));
}

function stripTracking(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const toDelete = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'];
    toDelete.forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch { return rawUrl; }
}

function safeHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

async function tryGoogleCse(query: string): Promise<LinkPreview[]> {
  try {
    const key = await getSecret('GOOGLE_CUSTOM_SEARCH_KEY');
    const cx  = await getSecret('GOOGLE_CUSTOM_SEARCH_CX');
    if (!key || !cx) return [];

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', key);
    url.searchParams.set('cx', cx);
    url.searchParams.set('num', '3');
    url.searchParams.set('q', query);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error(`Google Custom Search API returned status ${res.status}`);
    const data = (await res.json()) as CseResponse;

    return (data.items ?? [])
      .filter((i): i is Required<CseItem> => !!i.link)
      .map((i) => ({
        url: stripTracking(i.link),
        title: i.title || safeHost(i.link),
        meta: i.snippet,
        faviconUrl: `https://icons.duckduckgo.com/ip3/${safeHostname(i.link)}.ico`,
      }));
  } catch (error) {
    console.warn('[ask][GET] Google CSE enrichment failed:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

function dedupeLinks(a: LinkPreview[], b: LinkPreview[]): LinkPreview[] {
  const out: LinkPreview[] = [];
  const seen = new Set<string>();
  for (const list of [a, b]) {
    for (const l of list) {
      const key = stripTracking(l.url);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...l, url: key });
    }
  }
  return out.slice(0, 8);
}

/* -------------------------------------------------------------------------- */
/*                               POST (Enqueue Job)                           */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let jobId = 'unknown';
  try {
    const body = await req.json() as AskPayload;
    const role: Role = body.role ?? 'explorer';
    const prompt = body.prompt?.trim();

    if (!prompt || prompt.length > 4000) return NextResponse.json({ error: "Invalid 'prompt'." }, { status: 400 });
    if (!isRole(role)) return NextResponse.json({ error: "Invalid 'role'." }, { status: 400 });
    if (body.context && (typeof body.context !== 'string' || body.context.length > 20000)) return NextResponse.json({ error: "Invalid 'context'." }, { status: 400 });

    const payloadForQueue = { ...body, role, prompt };
    jobId = hashId({ type: 'ask', payload: payloadForQueue });

    console.log('[ask][POST] enqueuing', { jobId, role, mission: body.mission ?? 'general' });

    const { interactiveQueue } = await getQueues();

    const { state } = await enqueueIdempotent(
      'user-question',
      { type: 'ask', payload: payloadForQueue },
      jobId,
      interactiveQueue
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ask][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue ask job.', details: msg }, { status: 500 });
    return withJobHeaders(res, jobId, 'error');
  }
}

/* -------------------------------------------------------------------------- */
/*                      GET (Poll Status / Debug)                             */
/* -------------------------------------------------------------------------- */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  if (statsOnly || list) {
    const { interactiveQueue, backgroundQueue } = await getQueues();
    if (statsOnly) {
      const [interactiveStats, backgroundStats] = await Promise.all([
        interactiveQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
        backgroundQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed'),
      ]);
      return NextResponse.json({
        queues: { [INTERACTIVE_QUEUE_NAME]: interactiveStats, [BACKGROUND_QUEUE_NAME]: backgroundStats },
      });
    }

    // --- CORRECTED LOGIC for ?list=1 ---
    const [iJobs, bJobs] = await Promise.all([
      interactiveQueue.getJobs(['active', 'waiting', 'delayed'], 0, 20),
      backgroundQueue.getJobs(['active', 'waiting', 'delayed'], 0, 20),
    ]);

    // Helper function to asynchronously get the state for each job
    const jobToJSON = async (j: Job) => ({
        id: j.id,
        name: j.name,
        state: await j.getState(),
    });

    // Process all jobs in parallel to get their states
    const [iJobsWithState, bJobsWithState] = await Promise.all([
        Promise.all(iJobs.map(jobToJSON)),
        Promise.all(bJobs.map(jobToJSON)),
    ]);

    return NextResponse.json({
      [INTERACTIVE_QUEUE_NAME]: iJobsWithState,
      [BACKGROUND_QUEUE_NAME]: bJobsWithState,
    });
  }

  if (!id) return NextResponse.json({ error: 'Missing job ?id=' }, { status: 400 });

  const resp = await pollJobResponse(id, debug);

  // The enrichment logic below is queue-agnostic and works perfectly as is.
  try {
    const payload = await resp.clone().json();

    if (payload?.state === 'completed' && payload.result?.answer) {
      const rawAnswer: string = payload.result.answer;
      const answerWithLinks = markdownifyBareUrls(rawAnswer);
      const existing: LinkPreview[] | undefined = payload.result.links;
      const textLinks: LinkPreview[] = Array.isArray(existing) && existing.length > 0 ? existing : extractLinksFromText(answerWithLinks);
      const cseQuery = payload?.job?.data?.payload?.prompt ?? '';
      const cseLinks = cseQuery ? await tryGoogleCse(cseQuery) : [];
      const links: LinkPreview[] = dedupeLinks(textLinks, cseLinks);

      return NextResponse.json(
        { ...payload, result: { ...payload.result, answer: answerWithLinks, links } },
        { status: resp.status, headers: resp.headers }
      );
    }
    return resp;
  } catch {
    // If the response wasn't JSON or something else failed, return the original response.
    return resp;
  }
}