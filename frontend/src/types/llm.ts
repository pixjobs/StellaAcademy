/**
 * =========================================================================
 * LLM & JOB TYPE DEFINITIONS (extended)
 *
 * Single source of truth for:
 * - Personas/roles & mission types
 * - External API types used in missions
 * - Enriched mission content shapes
 * - Job payloads/results for ask / mission / tutor-preflight / backfill
 * - Worker metadata (timing, queue info)
 * =========================================================================
 */

/* ─────────────────────────────────────────────────────────
 * Core Enumerations (Single Source of Truth Pattern)
 * ────────────────────────────────────────────────────────── */

import type { EnrichedMissionPlan } from './mission'; 

/** All personas. */
export const ALL_ROLES = ['explorer', 'cadet', 'scholar'] as const;
export type Role = typeof ALL_ROLES[number];
export function isRole(v: unknown): v is Role {
  return typeof v === 'string' && (ALL_ROLES as readonly string[]).includes(v);
}

/** All mission types. */
export const ALL_MISSION_TYPES = [
  'rocket-lab',
  'rover-cam',
  'space-poster',
  'earth-observer',
  'celestial-investigator',
] as const;
export type MissionType = typeof ALL_MISSION_TYPES[number];
export function isMissionType(v: unknown): v is MissionType {
  return typeof v === 'string' && (ALL_MISSION_TYPES as readonly string[]).includes(v);
}

/* ─────────────────────────────────────────────────────────
 * External API Response Types (NASA etc.)
 * ────────────────────────────────────────────────────────── */

// Mars Rover Photos API
export type MarsCamera = { id: number; name: string; rover_id: number; full_name: string };
export type MarsRover = { id: number; name: string; landing_date: string; launch_date: string; status: string };
export type MarsPhoto = { id: number; sol: number; camera: MarsCamera; img_src: string; earth_date: string; rover: MarsRover };

// NASA Image and Video Library (NIVL)
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

// APOD (Astronomy Picture of the Day)
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

// EPIC (Earth Polychromatic Imaging Camera)
export type EpicImageType = 'natural' | 'enhanced';
export interface EpicImage {
  identifier: string;
  caption: string;
  image: string;
  version: string;
  centroid_coordinates: { lat: number; lon: number };
  dscovr_j2000_position: { x: number; y: number; z: number };
  // (other fields omitted)
}

/* ─────────────────────────────────────────────────────────
 * Internal Data Structures (missions, content)
 * ────────────────────────────────────────────────────────── */

export type MissionImage = { title: string; href: string };
export type EnrichedTopic = {
  title: string;
  summary: string;
  images: MissionImage[];
  keywords?: string[];
};

export type MissionTemplate = {
  missionType: MissionType;
  role: Role;
  title: string;
  synopsis: string;
  defaultTopics?: Pick<EnrichedTopic, 'title' | 'summary'>[];
  version?: string;
};
export type MissionLibraryEntry = {
  key: string;
  template: MissionTemplate;
  updatedAt: string;
};

/* ─────────────────────────────────────────────────────────
 * Chat & Retrieval Primitives
 * ────────────────────────────────────────────────────────── */

export type LinkPreview = { url: string; title?: string; faviconUrl?: string; snippet?: string; meta?: string };
export type GoogleSearchFn = (q: string, n?: number) => Promise<LinkPreview[]>;
export type InlineCitation = { index: number; url: string; title?: string };
export type ChatMessage = { id: string; role: 'stella' | 'user'; text: string; links?: LinkPreview[]; citations?: InlineCitation[] };

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
  totalMs: number;
  queueWaitMs: number;
  retrievalMs?: number;
  llmMs?: number;
};

export interface WorkerMeta {
  jobId: string;
  /** optional in local/dev paths */
  queueName?: string | null;
  timing: WorkerTiming;
  model?: string;
  role?: Role;
  mission?: string;
  hadRetrieval?: boolean;
  retrievedCount?: number;
  notes?: Record<string, unknown>;
}

export type WorkerHealth = { ok: boolean; details?: Record<string, unknown> };

/* ─────────────────────────────────────────────────────────
 * Queue / Progress (legacy-friendly)
 * ────────────────────────────────────────────────────────── */

