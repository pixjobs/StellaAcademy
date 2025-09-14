// lib/notes/NotesContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo
} from 'react';
// Import the UID type alongside the Note type
import { Note, UID } from '@/types/mission';
import { INoteStorage, LocalStorageNoteStorage } from './storage';

// Update the UID generator to return the branded UID type
const uid = (): UID => (Math.random().toString(36).slice(2, 9) as UID);

/**
 * Defines the shape of the data provided by our NotesContext.
 */
interface INotesContext {
  notes: Note[];
  isLoading: boolean;
  addNote: (partialNote: Partial<Note>) => void;
  removeNote: (id: string) => void;
}

/**
 * Create the React Context.
 * We provide 'undefined' as a default and will add a runtime check in the
 * hook to ensure it's never consumed outside its Provider.
 */
const NotesContext = createContext<INotesContext | undefined>(undefined);

type NotesProviderProps = {
  children: ReactNode;
  missionKey: string;
  // In the future, you could pass a user object here:
  // user?: UserSession;
};

/**
 * The Provider component that wraps parts of your application (like MissionControl).
 * It is responsible for fetching, managing, and saving the note state.
 */
export function NotesProvider({ children, missionKey }: NotesProviderProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define the unique key for this mission's notes.
  const storageKey = `stella:notes:${missionKey}`;

  /**
   * This is the key abstraction. We memoize the storage service instance.
   *
   * WHEN YOU ARE READY FOR A DATABASE:
   * You would add logic here:
   *   if (user && user.isLoggedIn) {
   *     return new ApiNoteStorage(missionKey, user.token);
   *   }
   *   return new LocalStorageNoteStorage();
   */
  const storageService: INoteStorage = useMemo(() => {
    // For now, we are hard-coding the localStorage implementation.
    return new LocalStorageNoteStorage();
  }, []); // In the future, this would depend on [user]

  // EFFECT 1: Load notes from storage on initial mount.
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    storageService.getNotes(storageKey).then(loadedNotes => {
      if (isMounted) {
        setNotes(loadedNotes);
        setIsLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [storageService, storageKey]); // Re-run if the service or key changes

  // EFFECT 2: Save notes back to storage whenever they are modified.
  useEffect(() => {
    // We prevent saving during the initial load cycle.
    // This stops us from overwriting loaded data with an empty array.
    if (!isLoading) {
      storageService.saveNotes(storageKey, notes);
    }
  }, [notes, isLoading, storageService, storageKey]); // Re-run whenever notes change

  /**
   * Creates a new note from partial data and prepends it to the state.
   */
  const addNote = useCallback((partialNote: Partial<Note>) => {
    const newNote: Note = {
      // With the updated uid(), this line no longer causes a type error.
      id: partialNote.id || uid(),
      type: partialNote.type ?? 'concept',
      title: partialNote.title ?? 'Untitled Note',
      body: partialNote.body,
      url: partialNote.url,
      imgHref: partialNote.imgHref,
      createdAt: partialNote.createdAt || Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
  }, []);

  /**
   * Removes a note from the state by its ID.
   */
  const removeNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consumers.
  const value = useMemo(() => ({
    notes,
    isLoading,
    addNote,
    removeNote,
  }), [notes, isLoading, addNote, removeNote]);

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}

/**
 * The custom hook that UI components will use to access the notes state and actions.
 */
export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}