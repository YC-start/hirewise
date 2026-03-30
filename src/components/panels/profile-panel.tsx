"use client";

import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useDataPanelStore } from "@/stores/data-panel-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useCandidateStore } from "@/stores/candidate-store";
import { getCandidateById } from "@/data/mock-candidates";
import type { Candidate, PipelineStatus, AIEvaluation, DimensionScore } from "@/data/mock-candidates";

const EMPTY_CANDIDATES: Candidate[] = [];

/**
 * ProfilePanelContent — Candidate profile detail embedded in right sidebar.
 *
 * Compact version of CandidateProfile for the sidebar width.
 * Shows: name, score, status, action buttons, AI evaluation, timeline.
 */

/** Returns the CSS color for a score based on range. */
function getScoreColor(score: number): string {
  if (score >= 80) return "var(--score-gradient-high)";
  if (score >= 50) return "var(--score-gradient-mid)";
  return "var(--score-gradient-low)";
}

/** Returns Tailwind text color class for a score. */
function getScoreTextClass(score: number): string {
  if (score >= 80) return "text-score-high";
  if (score >= 50) return "text-score-mid";
  return "text-score-low";
}

/** Returns a style string for pipeline status badges. */
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

interface ActionButtonConfig {
  label: string;
  shortLabel: string;
  targetStatus: PipelineStatus;
  variant: "schedule-interview" | "reject" | "extend-offer" | "hire" | "archive";
}

const ACTION_BUTTONS: ActionButtonConfig[] = [
  { label: "Interview", shortLabel: "Int", targetStatus: "Interview", variant: "schedule-interview" },
  { label: "Reject", shortLabel: "Rej", targetStatus: "Rejected", variant: "reject" },
  { label: "Offer", shortLabel: "Off", targetStatus: "Offer", variant: "extend-offer" },
  { label: "Hire", shortLabel: "Hire", targetStatus: "Hired", variant: "hire" },
  { label: "Archive", shortLabel: "Arc", targetStatus: "Archived", variant: "archive" },
];

function getActionButtonClasses(variant: ActionButtonConfig["variant"], isDisabled: boolean): string {
  const base = "px-2 py-1 text-[10px] font-500 font-mono transition-all duration-150";

  if (isDisabled) {
    return `${base} rounded-full opacity-40 cursor-not-allowed bg-surface-tertiary text-text-muted`;
  }

  switch (variant) {
    case "schedule-interview":
      return `${base} rounded-full bg-accent-secondary text-surface-primary hover:brightness-110`;
    case "reject":
      return `${base} rounded-full bg-signal-danger text-white hover:brightness-110`;
    case "extend-offer":
      return `${base} rounded-full bg-accent-primary text-surface-primary hover:brightness-110`;
    case "hire":
      return `${base} rounded-full bg-accent-primary text-surface-primary hover:brightness-110`;
    case "archive":
      return `${base} bg-transparent border border-border-default text-text-secondary hover:text-text-primary`;
    default:
      return base;
  }
}

export function ProfilePanelContent() {
  const { selectedJobId, selectedCandidateId, backToPipeline, backToJobs } =
    useDataPanelStore();

  if (!selectedJobId || !selectedCandidateId) {
    return (
      <div className="flex-1 flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-text-muted text-sm font-mono mb-2">
            No candidate selected
          </p>
          <button
            onClick={backToJobs}
            className="text-accent-primary text-xs font-mono hover:underline"
          >
            Select a candidate from Pipeline
          </button>
        </div>
      </div>
    );
  }

  // Check candidate store (API results) first, then fall back to mock data
  const apiCandidates = useCandidateStore((s) => s.candidatesByJob[selectedJobId] ?? EMPTY_CANDIDATES);
  const candidate = apiCandidates.find((c) => c.id === selectedCandidateId)
    || getCandidateById(selectedJobId, selectedCandidateId);
  const dashboardJobs = useDashboardStore((s) => s.jobs);
  const job = dashboardJobs.find((j) => j.id === selectedJobId);

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <p className="text-text-muted text-sm font-mono">Candidate not found</p>
      </div>
    );
  }

  return (
    <ProfileContent
      candidate={candidate}
      jobTitle={job?.title || "Unknown"}
      onBack={backToPipeline}
    />
  );
}

