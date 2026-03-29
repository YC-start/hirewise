import { create } from "zustand";

export type DataPanelTab = "jobs" | "pipeline" | "profile";

interface DataPanelState {
  /** Whether the right data panel sidebar is expanded */
  isDataPanelOpen: boolean;
  /** Active tab in the data panel */
  activeTab: DataPanelTab;
  /** Currently selected job ID (for pipeline/profile tabs) */
  selectedJobId: string | null;
  /** Currently selected candidate ID (for profile tab) */
  selectedCandidateId: string | null;
  /** Toggle data panel open/closed */
  toggleDataPanel: () => void;
  /** Set data panel open state directly */
  setDataPanelOpen: (open: boolean) => void;
  /** Switch the active tab */
  setActiveTab: (tab: DataPanelTab) => void;
  /** Select a job (switches to pipeline tab) */
  selectJob: (jobId: string) => void;
  /** Select a candidate (switches to profile tab) */
  selectCandidate: (jobId: string, candidateId: string) => void;
  /** Go back to jobs tab */
  backToJobs: () => void;
  /** Go back to pipeline tab */
  backToPipeline: () => void;
}

export const useDataPanelStore = create<DataPanelState>((set) => ({
  isDataPanelOpen: true,
  activeTab: "jobs",
  selectedJobId: null,
  selectedCandidateId: null,
  toggleDataPanel: () =>
    set((state) => ({ isDataPanelOpen: !state.isDataPanelOpen })),
  setDataPanelOpen: (open) => set({ isDataPanelOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectJob: (jobId) =>
    set({ selectedJobId: jobId, activeTab: "pipeline" }),
  selectCandidate: (jobId, candidateId) =>
    set({
      selectedJobId: jobId,
      selectedCandidateId: candidateId,
      activeTab: "profile",
    }),
  backToJobs: () =>
    set({
      activeTab: "jobs",
      selectedJobId: null,
      selectedCandidateId: null,
    }),
  backToPipeline: () =>
    set({
      activeTab: "pipeline",
      selectedCandidateId: null,
    }),
}));
