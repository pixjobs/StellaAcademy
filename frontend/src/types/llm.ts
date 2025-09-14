/**
 * =========================================================================
 * LLM & JOB TYPE DEFINITIONS (extended)
 *
 * This file is the single source of truth for all data structures related to
 * BullMQ jobs, LLM interactions, API responses, and internal state.
 * =========================================================================
 */

/* ─────────────────────────────────────────────────────────
 * Core Enumerations (Single Source of Truth Pattern)
 * ────────────────────────────────────────────────────────── */

/** A readonly array of all possible AI personas. The 'Role' type is derived from this. */
export const ALL_ROLES = ['explorer', 'cadet', 'scholar'] as const;
/** Represents the AI's persona, influencing its tone and response style. */
export type Role = typeof ALL_ROLES[number];

export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ALL_ROLES as readonly string[]).includes(v);
}

/** A readonly array of all possible mission types. */
export const ALL_MISSION_TYPES = [
  'rocket-lab',
  'rover-cam',
  'space-poster',
  'earth-observer',
  'celestial-investigator',
] as const;
/** Defines the specific type of mission the user can embark on. */
export type MissionType = typeof ALL_MISSION_TYPES[number];

export function isMissionType(v: unknown): v is MissionType {
  return typeof v === 'string' && (ALL_MISSION_TYPES as readonly string[]).includes(v);
}

/* ─────────────────────────────────────────────────────────
 * External API Response Types
 * ────────────────────────────────────────────────────────── */

// --- NASA Mars Rover Photos API ---
export type MarsCamera = { id: number; name: string; rover_id: number; full_name: string; };
export type MarsRover = { id: number; name: string; landing_date: string; launch_date: string; status: string; };
export type MarsPhoto = { id: number; sol: number; camera: MarsCamera; img_src: string; earth_date: string; rover: MarsRover; };

// --- NASA Image and Video Library (NIVL) API (Harmonized) ---
export type NivlMediaType = 'image' | 'video' | 'audio';
export interface NivlData {
  title?: string;
  description?: string;
  nasa_id?: string;
  center?: string;
  keywords?: string[];
  date_created?: string;
  media_type?: NivlMediaType;
}
export interface NivlLink {
  href: string;
  rel?: string;
  render?: string;
  prompt?: string;
}
export interface NivlItem {
  href?: string;
  data?: NivlData[];
  links?: NivlLink[];
}

// --- NASA Astronomy Picture of the Day (APOD) API ---
export interface ApodItem {
  date?: string;
  title?: string;
  explanation?: string;
  url?: string;
  hdurl?: string;
  bgUrl?: string;
  copyright?: string;
  media_type?: string;
}

// --- NASA Earth Polychromatic Imaging Camera (EPIC) API (Added) ---
export type EpicImageType = 'natural' | 'enhanced';
export interface EpicImage {
  identifier: string;
  caption: string;
  image: string;
  version: string;
  centroid_coordinates: {
    lat: number;
    lon: number;
  };
  dscovr_j2000_position: {
    x: number;
    y: number;
    z: number;
  };
  // ... and other complex coordinate objects
}


/* ─────────────────────────────────────────────────────────
 * Internal Data Structures (missions, content)
 * ────────────────────────────────────────────────────────── */

export type MissionImage = { title: string; href: string; };
export type EnrichedTopic = { title: string; summary: string; images: MissionImage[]; keywords?: string[]; };
export type EnrichedMissionPlan = { missionTitle: string; introduction: string; topics: EnrichedTopic[]; };

/** A reusable “template” for missions that can be cached/seeded. */
export type MissionTemplate = { missionType: MissionType; role: Role; title: string; synopsis: string; defaultTopics?: Pick<EnrichedTopic, 'title' | 'summary'>[]; version?: string; };
export type MissionLibraryEntry = { key: string; template: MissionTemplate; updatedAt: string; };

/* ─────────────────────────────────────────────────────────
 * Chat & Retrieval Primitives
 * ────────────────────────────────────────────────────────── */

export type LinkPreview = { url: string; title?: string; faviconUrl?: string; snippet?: string; meta?: string; };
export type GoogleSearchFn = (q: string, n?: number) => Promise<LinkPreview[]>;
export type InlineCitation = { index: number; url: string; title?: string; };
export type ChatMessage = { id: string; role: 'stella' | 'user'; text: string; links?: LinkPreview[]; citations?: InlineCitation[]; };

/* ─────────────────────────────────────────────────────────
 * Telemetry, Health & Metadata (Stricter Typing)
 * ────────────────────────────────────────────────────────── */

export type RetrievalOptions = { enable?: boolean; qOverride?: string; num?: number; timeoutMs?: number; minScore?: number; provider?: string; };

