/**
 * =========================================================================
 * UTILITIES, TYPE GUARDS & HELPERS
 *
 * This module contains general-purpose helper functions, type guards,
 * LLM interaction helpers, and content hashing logic for the worker.
 * =========================================================================
 */

import { createHash } from 'crypto';

// --- DYNAMIC IMPORTS FROM THE SINGLE SOURCE OF TRUTH ---
import { ALL_ROLES, ALL_MISSION_TYPES } from '@/types/llm';
import type { Role, MissionType } from '@/types/llm';
import type { EnrichedMissionPlan } from '@/types/mission';

/* -------------------------------------------------------------------------- */
/*                              General Helpers                               */
/* -------------------------------------------------------------------------- */

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

/**
 * Returns a new array with only unique values.
 */
export function uniq<T>(arr: (T | null | undefined)[]): T[] {
  return Array.from(new Set(arr.filter((x): x is T => x != null)));
}

/* -------------------------------------------------------------------------- */
/*                                 Type Guards                                */
/* -------------------------------------------------------------------------- */

/**
 * A generic type guard to check if a value is a non-null object.
 */
export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/**
 * A type guard that dynamically checks if a value is a valid Role.
 * It uses the imported ALL_ROLES constant as its single source of truth.
 */
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ALL_ROLES as readonly string[]).includes(value);
}

/**
 * A type guard that dynamically checks if a value is a valid MissionType.
 * It uses the imported ALL_MISSION_TYPES constant as its single source of truth.
 */
export function isMissionType(value: unknown): value is MissionType {
  return typeof value === 'string' && (ALL_MISSION_TYPES as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/*                            LLM Prompt/Parse Helpers                        */
/* -------------------------------------------------------------------------- */

/**
 * Role-aware system prompt for the tutor preflight.
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
 * Removes markdown code fences (e.g., ```json) from a string.
 */
export function stripFences(s: string): string {
  return s ? s.replace(/```json\s*([\s\S]*?)```/gi, '$1').replace(/```\s*([\s\S]*?)```/gi, '$1').trim() : '';
}

/** Safe JSON extractor: returns parsed JSON object of type T or throws */
export function extractJson<T = unknown>(raw: string, matcher: RegExp = /\{[\s\S]*\}$/m): T {
  const match = raw.match(matcher);
  if (!match || !match[0]) {
    throw new Error('extractJson: no JSON match found');
  }
  return JSON.parse(match[0]) as T;
}

/** Variant that returns null instead of throwing */
export function extractJsonOrNull<T = unknown>(raw: string, matcher: RegExp = /\{[\s\S]*\}$/m): T | null {
  const match = raw.match(matcher);
  if (!match || !match[0]) return null;
  try {
    const parsed = JSON.parse(match[0]) as T;
    return parsed ?? null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Content Hashing                               */
/* -------------------------------------------------------------------------- */

/**
 * Creates a stable SHA-256 hash from the core text content of a mission plan.
 * This is used to detect and prevent content-wise duplicates.
 */
export function hashMissionPlan(plan: EnrichedMissionPlan): string {
  // Create a consistent string representation of the mission's core content.
  const content = [
    plan.missionTitle,
    ...plan.topics.map(t => `${t.title}:${t.summary}`)
  ].join('|').toLowerCase().trim();
  
  return createHash('sha256').update(content).digest('hex');
}

/* -------------------------------------------------------------------------- */
/*                              Caching Helpers                               */
/* -------------------------------------------------------------------------- */

/**
 * Creates a stable cache key for tutor-preflight results.
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