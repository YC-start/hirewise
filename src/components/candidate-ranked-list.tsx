"use client";

import { useState, useRef, useCallback } from "react";
import { getCandidatesForJob } from "@/data/mock-candidates";
import { useCandidateStore } from "@/stores/candidate-store";
import { useSelectionStore } from "@/stores/selection-store";
import { BulkActionToolbar } from "@/components/bulk-action-toolbar";
import { CandidateInlinePreview } from "@/components/candidate-inline-preview";
import type { Candidate, PipelineStatus } from "@/data/mock-candidates";

const EMPTY_CANDIDATES: Candidate[] = [];

/**
 * CandidateRankedList — Main panel component for the pipeline page (C-2 + C-3 + C-4).
 *
 * Displays candidates sorted by AI match score descending.
 * Each row shows: checkbox, name, match score (large numeric + horizontal bar), top 3 skill tags.
 * Supports multi-select via checkboxes and shift-click for bulk actions (C-3).
 * Clicking a row (not the checkbox) expands an inline preview panel below (C-4).
 *
 * Design:
 * - Table-style layout with 40-44px row height
 * - Alternating row tint (surface-tertiary/30)
 * - Column headers: uppercase 11px #555555 letter-spacing 0.08em
 * - Score bar: flat/square ends (no rounded), color-coded by score range
 * - Score number: Space Grotesk 700 via JetBrains Mono for monospace alignment
 * - Checkbox column for multi-select with select-all in header
 * - Bulk action toolbar appears at bottom when candidates are selected
 * - Inline preview panel expands below row on click (C-4)
 */

interface CandidateRankedListProps {
  jobId: string;
}

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

/** Returns CSS classes for a pipeline status badge. */
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Interview":
      return "bg-accent-primary text-surface-primary";
    case "Offer":
      return "bg-accent-secondary text-surface-primary";
    case "Hired":
      return "bg-accent-secondary text-surface-primary";
    case "Screening":
      return "bg-signal-warning text-surface-primary";
    case "Rejected":
      return "bg-signal-danger text-surface-primary";
    case "Archived":
      return "bg-text-muted text-surface-primary";
    default:
      return "bg-text-secondary text-surface-primary";
  }
}

