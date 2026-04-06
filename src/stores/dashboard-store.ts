import { create } from "zustand";
import { MOCK_JOBS, CURRENT_USER, type Job } from "@/data/mock-jobs";

type ViewMode = "grid" | "list";

interface DashboardState {
  /** Current view mode: grid (card grid) or list (compact table) */
  viewMode: ViewMode;
  /** All jobs displayed on the dashboard */
  jobs: Job[];
  /** Whether the quick-create modal is open */
  isCreateModalOpen: boolean;

  // ── B-5: Dashboard filters ──────────────────────────
  /** Active department filter — null means "All Departments" */
  departmentFilter: string | null;
  /** Whether to show only jobs owned by the current user */
  myJobsOnly: boolean;

  /** Set the view mode */
  setViewMode: (mode: ViewMode) => void;
  /** Add a new job to the list */
  addJob: (job: Job) => void;
  /** Update a job's status (e.g., Close or Archive a job) */
  updateJobStatus: (jobId: string, status: Job["status"]) => void;
  /** Open the quick-create modal */
  openCreateModal: () => void;
  /** Close the quick-create modal */
  closeCreateModal: () => void;

  // ── B-5: Filter actions ─────────────────────────────
  /** Set department filter (null = all) */
  setDepartmentFilter: (dept: string | null) => void;
  /** Toggle "My Jobs" owner filter */
  setMyJobsOnly: (on: boolean) => void;
  /** Clear all active filters at once */
  clearFilters: () => void;
  /** Whether any filter is currently active */
  hasActiveFilters: () => boolean;
  /** Get filtered jobs list */
  getFilteredJobs: () => Job[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  viewMode: "grid",
  jobs: MOCK_JOBS,
  isCreateModalOpen: false,
  departmentFilter: null,
  myJobsOnly: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
  updateJobStatus: (jobId, status) =>
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === jobId ? { ...j, status } : j,
      ),
    })),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  // ── B-5: Filter actions ─────────────────────────────
  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),
  setMyJobsOnly: (on) => set({ myJobsOnly: on }),
  clearFilters: () => set({ departmentFilter: null, myJobsOnly: false }),
  hasActiveFilters: () => {
    const state = get();
    return state.departmentFilter !== null || state.myJobsOnly;
  },
  getFilteredJobs: () => {
    const { jobs, departmentFilter, myJobsOnly } = get();
    let filtered = jobs;
    if (departmentFilter) {
      filtered = filtered.filter((j) => j.department === departmentFilter);
    }
    if (myJobsOnly) {
      filtered = filtered.filter((j) => j.owner === CURRENT_USER);
    }
    return filtered;
  },
}));
