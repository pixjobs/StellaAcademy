/* Central place to version & snapshot prompts */
export const PROMPT_VERSION = 'v3.2.0';

export const headers = {
  banner: (ctx: { name: string; seed?: string | number; novelty?: string }) =>
    [
      `# ${ctx.name} • ${PROMPT_VERSION}`,
      ctx.seed !== undefined ? `seed: ${ctx.seed}` : null,
      ctx.novelty ? `novelty: ${ctx.novelty}` : null,
      'Always follow the output schema exactly.',
    ].filter(Boolean).join('\n'),
};

function t(strings: TemplateStringsArray, ...vals: unknown[]) {
  return strings.reduce((acc, s, i) => acc + s + (i < vals.length ? String(vals[i]) : ''), '').trim();
}

export const templates = {
  rocketLabTopics: (aud: { level: string; promptNote: string }, variety: {
    lens: string; output: string; challenge: string;
  }, contextLines: string[]) => t`
${headers.banner({ name: 'Rocket Lab — Topics', novelty: `${variety.lens}/${variety.output}/${variety.challenge}` })}

You will propose *distinct* subtopics for a Rocket Lab mission.
Use the **variety constraints**:
- Lens: ${variety.lens}
- Output format: ${variety.output}
- Challenge: ${variety.challenge}

Context (may inspire queries/keywords; do NOT copy text verbatim):
${contextLines.map((l) => `• ${l}`).join('\n')}

Return ONLY a JSON array of 3–5 topic objects with this schema:
[
  { "title": "Topic Title", "summary": "1–2 sentences (${aud.level})", "keywords": ["k1","k2"], "searchQueries": ["q1","q2"] }
]

Guidelines:
- Each topic must reflect the lens & output format.
- Exactly ONE topic must set up the challenge type "${variety.challenge}" explicitly in its summary.
- Avoid repeating nouns across titles; keep them educational, specific, and non-generic.
- Audience: ${aud.level}. ${aud.promptNote}
`,

  spacePosterTopics: (aud: { level: string; promptNote: string }, variety: {
    lens: string; output: string; challenge: string;
  }, apodLine: string | null, nivlLines: string[]) => t`
${headers.banner({ name: 'Space Poster — Topics', novelty: `${variety.lens}/${variety.output}/${variety.challenge}` })}

Design an educational one-page poster plan with varied sub-panels.
Use the **variety constraints**:
- Lens: ${variety.lens}
- Output format: ${variety.output}
- Challenge: ${variety.challenge}

Inspiration (titles/links only; do NOT quote long text):
${apodLine ? `• APOD: ${apodLine}` : '• APOD unavailable'}
${nivlLines.length ? nivlLines.map((l) => `• ${l}`).join('\n') : '• No NIVL items discovered'}

Return ONLY a JSON array of 3–5 topic objects with this schema:
[
  { "title": "Panel Title", "summary": "1–2 sentences (${aud.level})", "keywords": ["k1","k2"], "searchQueries": ["q1","q2"] }
]

Rules:
- At least one panel compares two objects (galaxy vs. nebula, etc.).
- At least one panel contains a mini “how to read the image” legend.
- One panel must embed the challenge type "${variety.challenge}" (e.g., “Predict which region forms stars faster and why”).
- Titles must be concrete and non-overlapping.
- Audience: ${aud.level}. ${aud.promptNote}
`,

  askSystem: (audNote: string) => t`
${headers.banner({ name: 'Stella Tutor — Q&A' })}
You are Stella, a concise, friendly tutor. ${audNote}
If math is needed, show reasoning succinctly. Prefer bullet points where useful.
`,

  tutorSystem: (args: {
    roleLabel: string; mission: string; topicTitle: string; imageTitle?: string; audNote: string;
  }) => t`
${headers.banner({ name: 'Stella Tutor — Preflight' })}
Role: ${args.roleLabel}
Mission: ${args.mission}
Topic: ${args.topicTitle}
${args.imageTitle ? `Image: ${args.imageTitle}` : ''}
${args.audNote}

Return JSON ONLY with:
{
  "systemPrompt": string,
  "starterMessages": [{ "id": string, "role": "stella", "text": string }],
  "warmupQuestion": string,
  "goalSuggestions": [string, ...],
  "difficultyHints": { "easy": string, "standard": string, "challenge": string }
}
`,

  tutorUser: (topicSummary: string) => t`
Using this topic summary, propose a warm, motivating starter and a short warmup question:

${topicSummary}
`,

  askUser: (question: string, context?: string) => t`
Answer the user's question clearly and briefly.
${context ? `Context: ${context}` : ''}
Question: ${question}
`,
};
