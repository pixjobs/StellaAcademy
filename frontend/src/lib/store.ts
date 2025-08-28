'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Role = 'explorer' | 'cadet' | 'scholar';

export interface GameState {
  stars: number;
  level: number;
  role: Role;
  addStars: (n: number) => void;
  setRole: (r: Role) => void;
  levelUp: () => void;
  reset: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      stars: 0,
      level: 1,
      role: 'explorer',
      addStars: (n) => set((s) => ({ stars: s.stars + n })),
      setRole: (r) => set(() => ({ role: r })),
      levelUp: () => set((s) => ({ level: s.level + 1 })),
      reset: () => set({ stars: 0, level: 1, role: 'explorer' }),
    }),
    {
      name: 'stella-game', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // optional: only persist what you need
      partialize: (s) => ({ stars: s.stars, level: s.level, role: s.role }),
    }
  )
);
