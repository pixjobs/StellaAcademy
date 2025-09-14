/* eslint-disable no-console */

/** strip ``` fences commonly returned by LLMs */
export function stripFences(s: string): string {
  return s ? s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1').trim() : '';
}

/** tolerant JSON.parse for objects */
export function extractJson<T = unknown>(text: string): T | null {
  const cleaned = stripFences(text);
  try { return JSON.parse(cleaned) as T; } catch { /* try to find first brace pair */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)) as T; } catch { /* ignore */ }
  }
  return null;
}

/** tolerant array extractor (balanced-bracket scan) */
export function extractFirstJsonArray(text: string): unknown[] | null {
  const cleaned = stripFences(text);
  const start = cleaned.indexOf('[');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(cleaned.slice(start, i + 1));
          return Array.isArray(parsed) ? parsed : null;
        } catch { return null; }
      }
    }
  }
  return null;
}
