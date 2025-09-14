/* eslint-disable no-console */
import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, Img } from '@/types/mission';
import { callOllama } from '../../ollama-client';
import {
  ensureMissionPlan,
  ensureTopic,
  extractFirstJsonArray,
  hasNasaApiKey,
  requireBottleneck,
  retry,
  tryNivlQueries,
  logNasa,
} from '../shared/core';
import { templates } from '../../prompts/templates';
import { makeVariety } from '../shared/variety';

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { topics: RawTopic[] };

function validate(raw: unknown): RawMission {
  const o = (typeof raw === 'object' && raw) ? (raw as Record<string, unknown>) : {};
  const topics = Array.isArray(o.topics) ? o.topics : [];
  return {
    topics: topics.slice(0, 8).map((t): RawTopic => {
      const to = (typeof t === 'object' && t) ? (t as Record<string, unknown>) : {};
      return {
        title: typeof to.title === 'string' ? to.title.slice(0, 160) : 'Topic',
        summary: typeof to.summary === 'string' ? to.summary.slice(0, 500) : '',
        keywords: Array.isArray(to.keywords)
          ? (to.keywords as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 5)
          : [],
        searchQueries: Array.isArray(to.searchQueries)
          ? (to.searchQueries as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 5)
          : [],
      };
    }),
  };
}

function audience(role: Role): { level: string; promptNote: string } {
  switch (role) {
    case 'explorer': return { level: 'kids (8–12)', promptNote: 'Short, friendly sentences.' };
    case 'cadet':    return { level: 'teens',       promptNote: 'Clear, energetic; light terms.' };
    case 'scholar':  return { level: 'undergrad',   promptNote: 'Concise & technical.' };
    default:         return { level: 'general',     promptNote: 'Clear & precise.' };
  }
}

function buildPrompt(
  role: Role,
  variety: { lens: string; output: string; challenge: string },
  contextLines: string[],
): string {
  // Prefer your shared template if it supports (aud, variety, contextLines)
  if (templates && typeof templates.rocketLabTopics === 'function') {
    try {
      // @ts-expect-error: allow extended signature; template is under active dev
      return templates.rocketLabTopics(audience(role), variety, contextLines);
    } catch {
      // fall through to inline prompt
    }
  }

  // Inline prompt (fallback) – JSON-only schema + variety + tiny NASA context
  return [
    `# Rocket Lab — Topics`,
    `Lens: ${variety.lens} | Output: ${variety.output} | Mini-challenge: ${variety.challenge}`,
    contextLines.length
      ? `Context (NASA references, use for variety – do not copy):\n${contextLines.map((l, i) => `- ${i + 1}. ${l}`).join('\n')}`
      : '',
    '',
    'Return ONLY a JSON array of 3–5 topic objects with this exact schema:',
    '[',
    '  { "title": "Topic Title", "summary": "1–2 sentences", "keywords": ["k1","k2"], "searchQueries": ["q1","q2"] }',
    ']',
    'Guidelines:',
    '- Focus on rocket components, orbital mechanics, or launch procedures.',
    `- Audience: ${audience(role).level}. ${audience(role).promptNote}`,
    '- Avoid generic “history of rocketry” topics; be specific and technical.',
    '- Each topic should be distinct (no near-duplicates).',
  ].filter(Boolean).join('\n');
}

function fallbackTopics(): RawTopic[] {
  return [
    {
      title: 'How Staging Boosts Altitude',
      summary: 'Dropping empty mass increases delta-v and reduces gravity losses.',
      keywords: ['staging', 'delta-v', 'mass ratio'],
      searchQueries: ['rocket staging delta-v', 'tsiolkovsky mass ratio staging'],
    },
    {
      title: 'Nozzle Expansion & Thrust',
      summary: 'Matching expansion ratio to altitude for optimal performance.',
      keywords: ['nozzle', 'expansion ratio', 'altitude'],
      searchQueries: ['rocket nozzle expansion ratio altitude optimal'],
    },
    {
      title: 'Guidance & Control',
      summary: 'Gimbal, fins, and RCS: how rockets steer and maintain attitude.',
      keywords: ['gimbal', 'guidance', 'control', 'RCS'],
      searchQueries: ['rocket guidance gimbal RCS attitude control'],
    },
  ];
}

export async function missionRocketLab(
  role: Role,
  context: WorkerContext,
  opts?: { seedIndex?: number; attempt?: number },
): Promise<EnrichedMissionPlan> {
  const bottleneck = requireBottleneck(context);

  // Tiny NASA context (optional): seed variety for the LLM
  let contextLines: string[] = [];
  if (hasNasaApiKey()) {
    try {
      const seeds = ['liquid rocket engine', 'staging', 'nozzle expansion', 'guidance', 'payload fairing'];
      const imgs = await retry(() => tryNivlQueries(seeds, context.redis, 4), { attempts: 2 });
      contextLines = imgs.slice(0, 6).map((i) => `${i.title} — ${i.href}`);
    } catch (e) {
      console.warn('[mission][nasa] NIVL seed failed (rocket-lab). Continuing.', e);
    }
  }

  const seed = (opts?.seedIndex ?? Date.now()) >>> 0;
  const attempt = Math.max(1, opts?.attempt ?? 1);
  const variety = makeVariety(seed, role, 'rocket-lab', attempt, [contextLines.length]);

  const system = buildPrompt(role, variety, contextLines);

  let llmOut = '';
  try {
    llmOut = await Promise.race([
      bottleneck.submit(() => callOllama(system, { temperature: 0.85 })),
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error('rocket-lab-llm timed out after 12000ms')), 12_000)),
    ]) as string;
  } catch (e) {
    console.warn('[mission][llm] rocket-lab LLM timed out/failed; using fallback topics.', e);
    llmOut = JSON.stringify(fallbackTopics());
  }

  const parsed = extractFirstJsonArray(llmOut) ?? [];
  const base = validate({ topics: parsed });

  const sourceTopics = base.topics.length ? base.topics : fallbackTopics();

  const topics = await Promise.all(
    sourceTopics.map(async (t) => {
      const seeds = t.searchQueries.length
        ? t.searchQueries
        : t.keywords.length
          ? t.keywords
          : [t.title];

      let images: Img[] = [];
      if (hasNasaApiKey()) {
        try {
          images = await retry(() => tryNivlQueries(seeds, context.redis, 5), { attempts: 2 });
          logNasa('RocketLab NIVL', { seeds, images: images.length });
        } catch (e) {
          console.warn('[mission][nasa] NIVL failed (rocket-lab).', e);
        }
      }
      return ensureTopic({ ...t, images });
    })
  );

  // Guarantee a non-empty plan
  const safeTopics = topics.length ? topics : fallbackTopics().map((t) => ensureTopic({ ...t, images: [] }));

  return ensureMissionPlan({
    missionTitle: `Rocket Lab — ${variety.lens.replace(/-/g, ' ')}`,
    introduction: `Analyze key rocket systems using a ${variety.lens} lens with a ${variety.output} format. You’ll also tackle a “${variety.challenge}” mini-challenge.`,
    topics: safeTopics,
  });
}
