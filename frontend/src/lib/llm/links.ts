// lib/llm/links.ts

// Lightweight link shape that matches your extended types
export type LinkPreview = {
  url: string;
  title?: string;
  faviconUrl?: string;
  meta?: string;
};

// Bare-ish URLs (avoid trailing punctuation)
const URL_RE = /(https?:\/\/[^\s<>()\][}{"']+?[^\s<>()\][}{"'.,!?;:])/gi;

/** Convert bare URLs in normal text to `[host](url)`; skip fenced/inline code and existing links. */
export function markdownifyBareUrls(text: string): string {
  const parts = splitByCodeRegions(text);
  return parts.map(p => (p.code ? p.raw : autolinkInTextBlock(p.raw))).join('');
}

/** Split by fenced blocks ```...``` and inline code `...`, preserving raw chunks. */
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
  // Use rest args to safely read offset/string regardless of capture groups
  return block.replace(URL_RE, (match: string, ...args: any[]) => {
    const offset = args[args.length - 2] as number; // second from last
    const whole  = args[args.length - 1] as string; // last

    // 1) Already a Markdown link target? (...](URL))
    const before2 = whole.slice(Math.max(0, offset - 2), offset);
    if (before2 === '](') return match;

    // 2) Already in HTML href/src attribute
    const before6 = whole.slice(Math.max(0, offset - 6), offset).toLowerCase();
    if (before6.includes('href="') || before6.includes("href='") || before6.includes('src="') || before6.includes("src='")) {
      return match;
    }

    const clean = stripTracking(match);
    const host = safeHost(clean);
    return `[${host}](${clean})`;
  });
}

export function extractLinksFromText(text: string, cap = 8): LinkPreview[] {
  const links: string[] = [];
  const seen = new Set<string>();

  // 1) URLs in markdown: [label](url)
  const MD_RE = /\[[^\]]*?\]\((https?:\/\/[^\s)]+)\)/gi;
  let md: RegExpExecArray | null;
  while ((md = MD_RE.exec(text)) !== null) {
    const u = stripTracking(md[1]);
    if (!seen.has(u)) {
      seen.add(u);
      links.push(u);
      if (links.length >= cap) break;
    }
  }

  // 2) Bare URLs
  if (links.length < cap) {
    const BARE_RE = new RegExp(URL_RE.source, 'gi'); // fresh regex with its own lastIndex
    let bm: RegExpExecArray | null;
    while ((bm = BARE_RE.exec(text)) !== null) {
      const u = stripTracking(bm[0]);
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
