/**
 * =========================================================================
 * LLM & JOB TYPE DEFINITIONS (extended)
 * =========================================================================
 */

/* ─────────────────────────────────────────────────────────
 * Core Enumerations
 * ────────────────────────────────────────────────────────── */

/** Represents the AI's persona, influencing its tone and response style. */
export type Role = 'explorer' | 'cadet' | 'scholar';
export const ALL_ROLES: Role[] = ['explorer', 'cadet', 'scholar'];
export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ALL_ROLES as string[]).includes(v);
}

/** Defines the specific type of mission the user can embark on. */
export type MissionType =
  | 'rocket-lab'
  | 'rover-cam'
  | 'space-poster'
  | 'earth-observer'
  | 'celestial-investigator';
export const ALL_MISSION_TYPES: MissionType[] = [
  'rocket-lab',
  'rover-cam',
  'space-poster',
  'earth-observer',
  'celestial-investigator',
];
export function isMissionType(v: unknown): v is MissionType {
  return typeof v === 'string' && (ALL_MISSION_TYPES as string[]).includes(v);
}

/* ─────────────────────────────────────────────────────────
 * External API Response Types
 * ────────────────────────────────────────────────────────── */

// --- NASA Mars Rover Photos API ---
export type MarsCamera = {
  id: number;
  name: string; // e.g., "FHAZ"
  rover_id: number;
  full_name: string; // e.g., "Front Hazard Avoidance Camera"
};

export type MarsRover = {
  id: number;
  name: string; // e.g., "Curiosity"
  landing_date: string; // "YYYY-MM-DD"
  launch_date: string; // "YYYY-MM-DD"
  status: string; // e.g., "active"
};

export type MarsPhoto = {
  id: number;
  sol: number;
  camera: MarsCamera;
  img_src: string;
  earth_date: string; // "YYYY-MM-DD"
  rover: MarsRover;
};

// --- NASA Image and Video Library (NIVL) API ---
export type NivlItem = {
  href: string; // Manifest URL
  data: {
    nasa_id: string;
    title: string;
    keywords?: string[];
    description?: string;
    date_created?: string;
  }[];
  links?: {
    href: string; // media URL
    rel: 'preview' | 'orig';
  }[];
};

/* ─────────────────────────────────────────────────────────
 * Internal Data Structures (missions, content)
 * ────────────────────────────────────────────────────────── */

export type MissionImage = {
  title: string;
  href: string; // image URL
};

export type EnrichedTopic = {
  title: string;
  summary: string;
  images: MissionImage[];
  keywords?: string[];
};

export type EnrichedMissionPlan = {
  missionTitle: string;
  introduction: string;
  topics: EnrichedTopic[];
};

/** Optional: a reusable “template” for missions that can be cached/seeds */
export type MissionTemplate = {
  missionType: MissionType;
  role: Role;
  title: string;
  synopsis: string;
  defaultTopics?: Pick<EnrichedTopic, 'title' | 'summary'>[];
  version?: string;
};

export type MissionLibraryEntry = {
  key: string; // `${missionType}:${role}`
  template: MissionTemplate;
  updatedAt: string; // ISO
};

/* ─────────────────────────────────────────────────────────
 * Chat & Retrieval Primitives
 * ────────────────────────────────────────────────────────── */

export type LinkPreview = {
  url: string;
  title?: string;
  faviconUrl?: string;
  snippet?: string;
  meta?: string; // e.g., "Source: Wikipedia"
};

export type GoogleSearchFn = (q: string, n?: number) => Promise<LinkPreview[]>;

export type InlineCitation = {
  index: number; // 1-based marker
  url: string;
  title?: string;
};

export type ChatMessage = {
  id: string;
  role: 'stella' | 'user';
  text: string;
  links?: LinkPreview[];
  citations?: InlineCitation[];
};

/* ─────────────────────────────────────────────────────────
 * Telemetry, Health & Metadata
 * ────────────────────────────────────────────────────────── */

export type RetrievalOptions = {
  enable?: boolean;
  qOverride?: string;
  num?: number;
  timeoutMs?: number;
  minScore?: number;
  provider?: string;
};

export type WorkerTiming = {
  totalMs?: number;
  retrievalMs?: number;
  llmMs?: number;
  queueWaitMs?: number;
};

export type WorkerMeta = {
  jobId?: string;
  queueName?: string;
  hadRetrieval?: boolean;
  retrievedCount?: number;
  role?: Role;
  mission?: string;
  timing?: WorkerTiming;
  model?: string;
  notes?: Record<string, unknown>;
};

export type WorkerHealth = {
  ok: boolean;
  details?: Record<string, unknown>;
};

