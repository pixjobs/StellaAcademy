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