export function CandidateRankedList({ jobId }: CandidateRankedListProps) {
  const apiCandidates = useCandidateStore((s) => s.candidatesByJob[jobId] ?? EMPTY_CANDIDATES);
  const hasCandidatesBeenSet = useCandidateStore((s) => s.jobsWithCandidates[jobId] ?? false);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const activeJobId = useSelectionStore((s) => s.activeJobId);
  const toggle = useSelectionStore((s) => s.toggle);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const deselectAll = useSelectionStore((s) => s.deselectAll);
  const rangeSelect = useSelectionStore((s) => s.rangeSelect);

  // Inline preview expansion state (C-4)
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  // Track last clicked candidate for shift-click range selection
  const lastClickedRef = useRef<string | null>(null);

  // Pipeline status overrides (from bulk actions)
  const statusOverrides = useCandidateStore((s) => s.statusOverrides);

  // Use API/refinement candidates if they've been explicitly set (even if empty after filtering),
  // otherwise fall back to mock data for mock jobs that haven't been searched.
  // Apply any status overrides from bulk actions (C-3).
  const rawCandidates = hasCandidatesBeenSet
    ? [...apiCandidates].sort((a, b) => b.matchScore - a.matchScore)
    : getCandidatesForJob(jobId);

  const candidates = rawCandidates.map((c) => {
    const override = statusOverrides[`${jobId}:${c.id}`];
    return override ? { ...c, pipelineStatus: override } : c;
  });

  const candidateIds = candidates.map((c) => c.id);

  // Effective selection: only count selections for this job
  const effectiveSelection = activeJobId === jobId ? selectedIds : new Set<string>();
  const allSelected =
    candidates.length > 0 &&
    candidates.every((c) => effectiveSelection.has(c.id));
  const someSelected = candidates.some((c) => effectiveSelection.has(c.id));

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll(jobId, candidateIds);
    }
  }, [allSelected, deselectAll, selectAll, jobId, candidateIds]);

  const handleRowSelect = useCallback(
    (candidateId: string, shiftKey: boolean) => {
      if (shiftKey && lastClickedRef.current) {
        rangeSelect(jobId, candidateIds, lastClickedRef.current, candidateId);
      } else {
        toggle(jobId, candidateId);
      }
      lastClickedRef.current = candidateId;
    },
    [jobId, candidateIds, rangeSelect, toggle]
  );

  // Toggle inline preview expansion (C-4)
  const handleRowExpand = useCallback(
    (candidateId: string) => {
      setExpandedCandidateId((prev) => (prev === candidateId ? null : candidateId));
    },
    []
  );

  // Bulk status change handler — updates pipelineStatus via the candidate store
  const bulkUpdateStatus = useCandidateStore((s) => s.bulkUpdateStatus);
  const handleBulkStatusChange = useCallback(
    (ids: string[], newStatus: PipelineStatus) => {
      bulkUpdateStatus(jobId, ids, newStatus);
    },
    [jobId, bulkUpdateStatus]
  );

  if (candidates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-text-muted text-sm font-mono">
            No candidates found for this job.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="candidate-ranked-list">
      {/* Table header */}
      <div
        className="flex items-center h-9 px-4 border-b border-border-default bg-surface-primary flex-shrink-0"
        data-testid="candidate-list-header"
      >
        {/* Select all checkbox */}
        <div className="w-8 flex items-center justify-center">
          <button
            onClick={handleSelectAll}
            className="group flex items-center justify-center w-[16px] h-[16px] border border-border-default bg-surface-secondary hover:border-accent-primary transition-colors"
            aria-label={allSelected ? "Deselect all candidates" : "Select all candidates"}
            data-testid="select-all-checkbox"
          >
            {allSelected ? (
              <div className="w-[10px] h-[10px] bg-accent-primary" />
            ) : someSelected ? (
              <div className="w-[10px] h-[2px] bg-accent-primary" />
            ) : null}
          </button>
        </div>
        <div className="w-8 table-header text-center">#</div>
        <div className="flex-1 min-w-[140px] table-header pl-3">Candidate</div>
        <div className="w-[200px] table-header pl-3">AI Score</div>
        <div className="flex-1 min-w-[200px] table-header pl-3">Matched Skills</div>
        <div className="w-[180px] table-header pl-3 hidden xl:block">Sub-Scores</div>
      </div>

      {/* Candidate rows */}
      <div className="flex-1 overflow-y-auto" data-testid="candidate-list-body">
        {candidates.map((candidate, index) => (
          <div key={candidate.id}>
            <CandidateRow
              candidate={candidate}
              rank={index + 1}
              jobId={jobId}
              isOdd={index % 2 === 1}
              isSelected={effectiveSelection.has(candidate.id)}
              isExpanded={expandedCandidateId === candidate.id}
              onSelect={handleRowSelect}
              onExpand={handleRowExpand}
            />
            {expandedCandidateId === candidate.id && (
              <CandidateInlinePreview candidate={candidate} jobId={jobId} />
            )}
          </div>
        ))}
      </div>

      {/* Bulk action toolbar (C-3) */}
      <BulkActionToolbar
        jobId={jobId}
        candidates={candidates}
        onStatusChange={handleBulkStatusChange}
      />
    </div>
  );
}

// ── Candidate Row ────────────────────────────────────────────────────────────

interface CandidateRowProps {
  candidate: Candidate;
  rank: number;
  jobId: string;
  isOdd: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (candidateId: string, shiftKey: boolean) => void;
  onExpand: (candidateId: string) => void;
}