/* ─────────────────────────────────────────────────────────
 * BullMQ: Names, Headers & Progress
 * ────────────────────────────────────────────────────────── */

/** Narrow job names to the ones your workers use; ideal for BullMQ’s 3rd generic. */
export type JobName = 'ask' | 'tutor-preflight' | 'mission';

/** If you want to type queue names across the app, you can re-export from your queue module. */
export type QueueName = 'llm-interactive-queue' | 'llm-background-queue';

/** Mirrors your HTTP header enum used by pollers */
export type QueueStateHeader =
  | 'waiting'
  | 'active'
  | 'delayed'
  | 'prioritized'
  | 'waiting-children'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'exists'
  | 'missing'
  | 'error'
  | 'unknown';

/** Optional typed progress payloads you might emit via job.updateProgress(...) */
export type JobProgress =
  | { kind: 'started' }
  | { kind: 'llm'; pct?: number }
  | { kind: 'retrieval'; pct?: number; count?: number }
  | { kind: 'postprocess'; pct?: number }
  | { kind: 'completed' };

/* ─────────────────────────────────────────────────────────
 * Caching / Idempotency Hooks
 * ────────────────────────────────────────────────────────── */

export type CachePolicy = {
  /** Max age in seconds for a cached result to be considered fresh */
  maxAgeSec?: number;
  /** If true, bypass cache on demand */
  bypass?: boolean;
};

export type MissionCacheKey = string; // e.g. `${missionType}:${role}`
export type MissionCacheEntry = {
  key: MissionCacheKey;
  plan: EnrichedMissionPlan;
  createdAt: string; // ISO
  ttlSec?: number;
  version?: string;
};

/* ─────────────────────────────────────────────────────────
 * BullMQ Job Payloads (Input)
 * ────────────────────────────────────────────────────────── */

export interface LlmMissionPayload {
  missionType: MissionType;
  role: Role;
  cache?: CachePolicy;
}

export interface LlmAskPayload {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
  retrieval?: RetrievalOptions;
  cache?: CachePolicy;
}

export interface TutorPreflightPayload {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: Role;
  cache?: CachePolicy;
}

/* ─────────────────────────────────────────────────────────
 * BullMQ Job Data (Full Job Definition)
 * ────────────────────────────────────────────────────────── */

export interface MissionJobData {
  type: 'mission';
  payload: LlmMissionPayload;
  cacheKey?: string;
  name?: Extract<JobName, 'mission'>; // optional explicit job name
}

export interface AskJobData {
  type: 'ask';
  payload: LlmAskPayload;
  cacheKey?: string;
  name?: Extract<JobName, 'ask'>;
}

export interface TutorPreflightJobData {
  type: 'tutor-preflight';
  payload: TutorPreflightPayload;
  cacheKey?: string;
  name?: Extract<JobName, 'tutor-preflight'>;
}

/** Discriminated job union */
export type LlmJobData = MissionJobData | AskJobData | TutorPreflightJobData;

/** Type guard for job data */
export function isLlmJobData<T extends LlmJobData['type']>(
  data: LlmJobData,
  type: T,
): data is Extract<LlmJobData, { type: T }> {
  return data.type === type;
}

/* ─────────────────────────────────────────────────────────
 * BullMQ Job Results (Output)
 * ────────────────────────────────────────────────────────── */

export interface AskResult {
  answer: string;
  tokens?: { input?: number; output?: number; timeMs?: number };
  links?: LinkPreview[];
  citations?: InlineCitation[];
}

export interface TutorPreflightOutput {
  systemPrompt: string;
  starterMessages: ChatMessage[];
  warmupQuestion: string;
  goalSuggestions: string[];
  difficultyHints: {
    easy: string;
    standard: string;
    challenge: string;
  };
}

/** Standard failure shape */
export interface JobFailureResult {
  type: 'failure';
  error: {
    message: string;
    stack?: string;
  };
  meta?: WorkerMeta;
}

/** Optional: allow workers to explicitly “ignore” and still satisfy typings */
export interface JobIgnoredResult {
  type: 'ignored';
  reason?: string;
  meta?: WorkerMeta;
}

/** Discriminated union of all job results */
export type LlmJobResult =
  | { type: 'mission'; result: EnrichedMissionPlan; meta?: WorkerMeta }
  | { type: 'ask'; result: AskResult; meta?: WorkerMeta }
  | { type: 'tutor-preflight'; result: TutorPreflightOutput; meta?: WorkerMeta }
  | JobFailureResult
  | JobIgnoredResult;

/** Result type guards */
export function isFailureResult(r: LlmJobResult): r is JobFailureResult {
  return r.type === 'failure';
}
export function isIgnoredResult(r: LlmJobResult): r is JobIgnoredResult {
  return r.type === 'ignored';
}
