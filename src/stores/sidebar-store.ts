import { create } from "zustand";

interface SidebarState {
  /** Whether the sidebar is expanded (true) or collapsed to icon strip (false) */
  isExpanded: boolean;
  /** On mobile, which tab is active: "chat" | "dashboard" | "pipeline" */
  mobileActiveTab: "chat" | "dashboard" | "pipeline";
  /** Toggle sidebar expanded/collapsed */
  toggle: () => void;
  /** Set sidebar expanded state directly */
  setExpanded: (expanded: boolean) => void;
  /** Set the active mobile tab */
  setMobileActiveTab: (tab: "chat" | "dashboard" | "pipeline") => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isExpanded: true,
  mobileActiveTab: "chat",
  toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
}));
