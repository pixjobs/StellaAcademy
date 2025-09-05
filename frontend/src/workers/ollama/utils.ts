/**
 * =========================================================================
 * UTILITIES & TYPE GUARDS
 *
 * This module contains general-purpose helper functions and, critically,
 * type guards that validate data against the canonical types defined in
 * the central `types` directory.
 * =========================================================================
 */

// --- DYNAMIC IMPORTS FROM THE SINGLE SOURCE OF TRUTH ---
// We import both the types and the runtime constants for validation.
import { ALL_ROLES, ALL_MISSION_TYPES } from '@/types/llm';
import type { Role, MissionType } from '@/types/llm';

/**
 * Clamps a numeric value from a string within a given range.
 * @param v The string value to parse.
 * @param min The minimum allowed value.
 * @param max The maximum allowed value.
 * @param fallback The value to return if parsing fails.
 * @returns The clamped number.
 */
export function clampInt(v: string | undefined, min: number, max: number, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/**
 * A simple promise-based sleep function.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Masks the password in a Redis URL for safe logging.
 */
export function maskRedisUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    if (url.password) url.password = '****';
    return url.toString();
  } catch {
    // Return the original string if it's not a valid URL
    return u;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Type Guards                                */
/* -------------------------------------------------------------------------- */

/**
 * A type guard that dynamically checks if a value is a valid Role.
 * It uses the imported ALL_ROLES constant as its single source of truth.
 */
export function isRole(value: unknown): value is Role {
  // The local `VALID_ROLES` array has been removed.
  return typeof value === 'string' && (ALL_ROLES as string[]).includes(value);
}

/**
 * A type guard that dynamically checks if a value is a valid MissionType.
 * It uses the imported ALL_MISSION_TYPES constant as its single source of truth.
 */
export function isMissionType(value: unknown): value is MissionType {
  // The local `VALID_MISSION_TYPES` array has been removed.
  return typeof value === 'string' && (ALL_MISSION_TYPES as string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/*                            LLM Prompt/Parse Helpers                        */
/* -------------------------------------------------------------------------- */

/**
 * Role-aware system prompt for the tutor preflight.
 * Keep this pure so it can be used from API routes, workers, or tests.
 */
export function buildTutorSystem(role: Role, mission: string, topic: string, imageTitle?: string): string {
  return [
    `You are "Stella", an AI tutor.`,
    `Role: ${role}.`,
    `Mission: ${mission}. Topic: ${topic}.`,
    imageTitle ? `Selected image: ${imageTitle}.` : '',
    '',
    'Constraints:',
    '- Match the role style and age.',
    '- Keep responses brief (2–6 sentences) and actionable.',
    '- Ask checks for understanding; never invent facts.',
    '- Stay on-mission; keep safety and accuracy in mind.',
    '- When requested, output STRICT JSON with no extra text.',
  ].join('\n');
}

/**
 * User prompt that requests strict JSON for the tutor preflight.
 * The schema lives here to keep one source of truth.
 */
export function buildTutorUser(topicSummary: string): string {
  return [
    `Use this topic summary to personalize: "${topicSummary}".`,
    'Return JSON exactly with this shape:',
    `{
      "systemPrompt": string,
      "starterMessages": [
        { "id": "stella-hello", "role": "stella", "text": string },
        { "id": "stella-check", "role": "stella", "text": string }
      ],
      "warmupQuestion": string,
      "goalSuggestions": string[],
      "difficultyHints": { "easy": string, "standard": string, "challenge": string }
    }`,
    'No markdown, no commentary — JSON only.',
  ].join('\n');
}

/**
 * Harden an ad-hoc ask prompt with optional context.
 */
export function hardenAskPrompt(prompt: string, context?: string): string {
  if (context && context.trim()) {
    return `Use the following context to answer the question.\n--- CONTEXT START ---\n${context}\n--- CONTEXT END ---\n\nQUESTION:\n${prompt}`.trim();
  }
  return prompt;
}

/**
 * Robustly extract JSON from LLM output.
 * - First try direct JSON.parse
 * - Fallback: grab the last {...} block
 */
export function extractJson<T = unknown>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}$/);
    if (!m) throw new Error('extractJson: could not locate JSON object in model output');
    return JSON.parse(m[0]) as T;
  }
}

/**
 * Optional: stable cache key for tutor-preflight results.
 */
export function preflightCacheKey(params: {
  role: Role;
  mission: string;
  topicTitle: string;
  imageTitle?: string;
}) {
  const { role, mission, topicTitle, imageTitle } = params;
  return ['tutor-preflight', role, mission, topicTitle, imageTitle ?? 'no-image']
    .map(s => s.replace(/\s+/g, '_'))
    .join(':')
    .toLowerCase();
}