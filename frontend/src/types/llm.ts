// src/types/llm.ts
export type Role = 'explorer' | 'cadet' | 'scholar';

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

export type MissionJobData = {
  type: 'mission';
  payload: {
    missionType: 'rocket-lab' | 'rover-cam';
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
