"use client";

import { useSidebarStore } from "@/stores/sidebar-store";

/**
 * Shared chat logic hook — used by both ChatSidebar and MobileChatView.
 * Messages are stored in the Zustand sidebar store so they survive
 * mobile tab switches (MobileChatView unmount/remount).
 */
export function useChat() {
  const { chatMessages, addChatMessage } = useSidebarStore();

  const handleSend = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: trimmed,
      timestamp: new Date(),
    };

    addChatMessage(userMessage);

    // Simulate agent response after a short delay
    setTimeout(() => {
      const agentMessage = {
        id: `agent-${Date.now()}`,
        role: "agent" as const,
        content: `Processing your request: "${trimmed}". Full agent integration will be available in a future update.`,
        timestamp: new Date(),
      };
      addChatMessage(agentMessage);
    }, 600);
  };

  return { messages: chatMessages, handleSend };
}
