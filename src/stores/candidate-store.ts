import { create } from "zustand";
import type { Candidate, PipelineStatus } from "@/data/mock-candidates";

/**
 * CandidateStore — Holds candidates from Apollo API searches.
 *
 * For mock/existing jobs, the pipeline panel still reads from MOCK_CANDIDATES.
 * For jobs created via FLOW-1 + searched via FLOW-2, candidates are stored here.
 *
 * Pipeline status overrides (C-3): For mock candidates not in this store,
 * statusOverrides tracks pipeline status changes made via bulk actions.
 */

interface CandidateStoreState {
  /** Map of jobId -> candidate array (from Apollo API or other external sources) */
  candidatesByJob: Record<string, Candidate[]>;
  /** Set of jobIds that have had candidates explicitly set (even if empty, e.g. after refinement filtering) */
  jobsWithCandidates: Record<string, boolean>;
  /** Whether a search is currently in progress for a job */
  loadingJobs: Record<string, boolean>;
  /** Error messages keyed by jobId */
  errors: Record<string, string | null>;
  /** Pipeline status overrides for mock candidates: { "jobId:candidateId": PipelineStatus } */
  statusOverrides: Record<string, PipelineStatus>;

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
  /** Check if candidates have been explicitly set for a job (even if empty) */
  hasCandidatesSet: (jobId: string) => boolean;
  /** Bulk-update pipeline status for multiple candidates in a job (C-3) */
  bulkUpdateStatus: (jobId: string, candidateIds: string[], newStatus: PipelineStatus) => void;
  /** Get pipeline status override for a candidate (returns undefined if no override) */
  getStatusOverride: (jobId: string, candidateId: string) => PipelineStatus | undefined;
}

export const useCandidateStore = create<CandidateStoreState>((set, get) => ({
  candidatesByJob: {},
  jobsWithCandidates: {},
  loadingJobs: {},
  errors: {},
  statusOverrides: {},

  setCandidates: (jobId, candidates) =>
    set((state) => ({
      candidatesByJob: { ...state.candidatesByJob, [jobId]: candidates },
      jobsWithCandidates: { ...state.jobsWithCandidates, [jobId]: true },
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

  hasCandidatesSet: (jobId) => {
    return get().jobsWithCandidates[jobId] === true;
  },

  bulkUpdateStatus: (jobId, candidateIds, newStatus) =>
    set((state) => {
      // For API-sourced candidates, update the candidatesByJob array directly
      const apiCandidates = state.candidatesByJob[jobId];
      const updatedApi = apiCandidates
        ? {
            candidatesByJob: {
              ...state.candidatesByJob,
              [jobId]: apiCandidates.map((c) =>
                candidateIds.includes(c.id)
                  ? { ...c, pipelineStatus: newStatus }
                  : c
              ),
            },
          }
        : {};

      // For all candidates (including mock), store status overrides
      const overrides = { ...state.statusOverrides };
      for (const cid of candidateIds) {
        overrides[`${jobId}:${cid}`] = newStatus;
      }

      return { ...updatedApi, statusOverrides: overrides };
    }),

  getStatusOverride: (jobId, candidateId) => {
    return get().statusOverrides[`${jobId}:${candidateId}`];
  },
}));
