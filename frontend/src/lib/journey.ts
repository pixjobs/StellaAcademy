'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type JourneyState = {
  /** Lesson id to the time it was marked done. */
  done: Record<string, number>;
  toggle: (lesson: string) => void;
  reset: () => void;
};

/**
 * Journey progress, kept in this browser only (no account yet). Hydration is
 * deferred so the server-rendered page and the first client render agree.
 */
export const useJourney = create<JourneyState>()(
  persist(
    (set) => ({
      done: {},
      toggle: (lesson) =>
        set((state) => {
          const done = { ...state.done };
          if (done[lesson]) delete done[lesson];
          else done[lesson] = Date.now();
          return { done };
        }),
      reset: () => set({ done: {} }),
    }),
    { name: 'stella-journey-v1', skipHydration: true },
  ),
);

let hydrated = false;

/** The set of lessons marked done. Empty until the saved progress has loaded. */
export function useJourneyDone(): Record<string, number> {
  const done = useJourney((state) => state.done);
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    void useJourney.persist.rehydrate();
  }, []);
  return done;
}
