// app/api/ask/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  hashId,
  queueStats,
  redisPing,
  enqueueIdempotent,
  withJobHeaders,
  pollJobResponse,
} from '@/lib/api/queueHttp';
import { llmQueue } from '@/lib/queue';
import type { Role } from '@/types/llm';

/* -------------------------------------------------------------------------- */
/*                             Link helpers (local)                           */
/* -------------------------------------------------------------------------- */

type LinkPreview = {
  url: string;
  title?: string;
  faviconUrl?: string;
  meta?: string;
};

// Not-too-greedy bare URL regex (exclude trailing punctuation)
const URL_RE = /(https?:\/\/[^\s<>()\][}{"']+?[^\s<>()\][}{"'.,!?;:])/gi;

/** Convert bare URLs in normal text to `[host](url)`; skip fenced & inline code and existing md/html links. */
function markdownifyBareUrls(text: string): string {
  const parts = splitByCodeRegions(text);
  return parts.map(p => (p.code ? p.raw : autolinkInTextBlock(p.raw))).join('');
}

/** Split by fenced blocks ```...``` and inline code `...` while preserving raw chunks. */
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
  // IMPORTANT: do not rely on typed parameters for offset/string because capture groups change positions.
  return block.replace(URL_RE, (match: string, ...args: any[]) => {
    const offset = args[args.length - 2] as number;    // safe: second from last
    const whole  = args[args.length - 1] as string;    // safe: last

    // 1) Already a Markdown link target? ( ... ](URL) )
    const before2 = whole.slice(Math.max(0, offset - 2), offset);
    if (before2 === '](') return match;

    // 2) Already inside HTML attribute like href="URL"
    const before6 = whole.slice(Math.max(0, offset - 6), offset).toLowerCase();
    if (before6.includes('href="') || before6.includes("href='")) return match;

    const host = safeHost(match);
    return `[${host}](${stripTracking(match)})`;
  });
}

function extractLinksFromText(text: string, cap = 8): LinkPreview[] {
  const links: string[] = [];
  const seen = new Set<string>();

  // 1) URLs already in markdown: [label](url)
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

  // 2) Bare URLs
  if (links.length < cap) {
    const BARE_RE = new RegExp(URL_RE.source, 'gi'); // fresh regex, own lastIndex
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
  } catch {
    return rawUrl;
  }
}
function safeHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}
function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

/* -------------------------------------------------------------------------- */
/*                         Model output formatting guardrails                 */
/* -------------------------------------------------------------------------- */

const FORMATTING_INSTRUCTIONS = `
You are Stella, a helpful AI assistant.

Your entire response MUST be a single, valid **Markdown** document.
Do NOT use LaTeX doc scaffolding like \\documentclass.

**Formatting Rules**
- Use Markdown headings (#), lists (*), and tables (|).
- Use $$ ... $$ for block math; $ ... $ for inline math.
- When you include a web reference, write it as a Markdown link: [short title or host](https://example.com).
- Prefer short, descriptive link text (never paste long raw URLs into the prose).
- Keep responses concise and scannable.

Example (block math + link):
The area of a circle is
$$
A = \\pi r^2
$$

More details: [wikipedia.org](https://en.wikipedia.org/wiki/Area_of_a_circle)
`.trim();

type AskPayload = {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
};

/* ----------------------------- POST (enqueue) ----------------------------- */
export async function POST(req: NextRequest) {
  let jobId = 'unknown';

  try {
    const raw = await req.text();
    if (!raw) return NextResponse.json({ error: 'Empty request body; expected JSON.' }, { status: 400 });

    let body: AskPayload;
    try { body = JSON.parse(raw); }
    catch { return NextResponse.json({ error: 'Malformed JSON body.' }, { status: 400 }); }

    const role: Role = (body.role as Role) ?? 'explorer';
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt || prompt.length > 4000)
      return NextResponse.json({ error: "Invalid 'prompt'. Provide a non-empty string up to 4000 chars." }, { status: 400 });

    if (body.context && (typeof body.context !== 'string' || body.context.length > 20000))
      return NextResponse.json({ error: "Invalid 'context'. Must be a string up to 20000 chars." }, { status: 400 });

    if (role !== 'explorer' && role !== 'cadet' && role !== 'scholar')
      return NextResponse.json({ error: "Invalid 'role'. Use explorer|cadet|scholar." }, { status: 400 });

    // Merge guardrails + (optional) context + user question
    const finalPrompt = [
      FORMATTING_INSTRUCTIONS,
      body.context?.trim()
        ? `\n--- CONTEXT START ---\n${body.context.trim()}\n--- CONTEXT END ---`
        : '',
      '\n--- USER PROMPT ---\n',
      prompt,
    ].join('');

    const payloadForQueue = { ...body, role, prompt: finalPrompt };

    // Stable job id for idempotency (same request → same job)
    jobId = hashId({ type: 'ask', payload: payloadForQueue });

    const [ping] = await Promise.all([redisPing()]);
    console.log('[ask][POST] enqueuing', {
      jobId,
      role,
      mission: body.mission ?? 'general',
      redis: ping,
    });

    const { state } = await enqueueIdempotent(
      'llm',
      { type: 'ask', payload: payloadForQueue, cacheKey: jobId },
      jobId
    );

    const res = NextResponse.json({ accepted: true, jobId, state }, { status: 202 });
    return withJobHeaders(res, jobId, state);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ask][POST] error', { jobId, error: msg });
    const res = NextResponse.json({ error: 'Failed to enqueue ask.', details: msg }, { status: 500 });
    return withJobHeaders(res, jobId, 'error');
  }
}

/* ---------------- GET (status / debug / list / stats) ---------------- */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  const statsOnly = req.nextUrl.searchParams.get('stats') === '1';
  const list = req.nextUrl.searchParams.get('list') === '1';

  if (statsOnly) {
    const [ping, stats] = await Promise.all([redisPing(), queueStats()]);
    return NextResponse.json(
      { queue: stats, redis: ping, server: { pid: process.pid, now: new Date().toISOString() } },
      { status: 200 }
    );
  }

  if (list) {
    const [waiting, active, delayed] = await Promise.all([
      llmQueue.getJobs(['waiting'], 0, 20),
      llmQueue.getJobs(['active'], 0, 20),
      llmQueue.getJobs(['delayed'], 0, 20),
    ]);
    return NextResponse.json(
      {
        waiting: waiting.map((j) => j.id),
        active: active.map((j) => j.id),
        delayed: delayed.map((j) => j.id),
      },
      { status: 200 }
    );
  }

  if (!id) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 });

  // Poll the worker result
  const resp = await pollJobResponse(id, debug);

  // Enrich ask results with clickable links + structured links (non-destructive for other job types)
  try {
    const payload = await resp.json();

    if (payload?.type === 'ask' && payload?.result?.answer) {
      const rawAnswer: string = payload.result.answer;

      // Convert bare URLs to Markdown links for your MarkdownRenderer
      const answerWithLinks = markdownifyBareUrls(rawAnswer);

      // Build structured links (if worker didn’t already provide)
      const existing: LinkPreview[] | undefined = payload.result.links;
      const links: LinkPreview[] =
        Array.isArray(existing) && existing.length > 0
          ? existing
          : extractLinksFromText(answerWithLinks);

      return NextResponse.json(
        { ...payload, result: { ...payload.result, answer: answerWithLinks, links } },
        { status: 200 }
      );
    }

    // Not an ask result; return unchanged
    return NextResponse.json(payload, { status: 200 });
  } catch {
    // If pollJobResponse streamed or wasn’t JSON, just return it as-is
    return resp;
  }
}
