// utils/normalizeMath.ts
// Convert \( … \) / \[ … \] and naked LaTeX lines → $…$ / $$…$$ for remark-math
export function normalizeMathForMarkdown(src: string): string {
  if (!src) return '';

  let s = src.replace(/\r\n?/g, '\n');

  // 1) \( … \)  -> $…$
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_, m) => `$${m.trim()}$`);

  // 2) \[ … \]  -> $$…$$
  s = s.replace(/\\\[((?:[\s\S]*?))\\\]/g, (_, m) => `\n$$\n${m.trim()}\n$$\n`);

  // 3) Merge "$$\n$$ X $$" pattern if present
  s = s.replace(/\$\$\s*\n\s*\$\$\s*([^\$]+?)\s*\$\$/g, (_, inner) => `$$${(inner||'').trim()}$$`);

  // 4) Wrap “naked” LaTeX lines as block math (skip if already has $)
  const latexToken = /\\(frac|dfrac|tfrac|int|sum|prod|left|right|cdot|times|mathbf|boldsymbol|vec|bar|hat|tilde|gamma|beta|alpha|sigma|theta|phi|approx|le|ge|neq|infty|partial|nabla)|[\^_]/;
  s = s.split('\n').map((line) => {
    const t = line.trim();
    if (!t) return line;
    if (t.startsWith('$$') || /(^|[^\\])\$/.test(t)) return line; // already math
    // standalone formula-ish line
    if (latexToken.test(t) && (/=/.test(t) || /^[\\]/.test(t))) {
      return `$$\n${t}\n$$`;
    }
    return line;
  }).join('\n');

  // 5) Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}
