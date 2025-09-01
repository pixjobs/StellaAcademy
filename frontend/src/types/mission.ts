export type EnrichedTopic = {
  title?: string;
  summary: string;
  images: { title: string; href: string }[];
  keywords?: string[];
};

export type EnrichedMissionPlan = {
  missionTitle: string;
  introduction: string;
  topics: EnrichedTopic[];
};
