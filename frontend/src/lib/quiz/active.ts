'use client';

import { create } from 'zustand';

/**
 * Which lessons have a quiz question in progress. A lesson's explore model reads this and pauses while a
 * question is being answered, so the model cannot be used to work out the answer.
 */
export const useQuizActive = create<{ active: Record<string, boolean>; set: (lesson: string, on: boolean) => void }>()((set) => ({
  active: {},
  set: (lesson, on) => set((s) => (s.active[lesson] === on ? s : { active: { ...s.active, [lesson]: on } })),
}));