function CandidateRow({
  candidate,
  rank,
  jobId,
  isOdd,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
}: CandidateRowProps) {
  const topSkills = candidate.skills.slice(0, 3);
  const scoreColor = getScoreColor(candidate.matchScore);
  const scoreTextClass = getScoreTextClass(candidate.matchScore);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(candidate.id, e.shiftKey);
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't expand if user is clicking a link or button inside the row
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    onExpand(candidate.id);
  };

  return (
    <div
      className={`flex items-center h-[42px] border-b border-border-default transition-colors cursor-pointer ${
        isExpanded
          ? "bg-surface-tertiary/60 border-b-0"
          : isSelected
          ? "bg-accent-primary/8 border-l-2 border-l-accent-primary"
          : isOdd
          ? "bg-surface-tertiary/30 hover:bg-surface-tertiary/50"
          : "bg-transparent hover:bg-surface-tertiary/30"
      }`}
      data-testid={`candidate-row-${candidate.id}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand(candidate.id);
        }
      }}
    >
      {/* Checkbox */}
      <div className="w-8 flex items-center justify-center px-4">
        <button
          onClick={handleCheckboxClick}
          className={`flex items-center justify-center w-[16px] h-[16px] border transition-colors flex-shrink-0 ${
            isSelected
              ? "border-accent-primary bg-accent-primary"
              : "border-border-default bg-surface-secondary hover:border-accent-primary"
          }`}
          aria-label={`Select ${candidate.name}`}
          data-testid={`select-checkbox-${candidate.id}`}
        >
          {isSelected && (
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              className="text-surface-primary"
            >
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Row content — click expands inline preview (C-4) */}
      <div className="flex items-center flex-1 h-full">
        {/* Rank */}
        <div className="w-8 text-center font-mono text-xs text-text-muted">
          {rank}
        </div>

        {/* Name + pipeline status + expand indicator */}
        <div className="flex-1 min-w-[140px] pl-3 flex items-center gap-2 overflow-hidden">
          <span
            className={`inline-flex items-center justify-center w-4 h-4 text-[10px] text-text-muted transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            &#9656;
          </span>
          <span className="text-sm text-text-primary font-medium truncate">
            {candidate.name}
          </span>
          {candidate.pipelineStatus && candidate.pipelineStatus !== "New" && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-medium uppercase tracking-wider flex-shrink-0 ${getStatusBadgeClass(candidate.pipelineStatus)}`}
              data-testid={`status-badge-${candidate.id}`}
            >
              {candidate.pipelineStatus}
            </span>
          )}
        </div>

        {/* AI Score: number + bar */}
        <div className="w-[200px] pl-3 flex items-center gap-3">
          <span
            className={`font-heading font-bold font-700 text-lg leading-none min-w-[36px] ${scoreTextClass}`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {candidate.matchScore}
          </span>
          <div className="flex-1 h-[6px] bg-surface-tertiary">
            <div
              className="h-full"
              style={{
                width: `${candidate.matchScore}%`,
                backgroundColor: scoreColor,
              }}
              data-testid={`score-bar-${candidate.id}`}
            />
          </div>
        </div>

        {/* Skill tags (top 3) */}
        <div className="flex-1 min-w-[200px] pl-3 flex items-center gap-1.5 overflow-hidden">
          {topSkills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium leading-tight text-accent-primary border border-accent-primary/40 bg-accent-primary/8 whitespace-nowrap flex-shrink-0"
              data-testid={`skill-chip-${skill.toLowerCase().replace(/[\s/()]+/g, "-")}`}
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Sub-scores (visible on xl+) */}
        <div className="w-[180px] pl-3 hidden xl:flex items-center gap-2">
          <SubScoreChip label="TEC" value={candidate.subScores.technicalFit} />
          <SubScoreChip label="CUL" value={candidate.subScores.cultureFit} />
          <SubScoreChip label="EXP" value={candidate.subScores.experienceDepth} />
        </div>
      </div>
    </div>
  );
}

// ── Sub-Score Chip ───────────────────────────────────────────────────────────

function SubScoreChip({ label, value }: { label: string; value: number }) {
  const scoreTextClass = getScoreTextClass(value);

  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-text-muted uppercase tracking-wider">
        {label}
      </span>
      <span className={`font-mono text-[11px] font-medium ${scoreTextClass}`}>
        {value}
      </span>
    </div>
  );
}