export type JobName = 'ask' | 'tutor-preflight' | 'mission' | 'library-backfill';
export type QueueName = 'llm-interactive-queue' | 'llm-background-queue';
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

export type JobProgress =
  | { kind: 'started' }
  | { kind: 'llm'; pct?: number }
  | { kind: 'retrieval'; pct?: number; count?: number }
  | { kind: 'postprocess'; pct?: number }
  | { kind: 'completed' };

/* ─────────────────────────────────────────────────────────
 * Cache / Idempotency
 * ────────────────────────────────────────────────────────── */

export type CachePolicy = { maxAgeSec?: number; bypass?: boolean };
export type MissionCacheKey = string;
export type MissionCacheEntry = {
  key: string;
  plan: EnrichedMissionPlan;
  createdAt: string;
  ttlSec?: number;
  version?: string;
};

/* ─────────────────────────────────────────────────────────
 * Job Payloads (input)
 * ────────────────────────────────────────────────────────── */

export interface LlmMissionPayload {
  missionType: MissionType;
  role: Role;
  cache?: CachePolicy;
  _test_should_fail?: boolean;
}

export interface LlmAskPayload {
  prompt: string;
  context?: string;
  role?: Role;
  mission?: string;
  retrieval?: RetrievalOptions;
  cache?: CachePolicy;
  _test_should_fail?: boolean;
}

export interface TutorPreflightPayload {
  mission: string | EnrichedMissionPlan;
  topicTitle: string;
  topicSummary: string;
  imageTitle?: string;
  role: Role;
  cache?: CachePolicy;
  _test_should_fail?: boolean;
}

/* ─────────────────────────────────────────────────────────
 * Job Data (discriminated union)
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

export interface LibraryBackfillJobData {
  type: 'library-backfill';
  payload: {
    missionType: MissionType;
    role: Role;
    reason: 'miss' | 'stale' | 'scheduled';
  };
  name?: Extract<JobName, 'library-backfill'>;
}

export type LlmJobData =
  | MissionJobData
  | AskJobData
  | TutorPreflightJobData
  | LibraryBackfillJobData;

export function isLlmJobData<T extends LlmJobData['type']>(
  data: LlmJobData,
  type: T,
): data is Extract<LlmJobData, { type: T }> {
  return data.type === type;
}

/* ─────────────────────────────────────────────────────────
 * Job Results (output)
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
  difficultyHints: { easy: string; standard: string; challenge: string };
}

export interface LibraryBackfillResult {
  ok: boolean;
  reason: 'miss' | 'stale' | 'scheduled';
  missionType: MissionType;
  role: Role;
}

/** Standard failure & ignored variants */
export interface JobFailureResult {
  type: 'failure';
  result: { error: string };
  meta: WorkerMeta;
}
export interface JobIgnoredResult {
  type: 'ignored';
  result: Record<string, never>;
  meta: WorkerMeta;
}

/**
 * Discriminated union of all FINAL worker results.
 * This is the source of truth for the shape of a completed job.
 */
export type LlmJobResult =
  | { type: 'mission';          result: EnrichedMissionPlan;   meta: WorkerMeta }
  | { type: 'ask';              result: AskResult;             meta: WorkerMeta }
  | { type: 'tutor-preflight';  result: TutorPreflightOutput;  meta: WorkerMeta }
  | { type: 'library-backfill'; result: LibraryBackfillResult; meta: WorkerMeta }
  | JobFailureResult
  | JobIgnoredResult;

export function isFailureResult(r: LlmJobResult): r is JobFailureResult {
  return r.type === 'failure';
}
export function isIgnoredResult(r: LlmJobResult): r is JobIgnoredResult {
  return r.type === 'ignored';
}

/**
 * Defines the raw output of a job handler, BEFORE metadata is attached.
 * This is a separate type used internally by the worker to pass
 * data from a handler function to the main server logic.
 */
export type HandlerOutput =
  | { type: 'mission';          result: EnrichedMissionPlan }
  | { type: 'ask';              result: AskResult }
  | { type: 'tutor-preflight';  result: TutorPreflightOutput }
  | { type: 'library-backfill'; result: LibraryBackfillResult };