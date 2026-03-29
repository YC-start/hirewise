import { create } from "zustand";

type ViewMode = "grid" | "list";

interface DashboardState {
  /** Current view mode: grid (card grid) or list (compact table) */
  viewMode: ViewMode;
  /** Set the view mode */
  setViewMode: (mode: ViewMode) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  viewMode: "grid",
  setViewMode: (mode) => set({ viewMode: mode }),
}));
