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

/** Shared chat message interface used by both desktop and mobile chat views. */
export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  /** When type is "progress", the message renders a ProgressIndicator instead of a bubble. */
  type?: "text" | "progress";
  /** Progress state — only present when type === "progress". */
  progress?: ProgressState;
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
