import { create } from "zustand";

/**
 * SelectionStore — Manages multi-select state for candidate bulk actions (C-3).
 *
 * Tracks which candidates are selected per job pipeline. Selection is scoped
 * to a specific jobId so switching jobs clears the selection.
 */

interface SelectionStoreState {
  /** Currently active jobId for selection scope */
  activeJobId: string | null;
  /** Set of selected candidate IDs */
  selectedIds: Set<string>;

  /** Toggle a single candidate's selection */
  toggle: (jobId: string, candidateId: string) => void;
  /** Select all candidates from a given list */
  selectAll: (jobId: string, candidateIds: string[]) => void;
  /** Deselect all */
  deselectAll: () => void;
  /** Check if a candidate is selected */
  isSelected: (candidateId: string) => boolean;
  /** Get count of selected candidates */
  count: () => number;
  /** Get array of selected IDs */
  getSelectedIds: () => string[];
  /** Range select: given an anchor and target, select all between them */
  rangeSelect: (jobId: string, orderedIds: string[], fromId: string, toId: string) => void;
}

export const useSelectionStore = create<SelectionStoreState>((set, get) => ({
  activeJobId: null,
  selectedIds: new Set<string>(),

  toggle: (jobId, candidateId) =>
    set((state) => {
      // If switching jobs, reset selection
      if (state.activeJobId !== jobId) {
        const next = new Set<string>();
        next.add(candidateId);
        return { activeJobId: jobId, selectedIds: next };
      }
      const next = new Set(state.selectedIds);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return { selectedIds: next };
    }),

  selectAll: (jobId, candidateIds) =>
    set(() => ({
      activeJobId: jobId,
      selectedIds: new Set(candidateIds),
    })),

  deselectAll: () =>
    set(() => ({
      selectedIds: new Set<string>(),
    })),

  isSelected: (candidateId) => get().selectedIds.has(candidateId),

  count: () => get().selectedIds.size,

  getSelectedIds: () => Array.from(get().selectedIds),

  rangeSelect: (jobId, orderedIds, fromId, toId) =>
    set((state) => {
      if (state.activeJobId !== jobId) {
        return { activeJobId: jobId, selectedIds: new Set<string>() };
      }
      const fromIdx = orderedIds.indexOf(fromId);
      const toIdx = orderedIds.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) return state;
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const next = new Set(state.selectedIds);
      for (let i = start; i <= end; i++) {
        next.add(orderedIds[i]);
      }
      return { selectedIds: next };
    }),
}));
