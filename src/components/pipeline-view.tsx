"use client";

import Link from "next/link";
import { ArrowLeft, Users } from "@phosphor-icons/react";
import { MOCK_JOBS } from "@/data/mock-jobs";
import { JDContextRail } from "@/components/jd-context-rail";
import { CandidateRankedList } from "@/components/candidate-ranked-list";

/**
 * PipelineView — Client component for the /job/:id/pipeline page.
 *
 * Layout:
 * - Left rail: JD context tags (C-1)
 * - Main panel: Candidate ranked list with scores (C-2)
 *
 * The left rail uses sticky/fixed height so it stays visible
 * while the candidate list scrolls.
 */

interface PipelineViewProps {
  jobId: string;
}

export function PipelineView({ jobId }: PipelineViewProps) {
  const job = MOCK_JOBS.find((j) => j.id === jobId);

  if (!job) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
            Job Not Found
          </h2>
          <p className="text-text-muted text-sm mb-4">
            No job found with ID #{jobId}
          </p>
          <Link
            href="/dashboard"
            className="text-accent-primary text-sm font-mono hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="pipeline-page">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-4 border-b border-border-default bg-surface-primary">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-7 h-7 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
            aria-label="Back to Dashboard"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft size={16} weight="bold" />
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-bold text-text-primary">
              Pipeline
            </h2>
            <span className="text-text-muted text-xs font-mono">
              / {job.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-xs">
          <Users size={14} weight="bold" />
          <span className="font-mono">{job.resumes}</span>
          <span className="text-text-muted">candidates</span>
        </div>
      </header>

      {/* Main content area: left rail + candidate list */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left rail — JD context tags (C-1) */}
        {job.jd ? (
          <JDContextRail
            jobId={job.id}
            jobTitle={job.title}
            department={job.department}
            status={job.status}
            jd={job.jd}
          />
        ) : (
          <aside className="w-[280px] min-w-[280px] h-full border-r border-border-default bg-surface-secondary flex items-center justify-center p-4">
            <p className="text-text-muted text-xs text-center">
              No JD defined for this job.
            </p>
          </aside>
        )}

        {/* Main panel — candidate ranked list (C-2) */}
        <div
          className="flex-1 overflow-hidden"
          data-testid="candidate-list-panel"
        >
          <CandidateRankedList jobId={job.id} />
        </div>
      </div>
    </div>
  );
}
