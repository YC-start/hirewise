/** Shared chat message interface used by both desktop and mobile chat views. */
export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
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
