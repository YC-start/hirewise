"use client";

import { useCallback, useRef } from "react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { MOCK_JOBS } from "@/data/mock-jobs";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
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
  "hire",
  "hiring",
];

/** Check if user input contains a search-related keyword. */
function isSearchQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return SEARCH_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Attempt to match user query to a specific mock job based on keywords.
 * Returns the best-matching job or defaults to job "1".
 */
function matchJobFromQuery(query: string): {
  jobId: string;
  jobTitle: string;
  totalCandidates: number;
  highScoreCount: number;
  avgScore: number;
} {
  const lower = query.toLowerCase();

  // Score each job by how many of its keywords appear in the query
  let bestJob = MOCK_JOBS[0];
  let bestScore = 0;

  for (const job of MOCK_JOBS) {
    let score = 0;
    const titleWords = job.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 2 && lower.includes(word)) {
        score += 2;
      }
    }
    // Also check JD skills
    if (job.jd) {
      for (const skill of job.jd.skills) {
        if (lower.includes(skill.name.toLowerCase())) {
          score += 3;
        }
      }
    }
    // Check department
    if (lower.includes(job.department.toLowerCase())) {
      score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestJob = job;
    }
  }

  // Get actual candidate stats for the matched job
  const candidates = MOCK_CANDIDATES[bestJob.id] || [];
  const totalCandidates = candidates.length > 0 ? candidates.length : bestJob.resumes;
  const highScoreCount =
    candidates.length > 0
      ? candidates.filter((c) => c.matchScore >= 80).length
      : bestJob.highScore;
  const avgScore =
    candidates.length > 0
      ? Math.round(candidates.reduce((s, c) => s + c.matchScore, 0) / candidates.length)
      : 74;

  return {
    jobId: bestJob.id,
    jobTitle: bestJob.title,
    totalCandidates,
    highScoreCount,
    avgScore,
  };
}

/**
 * Extract a concise description of what the user is searching for,
 * used to generate the agent acknowledgement message.
 */
function buildAcknowledgement(query: string, jobTitle: string): string {
  // Try to extract the core requirement from the query
  const lower = query.toLowerCase();

  // Remove common filler phrases to extract the core
  const fillers = [
    "find me",
    "find",
    "search for",
    "look for",
    "looking for",
    "i need",
    "i want",
    "can you find",
    "please",
    "help me find",
    "source",
    "recruit",
  ];
  let core = lower;
  for (const filler of fillers) {
    core = core.replace(filler, "");
  }
  core = core.replace(/^\s+/, "").replace(/\s+$/, "");

  if (core.length > 10) {
    // Capitalize first letter
    const desc = core.charAt(0).toUpperCase() + core.slice(1);
    return `Got it! Searching for ${desc}. Matching against the ${jobTitle} pipeline...`;
  }

  return `Got it! Searching candidates for the ${jobTitle} role...`;
}

/**
 * Shared chat logic hook — used by both ChatSidebar and MobileChatView.
 * Messages are stored in the Zustand sidebar store so they survive
 * mobile tab switches (MobileChatView unmount/remount).
 *
 * When a search query is detected:
 * 1. An immediate acknowledgement message is shown
 * 2. A progress ticker message is inserted and advanced through 4 stages
 * 3. On completion, a structured Action Card with "View Ranking" CTA appears
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
        // Match the query to a job
        const match = matchJobFromQuery(trimmed);

        // 1. Immediate acknowledgement message
        const ackMessage: ChatMessage = {
          id: `ack-${Date.now()}`,
          role: "agent",
          content: buildAcknowledgement(trimmed, match.jobTitle),
          timestamp: new Date(),
        };
        addChatMessage(ackMessage);

        // 2. Insert progress message at step 0 (after a short delay for natural feel)
        const progressId = `progress-${Date.now() + 1}`;
        const progressTimer = setTimeout(() => {
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
        }, 400);

        // Clear any pending timers from a previous sequence
        progressTimers.current.forEach(clearTimeout);
        progressTimers.current = [progressTimer];

        // Schedule step advances: step 1 at 1.9s, step 2 at 3.4s, step 3 (complete) at 4.9s
        // (offsets account for the 400ms delay before progress starts)
        const stepDelays = [1900, 3400, 4900];

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

            // 3. After completion, add a structured Action Card
            if (isLast) {
              const actionTimer = setTimeout(() => {
                const actionCardData: ActionCardData = {
                  title: "Search Complete",
                  summary: `Found ${match.totalCandidates} candidates. ${match.highScoreCount} scored above 85% for ${match.jobTitle}.`,
                  metrics: [
                    { label: "Total", value: match.totalCandidates },
                    { label: "High Score", value: match.highScoreCount },
                    { label: "Avg Score", value: match.avgScore },
                  ],
                  actionLabel: "View Ranking",
                  actionHref: `/job/${match.jobId}/pipeline`,
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
              progressTimers.current.push(actionTimer);
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
