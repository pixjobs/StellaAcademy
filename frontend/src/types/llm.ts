/**
 * =========================================================================
 * LLM & JOB TYPE DEFINITIONS
 *
 * This file is the single source of truth for the data structures related
 * to the BullMQ worker, including job payloads, results, and API types.
 * =========================================================================
 */

/* --------------------------------- Roles --------------------------------- */

export type Role = 'explorer' | 'cadet' | 'scholar';

/** All valid roles (runtime validation). */
export const ALL_ROLES: Role[] = ['explorer', 'cadet', 'scholar'];

/** Runtime type guard for Role. */
export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ALL_ROLES as string[]).includes(v);
}

/* ----------------------------- Mission Types ----------------------------- */

/** Canonical mission types. Keep this union authoritative. */
export type MissionType =
  | 'rocket-lab'
  | 'rover-cam'
  | 'space-poster'
  | 'earth-observer'
  | 'celestial-investigator';

/** Runtime list for validation. */
export const ALL_MISSION_TYPES: MissionType[] = [
  'rocket-lab',
  'rover-cam',
  'space-poster',
  'earth-observer',
  'celestial-investigator',
];

/** Runtime type guard for MissionType. */
export function isMissionType(v: unknown): v is MissionType {
  return typeof v === 'string' && (ALL_MISSION_TYPES as string[]).includes(v);
}

/* --------------------------- External API Types -------------------------- */
/** Mars Rover Photo API (NASA) */

export type MarsCamera = {
  id: number;
  name: string; // e.g., "FHAZ", "NAVCAM"
  rover_id: number;
  full_name: string; // e.g., "Front Hazard Avoidance Camera"
};

export type MarsRover = {
  id: number;
  name: string; // e.g., "Curiosity"
  landing_date: string;
  launch_date: string;
  status: string;
};

export type MarsPhoto = {
  id: number;
  sol: number;
  camera: MarsCamera;
  img_src: string;
  earth_date: string;
  rover: MarsRover;
};

/* ---------------------- Mission & Topic Data Structures ------------------- */

export type Img = {
  title: string;
  href: string;
};

export type EnrichedTopic = {
  title: string;
  summary: string;
  images: Img[];
  keywords?: string[];
};

export type EnrichedMissionPlan = {
  missionTitle: string;
  introduction: string;
  topics: EnrichedTopic[];
};

/* ----------------------------- Chat Primitives --------------------------- */

/** Common message shape used by tutor-preflight starter messages, etc. */
export type ChatMessage = {
  id: string;
  role: 'stella' | 'user';
  text: string;
};

/* ---------------------- BullMQ Job & Payload Types ----------------------- */

export interface LlmMissionPayload {
  missionType: MissionType;
  role: Role;
}

export interface LlmAskPayload {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
}

/**
 * New: Tutor Preflight
 * Generates role-aware system prompt, starter messages, warmup, goals, and difficulty hints.
 */
export type TutorPreflightInput = {
  mission: string;       // e.g., 'rocket-lab'
  topicTitle: string;    // e.g., 'Thrust'
  topicSummary: string;  // short summary text
  imageTitle?: string;   // selected image title (optional)
  role: Role;            // 'explorer' | 'cadet' | 'scholar'
};

export type TutorPreflightOutput = {
  systemPrompt: string;
  starterMessages: ChatMessage[]; // typically 1–2 Stella messages to open
  warmupQuestion: string;
  goalSuggestions: string[];      // 2–3 short goals
  difficultyHints: {
    easy: string;
    standard: string;
    challenge: string;
  };
};

/* ----------------------------- Job Data (Union) -------------------------- */

export interface MissionJobData {
  type: 'mission';
  payload: LlmMissionPayload;
  cacheKey?: string;
}

export interface AskJobData {
  type: 'ask';
  payload: LlmAskPayload;
  cacheKey?: string;
}

export interface TutorPreflightJobData {
  type: 'tutor-preflight';
  payload: TutorPreflightInput;
  cacheKey?: string;
}

/** Union of all job inputs sent to the worker. */
export type LlmJobData =
  | MissionJobData
  | AskJobData
  | TutorPreflightJobData;

/* -------------------------- BullMQ Job Result Types ---------------------- */

export interface AskResult {
  answer: string;
  tokens?: { input?: number; output?: number; timeMs?: number };
}

export type LlmJobResult =
  | { type: 'mission'; result: EnrichedMissionPlan }
  | { type: 'ask'; result: AskResult }
  | { type: 'tutor-preflight'; result: TutorPreflightOutput };
