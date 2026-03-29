"use client";

import { ArrowLeft, Users } from "@phosphor-icons/react";
import { useDataPanelStore } from "@/stores/data-panel-store";
import { MOCK_JOBS } from "@/data/mock-jobs";
import { getCandidatesForJob } from "@/data/mock-candidates";
import type { Candidate } from "@/data/mock-candidates";

/**
 * PipelinePanelContent — Candidate ranking for selected job, embedded in right sidebar.
 *
 * Shows:
 * - Job title header with back button
 * - JD skill tags (compact)
 * - Ranked candidate list with scores
 * - Click candidate to switch to Profile tab
 */

/** Returns the CSS color for a score bar based on score range. */
function getScoreColor(score: number): string {
  if (score >= 80) return "var(--score-gradient-high)";
  if (score >= 50) return "var(--score-gradient-mid)";
  return "var(--score-gradient-low)";
}

/** Returns the Tailwind text color class for a score value. */
function getScoreTextClass(score: number): string {
  if (score >= 80) return "text-score-high";
  if (score >= 50) return "text-score-mid";
  return "text-score-low";
}

export function PipelinePanelContent() {
  const { selectedJobId, backToJobs, selectCandidate } = useDataPanelStore();

  if (!selectedJobId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-text-muted text-sm font-mono mb-2">
            No job selected
          </p>
          <button
            onClick={backToJobs}
            className="text-accent-primary text-xs font-mono hover:underline"
          >
            Select a job from the Jobs tab
          </button>
        </div>
      </div>
    );
  }

  const job = MOCK_JOBS.find((j) => j.id === selectedJobId);
  if (!job) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <p className="text-text-muted text-sm font-mono">Job not found</p>
      </div>
    );
  }

  const candidates = getCandidatesForJob(selectedJobId);

  return (
    <div className="flex flex-col h-full overflow-hidden" data-testid="pipeline-panel">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between h-10 px-3 border-b border-border-default">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={backToJobs}
            className="flex-shrink-0 p-1 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Back to Jobs"
            data-testid="back-to-jobs"
          >
            <ArrowLeft size={14} weight="bold" />
          </button>
          <h3 className="font-heading text-xs font-700 text-text-primary truncate">
            {job.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-text-muted text-[11px] flex-shrink-0">
          <Users size={12} weight="bold" />
          <span className="font-mono">{candidates.length}</span>
        </div>
      </div>

      {/* Compact JD tags */}
      {job.jd && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-border-default">
          <div className="flex flex-wrap gap-1">
            {job.jd.skills.slice(0, 6).map((skill) => (
              <span
                key={skill.name}
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-500 leading-tight ${
                  skill.category === "required"
                    ? "text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
                    : "text-text-secondary border border-border-default border-dashed"
                }`}
              >
                {skill.name}
              </span>
            ))}
            {job.jd.skills.length > 6 && (
              <span className="text-text-muted text-[10px] font-mono self-center">
                +{job.jd.skills.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Candidate list header */}
      <div className="flex-shrink-0 flex items-center h-8 px-3 border-b border-border-default bg-surface-primary/50">
        <span className="w-6 table-header text-center">#</span>
        <span className="flex-1 table-header pl-2">Name</span>
        <span className="w-16 table-header text-right">Score</span>
      </div>

      {/* Candidate rows */}
      <div className="flex-1 overflow-y-auto" data-testid="pipeline-candidate-list">
        {candidates.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted text-xs font-mono">No candidates</p>
          </div>
        ) : (
          candidates.map((candidate, index) => (
            <CandidateRowCompact
              key={candidate.id}
              candidate={candidate}
              rank={index + 1}
              isOdd={index % 2 === 1}
              onSelect={() => selectCandidate(selectedJobId, candidate.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Candidate Row (compact for sidebar) ──────────────────────────────────

function CandidateRowCompact({
  candidate,
  rank,
  isOdd,
  onSelect,
}: {
  candidate: Candidate;
  rank: number;
  isOdd: boolean;
  onSelect: () => void;
}) {
  const scoreColor = getScoreColor(candidate.matchScore);
  const scoreTextClass = getScoreTextClass(candidate.matchScore);

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center h-[38px] px-3 border-b border-border-default cursor-pointer transition-colors hover:bg-surface-tertiary text-left ${
        isOdd ? "bg-surface-tertiary/30" : "bg-transparent"
      }`}
      data-testid={`candidate-row-${candidate.id}`}
    >
      {/* Rank */}
      <span className="w-6 text-center font-mono text-[10px] text-text-muted">
        {rank}
      </span>

      {/* Name */}
      <span className="flex-1 pl-2 text-xs text-text-primary font-500 truncate">
        {candidate.name}
      </span>

      {/* Score with mini bar */}
      <div className="w-16 flex items-center gap-1.5 justify-end">
        <div className="w-8 h-[4px] bg-surface-tertiary">
          <div
            className="h-full"
            style={{
              width: `${candidate.matchScore}%`,
              backgroundColor: scoreColor,
            }}
          />
        </div>
        <span
          className={`font-heading text-xs font-700 min-w-[24px] text-right ${scoreTextClass}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {candidate.matchScore}
        </span>
      </div>
    </button>
  );
}