function ProfileContent({
  candidate,
  jobTitle,
  onBack,
}: {
  candidate: {
    id: string;
    name: string;
    matchScore: number;
    skills: string[];
    subScores: { technicalFit: number; cultureFit: number; experienceDepth: number };
    pipelineStatus?: PipelineStatus;
    aiEvaluation?: AIEvaluation;
    experience?: { company: string; role: string; period: string; description: string }[];
    education?: { institution: string; degree: string; year: string }[];
    certifications?: string[];
  };
  jobTitle: string;
  onBack: () => void;
}) {
  const scoreColor = getScoreColor(candidate.matchScore);
  const scoreTextClass = getScoreTextClass(candidate.matchScore);
  const [currentStatus, setCurrentStatus] = useState<PipelineStatus>(
    candidate.pipelineStatus || "New"
  );

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      data-testid="profile-panel"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 h-10 px-3 border-b border-border-default">
        <button
          onClick={onBack}
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Back to Pipeline"
          data-testid="back-to-pipeline"
        >
          <ArrowLeft size={14} weight="bold" />
        </button>
        <span className="text-text-muted text-[11px] font-mono truncate">
          {jobTitle}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Name + Score */}
        <div className="flex items-start justify-between gap-2 mb-2" data-testid="candidate-header">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base font-700 text-text-primary leading-tight">
              {candidate.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-500 uppercase tracking-wider ${getStatusBadgeClass(currentStatus)}`}
                data-testid="pipeline-status-badge"
              >
                {currentStatus}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right" data-testid="candidate-score">
            <span className="table-header text-[9px]">Score</span>
            <span
              className={`block font-heading font-700 text-[24px] leading-none ${scoreTextClass}`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {candidate.matchScore}
            </span>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-[6px] bg-surface-tertiary w-full mb-2" data-testid="score-bar">
          <div
            className="h-full"
            style={{
              width: `${candidate.matchScore}%`,
              backgroundColor: scoreColor,
            }}
          />
        </div>

        {/* Sub-scores */}
        <div className="flex items-center gap-3 mb-3">
          <SubScore label="TEC" value={candidate.subScores.technicalFit} />
          <SubScore label="CUL" value={candidate.subScores.cultureFit} />
          <SubScore label="EXP" value={candidate.subScores.experienceDepth} />
        </div>

        {/* Action buttons */}
        <div
          className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-border-default"
          data-testid="action-buttons-bar"
        >
          {ACTION_BUTTONS.map((btn) => {
            const disabled = currentStatus === btn.targetStatus;
            return (
              <button
                key={btn.variant}
                type="button"
                disabled={disabled}
                onClick={() => setCurrentStatus(btn.targetStatus)}
                className={getActionButtonClasses(btn.variant, disabled)}
                data-testid={`action-btn-${btn.variant}`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-500 text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* AI Evaluation (compact) */}
        {candidate.aiEvaluation && (
          <CompactEvaluation evaluation={candidate.aiEvaluation} />
        )}

        {/* Experience timeline (compact) */}
        {candidate.experience && candidate.experience.length > 0 && (
          <section className="mb-3">
            <h4 className="table-header text-[9px] mb-2 pb-1 border-b border-border-default">
              Experience
            </h4>
            <div className="flex flex-col gap-2">
              {candidate.experience.map((exp, idx) => (
                <div key={`${exp.company}-${idx}`} className="bg-surface-tertiary/50 border border-border-default p-2">
                  <div className="flex justify-between gap-1">
                    <span className="text-xs text-text-primary font-500 truncate">
                      {exp.role}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted flex-shrink-0">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5">{exp.company}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education (compact) */}
        {candidate.education && candidate.education.length > 0 && (
          <section className="mb-3">
            <h4 className="table-header text-[9px] mb-2 pb-1 border-b border-border-default">
              Education
            </h4>
            <div className="flex flex-col gap-1.5">
              {candidate.education.map((edu, idx) => (
                <div key={`${edu.institution}-${idx}`} className="flex justify-between gap-1">
                  <div className="min-w-0">
                    <span className="text-xs text-text-primary font-500 block truncate">
                      {edu.degree}
                    </span>
                    <span className="text-[11px] text-text-secondary block truncate">
                      {edu.institution}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-text-muted flex-shrink-0">
                    {edu.year}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Sub Score ───────────────────────────────────────────────────────────

function SubScore({ label, value }: { label: string; value: number }) {
  const textClass = getScoreTextClass(value);
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-[11px] font-500 ${textClass}`}>{value}</span>
    </div>
  );
}

// ── Compact AI Evaluation ──────────────────────────────────────────────

function CompactEvaluation({ evaluation }: { evaluation: AIEvaluation }) {
  return (
    <section className="mb-3">
      <h4 className="table-header text-[9px] mb-2 pb-1 border-b border-border-default">
        AI Evaluation
      </h4>
      <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
        {evaluation.overallReasoning}
      </p>

      {/* Dimension bars */}
      <div className="flex flex-col gap-1.5 mb-2">
        {evaluation.dimensionScores.map((dim: DimensionScore) => (
          <CompactDimensionBar key={dim.dimension} dimension={dim} />
        ))}
      </div>

      {/* Strengths + Gaps */}
      <div className="flex flex-wrap gap-1 mb-1">
        {evaluation.strengths.slice(0, 3).map((s: string) => (
          <span
            key={s}
            className="px-1.5 py-0.5 text-[9px] font-mono text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {evaluation.skillGaps.slice(0, 3).map((g: string) => (
          <span
            key={g}
            className="px-1.5 py-0.5 text-[9px] font-mono text-signal-danger border border-signal-danger/40 bg-signal-danger/8"
          >
            {g}
          </span>
        ))}
      </div>
    </section>
  );
}

function CompactDimensionBar({ dimension }: { dimension: DimensionScore }) {
  const barColor = getScoreColor(dimension.score);
  const textClass = getScoreTextClass(dimension.score);

  return (
    <div className="flex items-center gap-2">
      <span className="w-[80px] flex-shrink-0 text-[10px] text-text-secondary truncate">
        {dimension.dimension}
      </span>
      <span className={`w-[20px] font-mono text-[10px] font-500 text-right ${textClass}`}>
        {dimension.score}
      </span>
      <div className="flex-1 h-[4px] bg-surface-tertiary">
        <div
          className="h-full"
          style={{
            width: `${dimension.score}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
