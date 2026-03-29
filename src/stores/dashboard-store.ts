import { create } from "zustand";
import { MOCK_JOBS, type Job } from "@/data/mock-jobs";

type ViewMode = "grid" | "list";

interface DashboardState {
  /** Current view mode: grid (card grid) or list (compact table) */
  viewMode: ViewMode;
  /** All jobs displayed on the dashboard */
  jobs: Job[];
  /** Whether the quick-create modal is open */
  isCreateModalOpen: boolean;
  /** Set the view mode */
  setViewMode: (mode: ViewMode) => void;
  /** Add a new job to the list */
  addJob: (job: Job) => void;
  /** Open the quick-create modal */
  openCreateModal: () => void;
  /** Close the quick-create modal */
  closeCreateModal: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  viewMode: "grid",
  jobs: MOCK_JOBS,
  isCreateModalOpen: false,
  setViewMode: (mode) => set({ viewMode: mode }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));
