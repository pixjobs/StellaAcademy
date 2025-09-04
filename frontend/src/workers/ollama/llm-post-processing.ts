/**
 * This module is responsible for post-processing an LLM answer to ensure it is
 * safe, well-formatted Markdown, and KaTeX-ready.
 */

export type KatexRender = (src: string, opts?: { throwOnError?: boolean }) => string;

export interface PostProcessOptions {
  katexRender?: KatexRender;
  autoWrapNakedBlockFormulas?: boolean;
  allowedHtmlTags?: ReadonlySet<string>;
  collapseNewlines?: boolean;
  addSpaceBeforeLatexCommands?: boolean;
  treatLatexFenceAsMath?: boolean;
}

const DEFAULT_ALLOWED_TAGS = new Set([
  'p', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'a', 'blockquote', 'br', 'code', 'pre'
]);

export function postProcessLlmResponse(raw: string, opts: PostProcessOptions = {}): string {
  if (!raw) return "";

  const {
    katexRender,
    autoWrapNakedBlockFormulas = true,
    allowedHtmlTags = DEFAULT_ALLOWED_TAGS,
    collapseNewlines = true,
    addSpaceBeforeLatexCommands = true,
    treatLatexFenceAsMath = true
  } = opts;

  let txt = raw
    .replace(/\r\n?/g, "\n")
    .replace(/\uFEFF/g, "")
    .replace(/[\u200B-\u200D\u2060]/g, "");

  txt = decodeBasicEntities(txt);

  const tokens: string[] = [];
  txt = protectCode(tokens, txt);

  txt = txt.replace(/\$\$\s*\n\s*\$\$\s*([^\$]+?)\s*\$\$/g, (_, inner) => `$$${(inner || "").trim()}$$`);

  const mathFence = /```(?:math|latex)\s*([\s\S]*?)```/gi;
  if (treatLatexFenceAsMath) {
    txt = txt.replace(mathFence, (_, inner) => fenceToMath(inner));
  } else {
    txt = txt.replace(/```math\s*([\s\S]*?)```/gi, (_, inner) => fenceToMath(inner));
  }

  txt = sanitizeHtmlMarkdown(txt, allowedHtmlTags);

  if (autoWrapNakedBlockFormulas) {
    txt = wrapNakedLatexLines(txt);
  }

  txt = txt.replace(/^[A-Za-z]\s*=\s*.*$/gm, (m) => {
    if (hasMathDelimitersAround(txt, m)) return m;
    return `$$\n${m.trim()}\n$$`;
  });

  txt = processMathBlocks(txt, katexRender);
  txt = processInlineMath(txt, katexRender);

  if (addSpaceBeforeLatexCommands) {
    txt = txt.replace(/(\w)(\\[a-zA-Z]+)/g, "$1 $2").replace(/(\})(\w)/g, "$1 $2");
  }

  if (collapseNewlines) {
    txt = txt.replace(/\n{3,}/g, "\n\n");
  }
  txt = txt.trim();

  txt = restoreTokens(tokens, txt);

  return txt;
}

/* ──────────────────────────── Helper Functions ──────────────────────────── */

function fenceToMath(inner: string): string {
  const c = (inner || "").trim();
  if (!c) return "";
  if (/^\$\$/.test(c) || /\$[^$]/.test(c)) return c;
  const isBlock = /\n/.test(c) || c.length > 40;
  return isBlock ? `$$\n${c}\n$$` : `$${c}$`;
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function sanitizeHtmlMarkdown(s: string, allowed: ReadonlySet<string>): string {
  return s.replace(/<([^>\s\/]+)([^>]*)>/g, (full, tagNameRaw: string, attrs: string) => {
    const name = (tagNameRaw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!allowed.has(name)) return "";

    if (name === "a") {
      const hrefMatch = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const hrefRaw = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "") : "";
      const safeHref = sanitiseHref(hrefRaw);
      const rel = ' rel="nofollow noopener"';
      const attr = safeHref ? ` href="${escapeHtmlAttr(safeHref)}"${rel}` : rel;
      return `<a${attr}>`;
    }
    return `<${name}>`;
  }).replace(/<\/([^>\s\/]+)>/g, (full, tagNameRaw: string) => {
    const name = (tagNameRaw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return allowed.has(name) ? `</${name}>` : "";
  });
}

function sanitiseHref(href: string): string {
  const t = (href || "").trim();
  if (!t) return "";
  if (/^(https?:|mailto:|#|\/)/i.test(t)) return t;
  return "";
}

function escapeHtmlAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapNakedLatexLines(s: string): string {
  const latexToken = /\\(frac|dfrac|tfrac|int|sum|prod|left|right|cdot|times|mathbf|boldsymbol|vec|bar|hat|tilde|gamma|sigma|theta|approx|le|ge|neq|infty|partial|nabla)|[\^_]/;
  const lines = s.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("$$") || /(^|[^\\])\$/.test(line)) continue;
    if (latexToken.test(line) && /=/.test(line)) {
      if (/^(\*|\-|\d+\.)\s/.test(line) || /^#{1,6}\s/.test(line)) continue;
      lines[i] = `$$\n${line}\n$$`;
    }
  }
  return lines.join("\n");
}

function hasMathDelimitersAround(full: string, segment: string): boolean {
  const idx = full.indexOf(segment);
  if (idx < 0) return false;
  const before = full.slice(0, idx);
  const after = full.slice(idx + segment.length);
  const openDollars = (before.match(/\$\$/g) || []).length;
  const closeDollars = (after.match(/\$\$/g) || []).length;
  return (openDollars % 2 === 1) && (closeDollars % 2 === 1);
}

function processMathBlocks(s: string, katexRender?: KatexRender): string {
  return s.replace(/\$\$([\s\S]*?)\$\$/g, (m, inner: string) => {
    const content = (inner || "").trim();
    if (!content) return "";
    if (!katexRender) return `$$${content}$$`;
    try {
      katexRender(content, { throwOnError: false });
      return `$$${content}$$`;
    } catch {
      return "";
    }
  });
}

function processInlineMath(s: string, katexRender?: KatexRender): string {
  return s.replace(/(?<!\$)\$([^\n\$]+?)\$(?!\$)/g, (m, inner: string) => {
    const content = (inner || "").trim();
    if (!content) return "";
    if (!katexRender) return `$${content}$`;
    try {
      katexRender(content, { throwOnError: false });
      return `$${content}$`;
    } catch {
      return content;
    }
  });
}

function protectCode(tokens: string[], s: string): string {
  s = s.replace(/```([\w+-]*)\s*([\s\S]*?)```/g, (m) => {
    const idx = tokens.push(m) - 1;
    return `\uE000TOK${idx}\uE000`;
  });
  s = s.replace(/(`+)([\s\S]*?)(\1)/g, (m) => {
    const idx = tokens.push(m) - 1;
    return `\uE000TOK${idx}\uE000`;
  });
  return s;
}

function restoreTokens(tokens: string[], s: string): string {
  return s.replace(/\uE000TOK(\d+)\uE000/g, (_, i: string) => tokens[Number(i)] ?? "");
}