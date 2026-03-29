import { create } from "zustand";
import type { ChatMessage } from "@/components/chat/chat-types";
import { INITIAL_MESSAGES } from "@/components/chat/chat-types";

interface SidebarState {
  /** Whether the sidebar is expanded (true) or collapsed to icon strip (false) */
  isExpanded: boolean;
  /** On mobile, which tab is active: "chat" | "dashboard" | "pipeline" */
  mobileActiveTab: "chat" | "dashboard" | "pipeline";
  /** Chat messages — stored here so they survive mobile tab switches */
  chatMessages: ChatMessage[];
  /** Toggle sidebar expanded/collapsed */
  toggle: () => void;
  /** Set sidebar expanded state directly */
  setExpanded: (expanded: boolean) => void;
  /** Set the active mobile tab */
  setMobileActiveTab: (tab: "chat" | "dashboard" | "pipeline") => void;
  /** Append a message to the chat history */
  addChatMessage: (message: ChatMessage) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isExpanded: true,
  mobileActiveTab: "chat",
  chatMessages: INITIAL_MESSAGES,
  toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (expanded) => set({ isExpanded: expanded }),
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
}));
