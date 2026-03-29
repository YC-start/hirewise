/** Progress step definitions for agent execution ticker. */
export type ProgressStepKey = "searching" | "retrieving" | "scoring" | "complete";

export interface ProgressStep {
  key: ProgressStepKey;
  label: string;
}

/** The four-stage progress sequence. */
export const PROGRESS_STEPS: ProgressStep[] = [
  { key: "searching", label: "Searching talent pools..." },
  { key: "retrieving", label: "Retrieved 50 resumes..." },
  { key: "scoring", label: "Scoring 34/50..." },
  { key: "complete", label: "Complete: 12 candidates above 85%" },
];

/** Progress state embedded in a chat message. */
export interface ProgressState {
  /** Index of the currently active step (0-3). */
  currentStep: number;
  /** The status text for the current step. */
  statusText: string;
  /** Whether the full sequence is finished. */
  isComplete: boolean;
}

/** Data payload for structured Action Card messages. */
export interface ActionCardData {
  /** Card title, e.g., "Search Complete" */
  title: string;
  /** Summary text, e.g., "Found 50 candidates. 12 scored above 85%..." */
  summary: string;
  /** Key metrics displayed as label/value pairs. */
  metrics: { label: string; value: string | number }[];
  /** CTA button label, e.g., "View Ranking" */
  actionLabel: string;
  /** Navigation target for the CTA button. */
  actionHref: string;
}

/** Shared chat message interface used by both desktop and mobile chat views. */
export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  /** Message type determines rendering: text bubble, progress indicator, or action card. */
  type?: "text" | "progress" | "action-card";
  /** Progress state — only present when type === "progress". */
  progress?: ProgressState;
  /** Action card data — only present when type === "action-card". */
  actionCard?: ActionCardData;
}

/** Welcome message shown when chat is first loaded. */
export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "agent",
    content:
      "Welcome to HireWise. I'm your recruiting agent. Tell me what you need — find candidates, create a job, or summarize your pipeline.",
    timestamp: new Date(),
  },
];
