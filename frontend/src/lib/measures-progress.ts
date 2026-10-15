'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Round } from '@/lib/measures-quiz';

const DAY = 24 * 60 * 60 * 1000;
/** Days until a missed question comes back: after 1 day, then 3, then a week; right after that, it is done. */
export const REVIEW_DAYS = [1, 3, 7] as const;
const KEEP_ROUNDS = 50;
const KEEP_REVIEW = 50;

export type RoundRecord = { round: Round | 'review'; score: number; out: number; at: number };
/** A missed question, saved by its round and seed so the same question can be made again. */
export type ReviewItem = { round: Round; seed: number; box: number; due: number };
export type Answered = { round: Round; seed: number; firstTime: boolean };

type ProgressState = {
  rounds: RoundRecord[];
  review: ReviewItem[];
  /** Saves a finished round, and moves questions into, through or out of the review list. */
  finish: (round: Round | 'review', answered: Answered[], now?: number) => void;
  clear: () => void;
};

/**
 * Quiz scores and the review list for the Measures lesson, kept in this browser only (no account,
 * nothing sent to the server; see the privacy page). Hydration is deferred, as in lib/journey.ts,
 * so the server-rendered page and the first client render agree.
 */
export const useMeasuresProgress = create<ProgressState>()(
  persist(
    (set) => ({
      rounds: [],
      review: [],
      finish: (round, answered, now = Date.now()) =>
        set((state) => {
          let review = [...state.review];
          for (const a of answered) {
            const i = review.findIndex((x) => x.round === a.round && x.seed === a.seed);
            if (i === -1) {
              if (!a.firstTime) review.push({ round: a.round, seed: a.seed, box: 0, due: now + REVIEW_DAYS[0] * DAY });
              continue;
            }
            if (!a.firstTime) review[i] = { ...review[i], box: 0, due: now + REVIEW_DAYS[0] * DAY };
            else if (review[i].box + 1 >= REVIEW_DAYS.length) review.splice(i, 1);
            else review[i] = { ...review[i], box: review[i].box + 1, due: now + REVIEW_DAYS[review[i].box + 1] * DAY };
          }
          review = review.slice(-KEEP_REVIEW);
          const score = answered.filter((a) => a.firstTime).length;
          const rounds = [...state.rounds, { round, score, out: answered.length, at: now }].slice(-KEEP_ROUNDS);
          return { rounds, review };
        }),
      clear: () => set({ rounds: [], review: [] }),
    }),
    { name: 'stella-measures-v1', skipHydration: true },
  ),
);

let hydrated = false;

/** The saved progress. Empty until it has loaded from the browser. */
export function useMeasuresSaved() {
  const state = useMeasuresProgress();
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    void useMeasuresProgress.persist.rehydrate();
  }, []);
  return state;
}

/** Questions due for review now, oldest first. */
export function dueNow(review: ReviewItem[], now: number): ReviewItem[] {
  return review.filter((x) => x.due <= now).sort((a, b) => a.due - b.due);
}

/** Rounds finished today (local time). */
export function roundsToday(rounds: RoundRecord[], now: number): RoundRecord[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return rounds.filter((r) => r.at >= start.getTime());
}
