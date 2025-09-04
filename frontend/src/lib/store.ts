'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Role = 'explorer' | 'cadet' | 'scholar';

// --- State and Actions Interface ---
// It's a good practice to separate the state properties from the actions.
interface GameStateProperties {
  stars: number;
  level: number;
  role: Role;
  started: boolean; // ADDED: Tracks if the intro has been completed.
}

interface GameActions {
  addStars: (n: number) => void;
  setRole: (r: Role) => void;
  levelUp: () => void;
  setStarted: (started: boolean) => void; // ADDED: Action to update `started` state.
  reset: () => void;
}

// The final type is an intersection of properties and actions.
export type GameState = GameStateProperties & GameActions;

// Define the initial state separately for clarity and for use in the reset action.
const initialState: GameStateProperties = {
  stars: 0,
  level: 1,
  role: 'explorer',
  started: false, // Default to false so the intro shows on the first visit of a session.
};

export const useGame = create<GameState>()(
  // We can use multiple persist middlewares for different storage types.
  persist(
    (set) => ({
      // --- State Properties ---
      ...initialState,

      // --- Actions ---
      addStars: (n) => set((state) => ({ stars: state.stars + n })),
      setRole: (role) => set({ role }), // Simplified setRole
      levelUp: () => set((state) => ({ level: state.level + 1, stars: state.stars - 100 })), // Example: level up costs stars
      setStarted: (started) => set({ started }),
      reset: () => set(initialState), // Reset to the initial state object
    }),
    {
      name: 'stella-game-progress', // The key for long-term progress in localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist the user's actual progress, not session state like `started`.
      partialize: (state) => ({
        stars: state.stars,
        level: state.level,
        role: state.role,
      }),
    }
  )
);

// --- SEPARATE PERSISTENCE FOR SESSION STATE ---
// This is a more advanced but powerful pattern. We can create another middleware
// to persist session-specific state like `started` to sessionStorage.
// NOTE: For simplicity, the main implementation above is more common.
// If you wanted to implement this, you would wrap the main `(set) => ({...})`
// in another `persist` call with a different name and storage target.
// For now, keeping `started` in localStorage is fine, but this shows an alternative.