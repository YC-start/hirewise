import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * NotesStore (D-5) — Internal notes left on candidate profiles.
 *
 * Notes are scoped to a (jobId, candidateId) pair so the same person
 * appearing in multiple jobs has separate note threads per role.
 *
 * Persisted to localStorage under the "hirewise-notes" key so notes
 * survive page reloads. In a production system this would be backed by
 * Supabase with per-team realtime subscriptions, but for the demo a
 * single-client localStorage store is enough to exercise the full flow
 * (author + timestamp + persistence + isolation between candidates).
 */

export interface Note {
  /** Stable unique id, timestamp-based so ordering is deterministic. */
  id: string;
  /** Scope: job this note was left against. */
  jobId: string;
  /** Scope: candidate this note was left against. */
  candidateId: string;
  /** Plain-text note body as entered by the author. */
  body: string;
  /** Display name of the author. */
  author: string;
  /** Epoch milliseconds the note was created. */
  createdAt: number;
}

/** Key used to index notes by `${jobId}:${candidateId}`. */
function scopeKey(jobId: string, candidateId: string): string {
  return `${jobId}:${candidateId}`;
}

interface NotesState {
  /** Map of "jobId:candidateId" -> array of notes (newest last in storage). */
  notesByCandidate: Record<string, Note[]>;

  /** Append a new note for a candidate. Returns the created note. */
  addNote: (jobId: string, candidateId: string, body: string, author: string) => Note | null;
  /** Get notes for a candidate, already sorted newest-first for display. */
  getNotes: (jobId: string, candidateId: string) => Note[];
  /** Remove a note by its id (within a scope). */
  removeNote: (jobId: string, candidateId: string, noteId: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notesByCandidate: {},

      addNote: (jobId, candidateId, body, author) => {
        const trimmed = body.trim();
        if (trimmed.length === 0) return null;

        const now = Date.now();
        const note: Note = {
          // Timestamp + random suffix avoids collisions if two notes land
          // in the same millisecond.
          id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
          jobId,
          candidateId,
          body: trimmed,
          author,
          createdAt: now,
        };

        set((state) => {
          const key = scopeKey(jobId, candidateId);
          const existing = state.notesByCandidate[key] ?? [];
          return {
            notesByCandidate: {
              ...state.notesByCandidate,
              [key]: [...existing, note],
            },
          };
        });

        return note;
      },

      getNotes: (jobId, candidateId) => {
        const key = scopeKey(jobId, candidateId);
        const notes = get().notesByCandidate[key] ?? [];
        // Newest first for the activity feed.
        return [...notes].sort((a, b) => b.createdAt - a.createdAt);
      },

      removeNote: (jobId, candidateId, noteId) => {
        set((state) => {
          const key = scopeKey(jobId, candidateId);
          const existing = state.notesByCandidate[key];
          if (!existing) return state;
          return {
            notesByCandidate: {
              ...state.notesByCandidate,
              [key]: existing.filter((n) => n.id !== noteId),
            },
          };
        });
      },
    }),
    {
      name: "hirewise-notes",
      storage: createJSONStorage(() => localStorage),
      // Only persist the notes map; functions are recreated on rehydrate.
      partialize: (state) => ({ notesByCandidate: state.notesByCandidate }),
      version: 1,
    },
  ),
);
