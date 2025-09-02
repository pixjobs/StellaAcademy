// src/types/llm.ts

export type Role = 'explorer' | 'cadet' | 'scholar';

// ---------- Mars Rover Photo API Types ----------

export type MarsCamera = {
  id: number;
  name: string;
  rover_id: number;
  full_name: string;
};

export type MarsRover = {
  id: number;
  name: string;
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
// Note: These are simplified versions. The canonical, richer types
// should live in `types/mission.ts`.
export type EnrichedTopic = {
  title: string;
  summary: string;
  images: { title: string; href: string }[];
  keywords?: string[];
};

export type EnrichedMissionPlan = {
  missionTitle: string;
  introduction: string;
  topics: EnrichedTopic[];
};


// ---------- BullMQ Job & Result Types ----------

export type MissionJobData = {
  type: 'mission';
  payload: {
    missionType: 'rocket-lab' | 'rover-cam' | 'space-poster'; // Added 'space-poster'
    role: Role;
  };
  cacheKey?: string;
};

export type AskJobData = {
  type: 'ask';
  payload: {
    prompt: string;
    context?: string;
    role?: Role;
    mission?: string;
  };
  cacheKey?: string;
};

export type LlmJobData = MissionJobData | AskJobData;

export type AskResult = {
  answer: string;
  tokens?: { input?: number; output?: number; timeMs?: number };
};

export type LlmJobResult =
  | { type: 'mission'; result: EnrichedMissionPlan }
  | { type: 'ask'; result: AskResult };