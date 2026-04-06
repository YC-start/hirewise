"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Lightning,
  MagnifyingGlass,
  Briefcase,
  ChartBar,
  UserPlus,
  Funnel,
  ArrowsClockwise,
  Star,
} from "@phosphor-icons/react";
import { useDataPanelStore } from "@/stores/data-panel-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { ChatMessage } from "./chat-types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface QuickCommand {
  /** Display label on the chip */
  label: string;
  /** Full prompt text to pre-fill into the input */
  prompt: string;
  /** Icon component rendered inline */
  icon: React.ReactNode;
}

// ── Suggestion sets by context ───────────────────────────────────────────────

const DASHBOARD_SUGGESTIONS: QuickCommand[] = [
  {
    label: "Create a new job",
    prompt:
      "I need to hire a senior Go backend engineer in Berlin, 5+ years experience, must know Kubernetes",
    icon: <Briefcase size={12} weight="bold" />,
  },
  {
    label: "Find senior engineers",
    prompt:
      "Find me 50 senior backend engineers with Go + Kubernetes experience, remote-friendly, US/EU timezone",
    icon: <MagnifyingGlass size={12} weight="bold" />,
  },
  {
    label: "Search designers",
    prompt:
      "Search for product designers with Figma and design systems experience",
    icon: <UserPlus size={12} weight="bold" />,
  },
  {
    label: "Pipeline overview",
    prompt: "Give me an overview of all active job pipelines and their status",
    icon: <ChartBar size={12} weight="bold" />,
  },
];

const PIPELINE_SUGGESTIONS: QuickCommand[] = [
  {
    label: "Find more candidates",
    prompt: "Find 30 more candidates matching this job's requirements",
    icon: <MagnifyingGlass size={12} weight="bold" />,
  },
  {
    label: "Re-rank by tech fit",
    prompt: "Re-rank all candidates by Technical Fit score descending",
    icon: <ArrowsClockwise size={12} weight="bold" />,
  },
  {
    label: "Filter top scorers",
    prompt: "Show me only candidates who scored above 85%",
    icon: <Funnel size={12} weight="bold" />,
  },
  {
    label: "Shortlist top 5",
    prompt:
      "Advance the top 5 candidates to Interview Scheduled stage",
    icon: <Star size={12} weight="bold" />,
  },
];

const CANDIDATE_SUGGESTIONS: QuickCommand[] = [
  {
    label: "Generate interview questions",
    prompt:
      "Generate tailored interview questions for this candidate based on their profile and the JD",
    icon: <Lightning size={12} weight="bold" />,
  },
  {
    label: "Evaluate strengths",
    prompt:
      "Summarize this candidate's key strengths and potential skill gaps",
    icon: <ChartBar size={12} weight="bold" />,
  },
  {
    label: "Compare with others",
    prompt:
      "Compare this candidate with the top 3 candidates in the pipeline",
    icon: <ArrowsClockwise size={12} weight="bold" />,
  },
];

const POST_TASK_SUGGESTIONS: QuickCommand[] = [
  {
    label: "Refine results",
    prompt: "Show me only candidates with startup experience",
    icon: <Funnel size={12} weight="bold" />,
  },
  {
    label: "Create another job",
    prompt: "I need to open another position",
    icon: <Briefcase size={12} weight="bold" />,
  },
  {
    label: "Search more candidates",
    prompt: "Find 30 more candidates for this role",
    icon: <MagnifyingGlass size={12} weight="bold" />,
  },
];

// ── Hook: resolve suggestions by context ─────────────────────────────────────

function useContextualSuggestions(messages: ChatMessage[]): QuickCommand[] {
  const pathname = usePathname();
  const selectedJobId = useDataPanelStore((s) => s.selectedJobId);
  const jobs = useDashboardStore((s) => s.jobs);

  return useMemo(() => {
    // Check if last message is a completed task (action-card or jd-preview confirmed)
    const lastMsg = messages[messages.length - 1];
    const isPostTask =
      lastMsg &&
      (lastMsg.type === "action-card" ||
        (lastMsg.type === "text" &&
          lastMsg.role === "agent" &&
          /created|complete|done|added|scheduled/i.test(lastMsg.content)));

    if (isPostTask && messages.length > 1) {
      return POST_TASK_SUGGESTIONS;
    }

    // Route-based context detection
    if (pathname?.match(/^\/job\/[^/]+\/candidate\//)) {
      return CANDIDATE_SUGGESTIONS;
    }

    if (pathname?.match(/^\/job\/[^/]+\/pipeline/)) {
      // On pipeline page — personalize if we know the job
      if (selectedJobId) {
        const job = jobs.find((j) => j.id === selectedJobId);
        if (job) {
          // Replace the first suggestion with a job-specific one
          return PIPELINE_SUGGESTIONS.map((cmd, i) =>
            i === 0
              ? {
                  ...cmd,
                  prompt: `Find 30 more candidates matching the ${job.title} requirements`,
                }
              : cmd,
          );
        }
      }
      return PIPELINE_SUGGESTIONS;
    }

    // Default: dashboard context
    return DASHBOARD_SUGGESTIONS;
  }, [pathname, selectedJobId, jobs, messages]);
}

// ── Component ────────────────────────────────────────────────────────────────

interface QuickCommandChipsProps {
  /** Chat messages — used to determine post-task context */
  messages: ChatMessage[];
  /** Callback when a chip is clicked — receives the prompt to pre-fill */
  onSelect: (prompt: string) => void;
}

export function QuickCommandChips({
  messages,
  onSelect,
}: QuickCommandChipsProps) {
  const suggestions = useContextualSuggestions(messages);

  return (
    <div data-testid="quick-commands">
      <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
        Suggestions
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => onSelect(cmd.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-text-secondary border border-border-default bg-surface-secondary hover:bg-surface-tertiary hover:text-accent-primary hover:border-accent-primary/30 transition-colors cursor-pointer"
            data-testid={`quick-cmd-${cmd.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cmd.icon}
            {cmd.label}
          </button>
        ))}
      </div>
    </div>
  );
}