/** Performance timing data for a worker job. All values are in milliseconds. */
export type WorkerTiming = {
  totalMs: number; // Guaranteed to be set at the end of a job.
  queueWaitMs: number; // Guaranteed to be set at the start of a job.
  retrievalMs?: number;
  llmMs?: number;
};

/** Debugging and performance metadata attached to a job result. */
export interface WorkerMeta {
  jobId: string; // A job always has an ID.
  queueName: string; // A job always belongs to a queue.
  timing: WorkerTiming; // The timing object is guaranteed to be initialized.
  model?: string;
  role?: Role;
  mission?: string;
  hadRetrieval?: boolean;
  retrievedCount?: number;
  notes?: Record<string, unknown>;
}

export type WorkerHealth = { ok: boolean; details?: Record<string, unknown>; };

/* ─────────────────────────────────────────────────────────
 * BullMQ: Names, Headers & Progress
 * ────────────────────────────────────────────────────────── */

/** Narrow job names to the ones your workers use; ideal for BullMQ’s 3rd generic. */
export type JobName = 'ask' | 'tutor-preflight' | 'mission';

/** If you want to type queue names across the app, you can re-export from your queue module. */
export type QueueName = 'llm-interactive-queue' | 'llm-background-queue';

/** Mirrors your HTTP header enum used by pollers */
export type QueueStateHeader = 'waiting' | 'active' | 'delayed' | 'prioritized' | 'waiting-children' | 'completed' | 'failed' | 'paused' | 'exists' | 'missing' | 'error' | 'unknown';

/** Typed progress payloads you might emit via job.updateProgress(...) */
export type JobProgress = { kind: 'started' } | { kind: 'llm'; pct?: number } | { kind: 'retrieval'; pct?: number; count?: number } | { kind: 'postprocess'; pct?: number } | { kind: 'completed' };

/* ─────────────────────────────────────────────────────────
 * Caching / Idempotency Hooks
 * ────────────────────────────────────────────────────────── */

export type CachePolicy = { maxAgeSec?: number; bypass?: boolean; };
export type MissionCacheKey = string; // e.g. `${missionType}:${role}`
export type MissionCacheEntry = { key: MissionCacheKey; plan: EnrichedMissionPlan; createdAt: string; ttlSec?: number; version?: string; };

/* ─────────────────────────────────────────────────────────
 * BullMQ Job Payloads (Input)
 * ────────────────────────────────────────────────────────── */

export interface LlmMissionPayload {
  missionType: MissionType;
  role: Role;
  cache?: CachePolicy;
  /** For internal testing: if true, the worker will force a failure. */
  _test_should_fail?: boolean;
}

export interface LlmAskPayload {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
  retrieval?: RetrievalOptions;
  cache?: CachePolicy;
  /** For internal testing: if true, the worker will force a failure. */
  _test_should_fail?: boolean;
}

export interface TutorPreflightPayload {
  mission: string;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: Role;
  cache?: CachePolicy;
  /** For internal testing: if true, the worker will force a failure. */
  _test_should_fail?: boolean;
}

/* ─────────────────────────────────────────────────────────
 * BullMQ Job Data (Full Job Definition)
 * ────────────────────────────────────────────────────────── */

export interface MissionJobData {
  type: 'mission';
  payload: LlmMissionPayload;
  cacheKey?: string;
  name?: Extract<JobName, 'mission'>;
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

/** Discriminated union of all possible job data shapes. */
export type LlmJobData = MissionJobData | AskJobData | TutorPreflightJobData;

/** Type guard to safely discriminate between job data types in worker code. */
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
  difficultyHints: { easy: string; standard: string; challenge: string; };
}

/** The standard shape for a job that failed during execution. */
export interface JobFailureResult {
  type: 'failure';
  error: { message: string; stack?: string; };
  meta: WorkerMeta; // Metadata is mandatory for failures to aid debugging.
}

/** The standard shape for a job that was intentionally ignored by the worker. */
export interface JobIgnoredResult {
  type: 'ignored';
  reason?: string;
  meta: WorkerMeta; // Metadata is mandatory.
}

/** Discriminated union of all possible job results from a worker. */
export type LlmJobResult =
  | { type: 'mission'; result: EnrichedMissionPlan; meta: WorkerMeta }
  | { type: 'ask'; result: AskResult; meta: WorkerMeta }
  | { type: 'tutor-preflight'; result: TutorPreflightOutput; meta: WorkerMeta }
  | JobFailureResult
  | JobIgnoredResult;

/** Result type guard to check for failures. */
export function isFailureResult(r: LlmJobResult): r is JobFailureResult {
  return r.type === 'failure';
}
/** Result type guard to check if a job was ignored. */
export function isIgnoredResult(r: LlmJobResult): r is JobIgnoredResult {
  return r.type === 'ignored';
}