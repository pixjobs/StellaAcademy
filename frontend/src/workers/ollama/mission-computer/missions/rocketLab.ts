/* eslint-disable no-console */

/**
 * @file rocketLab.ts
 * @description Generates a mission plan focused on the technical aspects of rocketry.
 * It uses an LLM to create topics and then enriches them with fresh, unique images
 * and videos from the NASA Image and Video Library, using sanitized, keyword-based searches.
 */

import type { WorkerContext } from '../../context';
import type { Role } from '@/types/llm';
import type { EnrichedMissionPlan, Img } from '@/types/mission';
import {
  ensureMissionPlan,
  ensureTopic,
  extractFirstJsonArray,
  requireBottleneck,
  retry,
  tryNivlQueries,
  logger, // <- re-exported from ../shared/core
} from '../shared/core';
import { templates } from '../../prompts/templates';
import { makeVariety } from '../shared/variety';
import { llmCall } from '../shared/llm-call';

// --- Types ---

type RawTopic = { title: string; summary: string; keywords: string[]; searchQueries: string[] };
type RawMission = { topics: RawTopic[] };

// --- Helpers ---

function validate(raw: unknown): RawMission {
  const o = (typeof raw === 'object' && raw ? (raw as Record<string, unknown>) : {});
  const topics = Array.isArray(o.topics) ? o.topics : [];
  return {
    topics: topics.slice(0, 8).map((t): RawTopic => {
      const to = (typeof t === 'object' && t ? (t as Record<string, unknown>) : {});
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
  if (templates && typeof templates.rocketLabTopics === 'function') {
    try {
      return templates.rocketLabTopics(audience(role), variety, contextLines);
    } catch {
      // fall through to inline prompt if template throws
    }
  }
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

function sanitizeSearchSeeds(topic: RawTopic): string[] {
  if (topic.keywords.length > 0) {
    return topic.keywords;
  }
  const sourceText = topic.searchQueries.length > 0 ? topic.searchQueries.join(' ') : topic.title;

  const stopWords = new Set([
    'a', 'an', 'and', 'the', 'is', 'in', 'it', 'of', 'for', 'on', 'with',
    'how', 'what', 'when', 'where', 'why', 'to', 'from', 'by', 'as', 'at'
  ]);

  const cleanedKeywords = sourceText
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  if (cleanedKeywords.length > 0) {
    return Array.from(new Set(cleanedKeywords)).slice(0, 5);
  }
  return ['rocket', 'engine'];
}

// --- Main Mission Function ---

export async function missionRocketLab(
  role: Role,
  context: WorkerContext,
  opts?: { seedIndex?: number; attempt?: number },
): Promise<EnrichedMissionPlan> {
  // ---- local config ----
  const NIVL_SEED_LIMIT = 6;             // how many seed lines we pass to the LLM
  const MIN_TOPICS = 2;
  const MAX_TOPICS = 4;                   // hard cap mission width
  const MAX_DUPES_BEFORE_STOP = 2;        // stop enriching if we keep hitting dupes
  const MIN_IMAGES_PER_TOPIC = 3;         // consider a topic "rich" if it reaches this
  const NIVL_LIMIT_PER_QUERY = 4;         // per topic, per seed
  const LLM_SOFT_MS = 9_000;              // advisory soft cap for llmCall
  const LLM_HARD_MS = 25_000;             // absolute cap for llmCall

  // Ensure the bottleneck exists (for observability & gating)
  const bottleneck = requireBottleneck(context);
  {
    const anyBn = bottleneck as unknown as { running?: unknown; queued?: unknown };
    logger.debug('[RocketLab] bottleneck status', {
      running: typeof anyBn.running === 'number' ? anyBn.running : undefined,
      queued:  typeof anyBn.queued  === 'number' ? anyBn.queued  : undefined,
    });
  }

  // 1) Seed the LLM with small, fresh NIVL references
  let contextLines: string[] = [];
  try {
    const seeds = ['liquid rocket engine','staging','nozzle expansion','guidance','payload fairing'];
    const imgs = await retry(
      () => tryNivlQueries(seeds, {
        limitPerQuery: 4,
        mediaTypes: ['image', 'video'],
        randomizePage: true,
      }),
      { attempts: 2 },
    );
    contextLines = imgs.slice(0, NIVL_SEED_LIMIT).map(i => `${i.title ?? 'Untitled'} — ${i.href}`);
    logger.debug('[RocketLab] NIVL seed collected', { seeds, count: imgs.length });
  } catch (e) {
    logger.warn('[RocketLab] NIVL seed failed; continuing without context lines.', e);
  }

  // 2) Prepare and call the LLM to generate compact, varied topics
  const seed = (opts?.seedIndex ?? Date.now()) >>> 0;
  const attempt = Math.max(1, opts?.attempt ?? 1);
  const variety = makeVariety(seed, role, 'rocket-lab', attempt, [contextLines.length]);
  const system = buildPrompt(role, variety, contextLines);

  let topicSpecs: RawTopic[] = [];
  try {
    const raw = await llmCall(context, system, {
      dedupeTrackerKey: 'rocket-lab',
      softMs: LLM_SOFT_MS,
      hardMs: LLM_HARD_MS,
      maxRetries: 1,
      concurrencyGate: bottleneck,
    });

    const parsed = extractFirstJsonArray(raw) ?? [];
    const validated = validate({ topics: parsed }).topics;

    // Clamp count & filter empties
    topicSpecs = validated
      .filter(t => (t.title?.trim().length ?? 0) > 0)
      .slice(0, MAX_TOPICS);

    if (topicSpecs.length < MIN_TOPICS) {
      logger.warn('[RocketLab] LLM returned too few topics; augmenting with fallback.');
      topicSpecs = [...topicSpecs, ...fallbackTopics()].slice(0, Math.max(MIN_TOPICS, MAX_TOPICS));
    }
  } catch (e) {
    logger.warn('[RocketLab] LLM failed; using fallback topics.', e);
    topicSpecs = fallbackTopics().slice(0, MAX_TOPICS);
  }

  // 3) Enrich each topic with NASA media—sequentially—stop if dupes persist
  const globalSeen = new Set<string>();   // dedupe across the whole mission
  const finalTopics: ReturnType<typeof ensureTopic>[] = [];
  let dupeStreak = 0;

  for (const t of topicSpecs) {
    if (dupeStreak >= MAX_DUPES_BEFORE_STOP) {
      logger.warn('[RocketLab] Stopping early due to repeated duplicate scarcity.');
      break;
    }

    const seeds = sanitizeSearchSeeds(t);
    let images: Img[] = [];

    try {
      const fetched = await retry(
        () => tryNivlQueries(seeds, {
          limitPerQuery: NIVL_LIMIT_PER_QUERY,
          mediaTypes: ['image', 'video'],
          randomizePage: true,
        }),
        { attempts: 2 },
      );

      // Deduplicate across mission; keep only first hits
      const unique: Img[] = [];
      for (const im of fetched) {
        if (!im.href) continue;
        if (globalSeen.has(im.href)) continue;
        globalSeen.add(im.href);
        unique.push(im);
        if (unique.length >= Math.max(MIN_IMAGES_PER_TOPIC, 6)) break;
      }
      images = unique;

      // Track dupe scarcity; if low uniques, increment streak
      if (images.length < MIN_IMAGES_PER_TOPIC) {
        dupeStreak++;
        logger.debug('[RocketLab] low unique yield for topic', { title: t.title, uniques: images.length, dupeStreak });
      } else {
        dupeStreak = 0;
      }
    } catch (e) {
      logger.warn('[RocketLab] NIVL enrichment failed for topic', { title: t.title, error: e });
    }

    finalTopics.push(ensureTopic({ ...t, images }));
    if (finalTopics.length >= MAX_TOPICS) break; // hard cap mission size
  }

  // Safety net: ensure at least MIN_TOPICS
  const safeTopics = finalTopics.length
    ? finalTopics
    : fallbackTopics().slice(0, MIN_TOPICS).map(t => ensureTopic({ ...t, images: [] }));

  // 4) Return the final, bounded mission
  return ensureMissionPlan({
    missionTitle: `Rocket Lab — ${variety.lens.replace(/-/g, ' ')}`,
    introduction: `Analyze key rocket systems using a ${variety.lens} lens with a ${variety.output} format. You’ll also tackle a “${variety.challenge}” mini-challenge.`,
    topics: safeTopics,
  });
}
