/**
 * =========================================================================
 * LLM & JOB TYPE DEFINITIONS
 *
 * This file is the single source of truth for the data structures related
 * to the BullMQ worker, including job payloads, results, and API types.
 * =========================================================================
 */

export type Role = 'explorer' | 'cadet' | 'scholar';

/**
 * A runtime constant containing all valid Role types.
 * This is used by type guards to validate data at runtime, ensuring this
 * file remains the single source of truth.
 */
export const ALL_ROLES: Role[] = ['explorer', 'cadet', 'scholar'];

// ---------- CANONICAL MISSION TYPE ----------
// This is the single source of truth for all valid mission types in the application.
export type MissionType =
  | 'rocket-lab'
  | 'rover-cam'
  | 'space-poster'
  | 'earth-observer'
  | 'celestial-investigator';

// --- NEW: RUNTIME VALIDATION ARRAY ---
// This constant is derived from the type above and is used for runtime checks.
// If you add a new MissionType to the union type, you MUST also add it here.
// TypeScript will help enforce this.
export const ALL_MISSION_TYPES: MissionType[] = [
  'rocket-lab',
  'rover-cam',
  'space-poster',
  'earth-observer',
  'celestial-investigator',
];



// ---------- Mars Rover Photo API Types ----------
// These types accurately reflect the data from the NASA Mars Rover API.

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


// ---------- Mission & Topic Data Structures ----------
// These types define the final, structured data that the worker produces.

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


// ---------- BullMQ Job & Payload Types ----------
// These define the structure of the data sent to the worker queue.

export interface LlmMissionPayload {
  missionType: MissionType;
  role: Role; // This was missing and is now correctly included.
}

export interface LlmAskPayload {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
}

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

// LlmJobData is a union of all possible job types.
export type LlmJobData = MissionJobData | AskJobData;


// ---------- BullMQ Job Result Types ----------
// These define the structure of the data the worker returns upon completion.

export interface AskResult {
  answer: string;
  tokens?: { input?: number; output?: number; timeMs?: number };
}

export type LlmJobResult =
  | { type: 'mission'; result: EnrichedMissionPlan }
  | { type: 'ask'; result: AskResult };