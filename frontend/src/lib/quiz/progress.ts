'use client';

import { useEffect } from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { persist } from 'zustand/middleware';

const DAY = 24 * 60 * 60 * 1000;
/** Days until a missed question comes back: after 1 day, then 3, then a week; right after that, it is done. */
export const REVIEW_DAYS = [1, 3, 7] as const;
const KEEP_ROUNDS = 50;
const KEEP_REVIEW = 50;
/** How many recently asked questions are remembered, so new rounds can avoid them: ten rounds' worth. */
export const KEEP_RECENT = 100;

/** A round, saved as it is played: `out` counts the questions answered so far; `done` is false until the round ends. */
export type RoundRecord = { round: string; score: number; out: number; at: number; done?: boolean };
/** A missed question, saved by its round and seed so the same question can be made again. */
export type ReviewItem = { round: string; seed: number; box: number; due: number };
export type Answered = { round: string; seed: number; firstTime: boolean };

type ProgressState = {
  rounds: RoundRecord[];
  review: ReviewItem[];
  /** The prompts of the questions asked most recently, oldest first, so new rounds can avoid repeating them. */
  recent: string[];
  /** Starts a round. Its record is saved straight away, so leaving part way through still shows it. */
  begin: (round: string, at: number, prompts?: string[]) => void;
  /**
   * Saves one answered question in the round that started at `at`, and moves it into, through or out of
   * the review list. A question already saved as missed (for example after its first slip) is not counted twice.
   */
  answer: (at: number, a: Answered, now?: number, alreadySaved?: boolean) => void;
  /** Marks the round that started at `at` as finished. */
  end: (at: number) => void;
  /** Saves a whole finished round at once (used by the checks). */
  finish: (round: string, answered: Answered[], now?: number) => void;
  clear: () => void;
};

/** A question's place in the review list after it is answered: missed goes to the start; right moves it on. */
function moveInReview(list: ReviewItem[], a: Answered, now: number): ReviewItem[] {
  const review = [...list];
  const i = review.findIndex((x) => x.round === a.round && x.seed === a.seed);
  if (i === -1) {
    if (!a.firstTime) review.push({ round: a.round, seed: a.seed, box: 0, due: now + REVIEW_DAYS[0] * DAY });
  } else if (!a.firstTime) review[i] = { ...review[i], box: 0, due: now + REVIEW_DAYS[0] * DAY };
  else if (review[i].box + 1 >= REVIEW_DAYS.length) review.splice(i, 1);
  else review[i] = { ...review[i], box: review[i].box + 1, due: now + REVIEW_DAYS[review[i].box + 1] * DAY };
  return review.slice(-KEEP_REVIEW);
}

type ProgressStore = UseBoundStore<StoreApi<ProgressState>> & { persist: { rehydrate: () => Promise<void> | void } };
const stores = new Map<string, ProgressStore>();

/**
 * Quiz scores and the review list for one lesson, kept in this browser only (no account, nothing sent
 * to the server; see the privacy page), under the lesson quiz's storage key. Hydration is deferred, as
 * in lib/journey.ts, so the server-rendered page and the first client render agree.
 */
export function progressStore(key: string): ProgressStore {
  const existing = stores.get(key);
  if (existing) return existing;
  const store = makeStore(key);
  stores.set(key, store);
  return store;
}

const makeStore = (key: string) => create<ProgressState>()(
  persist(
    (set) => ({
      rounds: [],
      review: [],
      recent: [],
      begin: (round, at, prompts = []) =>
        set((state) => ({
          rounds: [...state.rounds, { round, score: 0, out: 0, at, done: false }].slice(-KEEP_ROUNDS),
          recent: [...(state.recent ?? []).filter((p) => !prompts.includes(p)), ...prompts].slice(-KEEP_RECENT),
        })),
      answer: (at, a, now = Date.now(), alreadySaved = false) =>
        set((state) => ({
          review: alreadySaved ? state.review : moveInReview(state.review, a, now),
          rounds: alreadySaved ? state.rounds : state.rounds.map((x) => (x.at === at ? { ...x, out: x.out + 1, score: x.score + (a.firstTime ? 1 : 0) } : x)),
        })),
      end: (at) => set((state) => ({ rounds: state.rounds.map((x) => (x.at === at ? { ...x, done: true } : x)) })),
      finish: (round, answered, now = Date.now()) =>
        set((state) => {
          let review = state.review;
          for (const a of answered) review = moveInReview(review, a, now);
          const score = answered.filter((a) => a.firstTime).length;
          const rounds = [...state.rounds, { round, score, out: answered.length, at: now, done: true }].slice(-KEEP_ROUNDS);
          return { rounds, review };
        }),
      clear: () => set({ rounds: [], review: [], recent: [] }),
    }),
    { name: key, skipHydration: true },
  ),
) as ProgressStore;

const hydrated = new Set<string>();

/** One lesson's saved progress. Empty until it has loaded from the browser. */
export function useSavedProgress(key: string) {
  const store = progressStore(key);
  const state = store();
  useEffect(() => {
    if (hydrated.has(key)) return;
    hydrated.add(key);
    void store.persist.rehydrate();
  }, [key, store]);
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
