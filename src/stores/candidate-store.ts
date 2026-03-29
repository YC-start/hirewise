import { create } from "zustand";
import type { Candidate } from "@/data/mock-candidates";

/**
 * CandidateStore — Holds candidates from Apollo API searches.
 *
 * For mock/existing jobs, the pipeline panel still reads from MOCK_CANDIDATES.
 * For jobs created via FLOW-1 + searched via FLOW-2, candidates are stored here.
 */

interface CandidateStoreState {
  /** Map of jobId -> candidate array (from Apollo API or other external sources) */
  candidatesByJob: Record<string, Candidate[]>;
  /** Whether a search is currently in progress for a job */
  loadingJobs: Record<string, boolean>;
  /** Error messages keyed by jobId */
  errors: Record<string, string | null>;

  /** Set candidates for a job (replaces any existing) */
  setCandidates: (jobId: string, candidates: Candidate[]) => void;
  /** Mark a job as loading / not loading */
  setLoading: (jobId: string, loading: boolean) => void;
  /** Set an error for a job */
  setError: (jobId: string, error: string | null) => void;
  /** Get candidates for a job (returns empty array if none) */
  getCandidates: (jobId: string) => Candidate[];
  /** Check if a job has API-sourced candidates */
  hasApiCandidates: (jobId: string) => boolean;
}

export const useCandidateStore = create<CandidateStoreState>((set, get) => ({
  candidatesByJob: {},
  loadingJobs: {},
  errors: {},

  setCandidates: (jobId, candidates) =>
    set((state) => ({
      candidatesByJob: { ...state.candidatesByJob, [jobId]: candidates },
    })),

  setLoading: (jobId, loading) =>
    set((state) => ({
      loadingJobs: { ...state.loadingJobs, [jobId]: loading },
    })),

  setError: (jobId, error) =>
    set((state) => ({
      errors: { ...state.errors, [jobId]: error },
    })),

  getCandidates: (jobId) => {
    return get().candidatesByJob[jobId] || [];
  },

  hasApiCandidates: (jobId) => {
    return (get().candidatesByJob[jobId] || []).length > 0;
  },
}));
