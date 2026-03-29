"use client";

import { useCallback, useRef } from "react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { PROGRESS_STEPS } from "./chat-types";
import type { ChatMessage, ActionCardData } from "./chat-types";

/** Keywords that trigger the search progress sequence. */
const SEARCH_KEYWORDS = [
  "find",
  "search",
  "look for",
  "looking for",
  "source",
  "recruit",
  "candidates",
  "engineers",
  "developers",
  "designers",
  "managers",
  "talent",
];

/** Check if user input contains a search-related keyword. */
function isSearchQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return SEARCH_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Shared chat logic hook — used by both ChatSidebar and MobileChatView.
 * Messages are stored in the Zustand sidebar store so they survive
 * mobile tab switches (MobileChatView unmount/remount).
 *
 * When a search query is detected, a progress ticker message is inserted
 * and advanced through 4 stages via setTimeout.
 */
export function useChat() {
  const { chatMessages, addChatMessage, updateChatMessage } =
    useSidebarStore();
  const progressTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleSend = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      addChatMessage(userMessage);

      if (isSearchQuery(trimmed)) {
        // Insert progress message at step 0
        const progressId = `progress-${Date.now()}`;
        const progressMessage: ChatMessage = {
          id: progressId,
          role: "agent",
          content: "",
          timestamp: new Date(),
          type: "progress",
          progress: {
            currentStep: 0,
            statusText: PROGRESS_STEPS[0].label,
            isComplete: false,
          },
        };
        addChatMessage(progressMessage);

        // Clear any pending timers from a previous sequence
        progressTimers.current.forEach(clearTimeout);
        progressTimers.current = [];

        // Schedule step advances: step 1 at 1.5s, step 2 at 3s, step 3 (complete) at 4.5s
        const stepDelays = [1500, 3000, 4500];

        stepDelays.forEach((delay, i) => {
          const stepIndex = i + 1; // steps 1, 2, 3
          const timer = setTimeout(() => {
            const isLast = stepIndex === PROGRESS_STEPS.length - 1;
            updateChatMessage(progressId, {
              progress: {
                currentStep: stepIndex,
                statusText: PROGRESS_STEPS[stepIndex].label,
                isComplete: isLast,
              },
            });

            // After completion, add a structured Action Card
            if (isLast) {
              setTimeout(() => {
                const actionCardData: ActionCardData = {
                  title: "Search Complete",
                  summary:
                    "Found 50 candidates. 12 scored above 85% for Senior Backend Engineer.",
                  metrics: [
                    { label: "Total", value: 50 },
                    { label: "High Score", value: 12 },
                    { label: "Avg Score", value: 74 },
                  ],
                  actionLabel: "View Ranking",
                  actionHref: "/job/1/pipeline",
                };
                const actionCardMessage: ChatMessage = {
                  id: `action-card-${Date.now()}`,
                  role: "agent",
                  content: "",
                  timestamp: new Date(),
                  type: "action-card",
                  actionCard: actionCardData,
                };
                addChatMessage(actionCardMessage);
              }, 600);
            }
          }, delay);
          progressTimers.current.push(timer);
        });
      } else {
        // Non-search: standard simulated agent response
        setTimeout(() => {
          const agentMessage: ChatMessage = {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: `Processing your request: "${trimmed}". Full agent integration will be available in a future update.`,
            timestamp: new Date(),
          };
          addChatMessage(agentMessage);
        }, 600);
      }
    },
    [addChatMessage, updateChatMessage],
  );

  return { messages: chatMessages, handleSend };
}
