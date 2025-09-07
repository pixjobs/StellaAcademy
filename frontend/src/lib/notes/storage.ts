// lib/notes/storage.ts

// --- THIS IS THE CHANGE ---
// Import the official Note type from the centralized types file.
import { Note } from '@/types/mission';

/**
 * Defines the contract for any note storage mechanism.
 * This allows us to easily swap localStorage for a database API later.
 */
export interface INoteStorage {
  getNotes(key: string): Promise<Note[]>;
  saveNotes(key: string, notes: Note[]): Promise<void>;
}

/**
 * An implementation of INoteStorage that uses the browser's localStorage.
 */
export class LocalStorageNoteStorage implements INoteStorage {
  public async getNotes(key: string): Promise<Note[]> {
    try {
      // The logic here is unchanged, as the Note structure is the same.
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as Note[]) : [];
    } catch (error) {
      console.error("Failed to parse notes from localStorage", error);
      return [];
    }
  }

  public async saveNotes(key: string, notes: Note[]): Promise<void> {
    try {
      // The logic here is unchanged.
      window.localStorage.setItem(key, JSON.stringify(notes));
    } catch (error) {
      console.error("Failed to save notes to localStorage", error);
    }
  }
}