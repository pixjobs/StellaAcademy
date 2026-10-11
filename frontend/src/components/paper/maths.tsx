import katex from 'katex';

/** Maths rendered on the server, so formulas are in the HTML with no flash and no client code. */
export function Tex({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block });
  // Input is our own lesson data, rendered by KaTeX to markup.
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Lesson text with $inline maths$, **bold** and [links](x) (links shown as plain text here). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(?<!\\)\$/);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) return <Tex key={i} tex={part} />;
        const plain = part.replace(/\\\$/g, '$').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        return plain.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
          seg.startsWith('**') && seg.endsWith('**') && seg.length > 4 ? (
            <strong key={`${i}-${j}`}>{seg.slice(2, -2)}</strong>
          ) : (
            <span key={`${i}-${j}`}>{seg}</span>
          ),
        );
      })}
    </>
  );
}
