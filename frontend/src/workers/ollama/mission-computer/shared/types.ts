export type GenerationOpts = {
  /** Stable-ish seed for variety/dedup */
  seedIndex?: number;
  /** Retry/attempt index (1-based) to diversify prompts */
  attempt?: number;
};
