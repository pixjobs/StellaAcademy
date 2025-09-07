/**
 * =========================================================================
 * LLM & JOB TYPE DEFINITIONS
 *
 * Single source of truth for BullMQ worker payloads/results, API types,
 * retrieval metadata, and optional link/citation structures.
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

/** Optional structured link metadata you can render as “Source” cards. */
export type LinkPreview = {
  url: string;
  title?: string;
  faviconUrl?: string; // e.g., icons.duckduckgo.com/ip3/<host>.ico
  snippet?: string;    // short description from search result
  meta?: string;       // any extra meta you want to surface
};

/** Optional inline citation marker (for superscripts/footnotes). */
export type InlineCitation = {
  index: number;       // 1-based marker used in text, e.g. [^1] or ¹
  url: string;
  title?: string;
};

/** Common message shape used by tutor-preflight starter messages, etc. */
export type ChatMessage = {
  id: string;
  role: 'stella' | 'user';
  text: string;

  /**
   * Optional: structured links to show under the message (e.g., “Sources”).
   * UI can fall back to auto-extracting raw URLs from `text` if empty.
   */
  links?: LinkPreview[];

  /**
   * Optional: inline citations you can map to superscripts in the rendered text.
   * You can ignore this if you prefer simple `links` rendering.
   */
  citations?: InlineCitation[];
};

/* -------------------------- Retrieval & Telemetry ------------------------- */

/** Controls for worker-side retrieval (e.g., Google CSE). */
export type RetrievalOptions = {
  /** Enable retrieval; if false/undefined, skip. */
  enable?: boolean;

  /** Optional explicit query; otherwise worker derives from prompt/context. */
  qOverride?: string;

  /** Number of results to fetch (worker may cap). */
  num?: number;

  /** Timeout budget for retrieval in ms (independent of LLM time). */
  timeoutMs?: number;

  /** Optional min score/quality if you introduce scoring/reranking. */
  minScore?: number;

  /** Optional source tag to log which retriever was used ("cse", "bing", etc). */
  provider?: string;
};

/** Per-stage timing + flags for observability. */
export type WorkerTiming = {
  totalMs?: number;
  retrievalMs?: number;
  llmMs?: number;
  queueWaitMs?: number;
};

/** Optional metadata for results (helps debugging/eval). */
export type WorkerMeta = {
  hadRetrieval?: boolean;       // whether retrieval actually ran
  retrievedCount?: number;      // number of links kept
  role?: Role;
  mission?: string;
  timing?: WorkerTiming;
  model?: string;               // model id used by the worker
  notes?: Record<string, unknown>; // arbitrary debug fields
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

  /**
   * Optional worker-side retrieval controls.
   * If omitted or `enable=false`, the worker should skip retrieval.
   */
  retrieval?: RetrievalOptions;
}

/**
 * Tutor Preflight
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
  /** Optional observability for preflight generation. */
  meta?: WorkerMeta;
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
  /** Final Markdown answer (your UI renders via MarkdownRenderer). */
  answer: string;

  /** Token/timing counters if you collect them. */
  tokens?: { input?: number; output?: number; timeMs?: number };

  /** Optional structured links for the answer bubble. */
  links?: LinkPreview[];

  /** Optional inline citations for superscripts/footnotes mapping. */
  citations?: InlineCitation[];

  /** Optional observability for the ask pipeline. */
  meta?: WorkerMeta;
}

export type LlmJobResult =
  | { type: 'mission'; result: EnrichedMissionPlan; meta?: WorkerMeta }
  | { type: 'ask'; result: AskResult }
  | { type: 'tutor-preflight'; result: TutorPreflightOutput };
