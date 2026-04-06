"use client";

import { useState } from "react";
import {
  ArrowFatRight,
  XCircle,
  DownloadSimple,
  X,
  CheckCircle,
} from "@phosphor-icons/react";
import { useSelectionStore } from "@/stores/selection-store";
import type { Candidate, PipelineStatus } from "@/data/mock-candidates";

/**
 * BulkActionToolbar — Floating toolbar for bulk candidate operations (C-3).
 *
 * Appears when 1+ candidates are selected. Provides:
 * - "Advance to Interview" — sets pipelineStatus to "Interview"
 * - "Reject" — sets pipelineStatus to "Rejected"
 * - "Export to CSV" — downloads CSV with selected candidates' data
 *
 * Design: Industrial Clarity — dark surface, pill CTAs, ghost secondary buttons.
 * Anchored to bottom of candidate list panel.
 */

interface BulkActionToolbarProps {
  jobId: string;
  candidates: Candidate[];
  onStatusChange: (candidateIds: string[], newStatus: PipelineStatus) => void;
}

export function BulkActionToolbar({
  jobId,
  candidates,
  onStatusChange,
}: BulkActionToolbarProps) {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const deselectAll = useSelectionStore((s) => s.deselectAll);
  const count = selectedIds.size;
  const [feedback, setFeedback] = useState<string | null>(null);

  if (count === 0) return null;

  const handleAdvance = () => {
    const ids = Array.from(selectedIds);
    onStatusChange(ids, "Interview");
    setFeedback(`${ids.length} candidate${ids.length > 1 ? "s" : ""} advanced to Interview`);
    setTimeout(() => {
      setFeedback(null);
      deselectAll();
    }, 1800);
  };

  const handleReject = () => {
    const ids = Array.from(selectedIds);
    onStatusChange(ids, "Rejected");
    setFeedback(`${ids.length} candidate${ids.length > 1 ? "s" : ""} rejected`);
    setTimeout(() => {
      setFeedback(null);
      deselectAll();
    }, 1800);
  };

  const handleExportCSV = () => {
    const selected = candidates.filter((c) => selectedIds.has(c.id));
    const header = [
      "Name",
      "Match Score",
      "Technical Fit",
      "Culture Fit",
      "Experience Depth",
      "Skills",
      "Pipeline Status",
      "Current Company",
      "Location",
    ].join(",");

    const rows = selected.map((c) => {
      const fields = [
        `"${c.name}"`,
        c.matchScore,
        c.subScores.technicalFit,
        c.subScores.cultureFit,
        c.subScores.experienceDepth,
        `"${c.skills.join("; ")}"`,
        `"${c.pipelineStatus || "New"}"`,
        `"${c.currentCompany || ""}"`,
        `"${c.location || ""}"`,
      ];
      return fields.join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidates-${jobId}-${Date.now()}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback(`Exported ${selected.length} candidate${selected.length > 1 ? "s" : ""} to CSV`);
    setTimeout(() => setFeedback(null), 2400);
  };

  return (
    <div
      className="flex-shrink-0 border-t border-border-default bg-surface-secondary"
      data-testid="bulk-action-toolbar"
    >
      {/* Feedback toast */}
      {feedback && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 bg-accent-secondary/12 border-b border-accent-secondary/30"
          data-testid="bulk-feedback"
        >
          <CheckCircle
            size={14}
            weight="bold"
            className="text-accent-secondary flex-shrink-0"
          />
          <span className="text-xs font-mono text-accent-secondary">
            {feedback}
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        {/* Left: selection count + dismiss */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent-primary text-surface-primary text-[11px] font-mono font-bold"
            data-testid="selection-count"
          >
            {count}
          </span>
          <span className="text-xs text-text-secondary font-medium whitespace-nowrap">
            selected
          </span>
          <button
            onClick={deselectAll}
            className="p-0.5 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Clear selection"
            data-testid="clear-selection"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-medium text-text-secondary border border-border-default hover:text-text-primary hover:border-text-muted transition-colors"
            data-testid="bulk-export-csv"
          >
            <DownloadSimple size={13} weight="bold" />
            Export CSV
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium bg-signal-danger text-white hover:brightness-110 transition-all"
            data-testid="bulk-reject"
          >
            <XCircle size={13} weight="bold" />
            Reject
          </button>
          <button
            onClick={handleAdvance}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium bg-accent-primary text-surface-primary hover:brightness-110 transition-all"
            data-testid="bulk-advance-interview"
          >
            <ArrowFatRight size={13} weight="bold" />
            Advance to Interview
          </button>
        </div>
      </div>
    </div>
  );
}
