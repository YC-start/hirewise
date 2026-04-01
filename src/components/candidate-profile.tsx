"use client";

import { useState } from "react";
import Link from "next/link";
import type { Candidate, Experience, Education, AIEvaluation, DimensionScore, PipelineStatus } from "@/data/mock-candidates";

/**
 * CandidateProfile — Candidate detail page content (D-1, D-2, D-4).
 *
 * Displays:
 * - Header: candidate name, match score (large + color-coded bar), pipeline status
 * - Action bar: pipeline stage transition buttons (D-4)
 * - AI Evaluation Report (D-2)
 * - Structured timeline: work experience in reverse chronological order
 * - Education section
 * - Certifications section (if present)
 *
 * Design: "Industrial Clarity" — dark theme, timeline with square nodes,
 * JetBrains Mono for time periods, table-header section labels.
 */

interface CandidateProfileProps {
  candidate: Candidate;
  jobId: string;
  jobTitle: string;
}

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

/**
 * Maps action buttons to the target pipeline status they set.
 * Each button has a label, target status, and style configuration.
 */
interface ActionButtonConfig {
  label: string;
  targetStatus: PipelineStatus;
  variant: "schedule-interview" | "reject" | "extend-offer" | "hire" | "archive";
}

const ACTION_BUTTONS: ActionButtonConfig[] = [
  { label: "Schedule Interview", targetStatus: "Interview", variant: "schedule-interview" },
  { label: "Reject", targetStatus: "Rejected", variant: "reject" },
  { label: "Extend Offer", targetStatus: "Offer", variant: "extend-offer" },
  { label: "Hire", targetStatus: "Hired", variant: "hire" },
  { label: "Archive", targetStatus: "Archived", variant: "archive" },
];

/** Returns Tailwind classes for each action button variant. */
function getActionButtonClasses(variant: ActionButtonConfig["variant"], isDisabled: boolean): string {
  const base = "px-4 py-1.5 text-[13px] font-medium font-mono transition-all duration-150";

  if (isDisabled) {
    return `${base} rounded-full opacity-40 cursor-not-allowed bg-surface-tertiary text-text-muted`;
  }

  switch (variant) {
    case "schedule-interview":
      // accent-secondary (#00D4AA) bg, dark text, pill-shaped
      return `${base} rounded-full bg-accent-secondary text-surface-primary hover:brightness-110 active:brightness-90`;
    case "reject":
      // signal-danger (#FF4444) bg, white text, pill-shaped
      return `${base} rounded-full bg-signal-danger text-white hover:brightness-110 active:brightness-90`;
    case "extend-offer":
      // accent-primary (#D4FF00) bg, dark text, pill-shaped
      return `${base} rounded-full bg-accent-primary text-surface-primary hover:brightness-110 active:brightness-90`;
    case "hire":
      // accent-primary (#D4FF00) bg, dark text, pill-shaped
      return `${base} rounded-full bg-accent-primary text-surface-primary hover:brightness-110 active:brightness-90`;
    case "archive":
      // ghost button: transparent bg, border-default border, rectangular
      return `${base} bg-transparent border border-border-default text-text-secondary hover:text-text-primary hover:border-text-secondary`;
    default:
      return base;
  }
}

export function CandidateProfile({ candidate, jobId, jobTitle }: CandidateProfileProps) {
  const scoreColor = getScoreColor(candidate.matchScore);
  const scoreTextClass = getScoreTextClass(candidate.matchScore);
  const initialStatus: PipelineStatus = candidate.pipelineStatus || "New";
  const [currentStatus, setCurrentStatus] = useState<PipelineStatus>(initialStatus);

  /** Determines if an action button should be disabled based on current status. */
  function isButtonDisabled(targetStatus: PipelineStatus): boolean {
    // If already at the target status, disable the button
    if (currentStatus === targetStatus) return true;
    // Map: which statuses correspond to which button being "already active"
    // "Schedule Interview" -> disabled when status is "Interview"
    // "Reject" -> disabled when status is "Rejected"
    // etc. — this is already handled by direct comparison above.
    return false;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="candidate-profile">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center h-12 px-4 border-b border-border-default bg-surface-primary">
        <Link
          href={`/job/${jobId}/pipeline`}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm font-mono transition-colors"
          data-testid="back-to-pipeline"
        >
          <span>&larr;</span>
          <span>Back to Pipeline</span>
        </Link>
        <span className="ml-3 text-text-muted text-xs font-mono">
          / {jobTitle}
        </span>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-4 py-6">

          {/* ── Candidate Header ───────────────────────────────────── */}
          <section className="mb-8" data-testid="candidate-header">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <h1 className="font-heading font-bold text-[28px] text-text-primary leading-tight mb-2">
                  {candidate.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wider ${getStatusBadgeClass(currentStatus)}`}
                    data-testid="pipeline-status-badge"
                  >
                    {currentStatus}
                  </span>
                  <span className="text-text-muted text-xs font-mono">
                    ID: {candidate.id}
                  </span>
                </div>
              </div>

              {/* Score display */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1" data-testid="candidate-score">
                <span className="table-header">AI Match Score</span>
                <span
                  className={`text-score-lg leading-none ${scoreTextClass}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {candidate.matchScore}
                </span>
              </div>
            </div>

            {/* ── Action Buttons Bar (D-4) ─────────────────────────── */}
            <div
              className="mt-4 flex flex-wrap items-center gap-2"
              data-testid="action-buttons-bar"
            >
              {ACTION_BUTTONS.map((btn) => {
                const disabled = isButtonDisabled(btn.targetStatus);
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

            {/* Score bar */}
            <div className="mt-4 h-[8px] bg-surface-tertiary w-full" data-testid="score-bar">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${candidate.matchScore}%`,
                  backgroundColor: scoreColor,
                }}
              />
            </div>

            {/* Sub-scores row */}
            <div className="mt-3 flex items-center gap-6">
              <SubScoreDisplay label="Technical Fit" value={candidate.subScores.technicalFit} />
              <SubScoreDisplay label="Culture Fit" value={candidate.subScores.cultureFit} />
              <SubScoreDisplay label="Experience Depth" value={candidate.subScores.experienceDepth} />
            </div>

            {/* Skill tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium leading-tight text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* ── AI Evaluation Report ────────────────────────────── */}
          {candidate.aiEvaluation && (
            <AIEvaluationReport
              evaluation={candidate.aiEvaluation}
              overallScore={candidate.matchScore}
            />
          )}

          {/* ── Resume: Work Experience Timeline ────────────────── */}
          {candidate.experience && candidate.experience.length > 0 && (
            <section className="mb-8" data-testid="experience-section">
              <h2 className="table-header mb-4 pb-2 border-b border-border-default">
                Work Experience
              </h2>
              <div className="relative">
                {/* Timeline vertical line */}
                <div
                  className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-border-default"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0">
                  {candidate.experience.map((exp, index) => (
                    <TimelineEntry
                      key={`${exp.company}-${index}`}
                      experience={exp}
                      isLast={index === (candidate.experience?.length ?? 0) - 1}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Education ──────────────────────────────────────────── */}
          {candidate.education && candidate.education.length > 0 && (
            <section className="mb-8" data-testid="education-section">
              <h2 className="table-header mb-4 pb-2 border-b border-border-default">
                Education
              </h2>
              <div className="relative">
                {/* Timeline vertical line */}
                <div
                  className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-border-default"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0">
                  {candidate.education.map((edu, index) => (
                    <EducationEntry
                      key={`${edu.institution}-${index}`}
                      education={edu}
                      isLast={index === (candidate.education?.length ?? 0) - 1}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Certifications ─────────────────────────────────────── */}
          {candidate.certifications && candidate.certifications.length > 0 && (
            <section className="mb-8" data-testid="certifications-section">
              <h2 className="table-header mb-4 pb-2 border-b border-border-default">
                Certifications
              </h2>
              <div className="relative">
                {/* Timeline vertical line */}
                <div
                  className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-border-default"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0">
                  {candidate.certifications.map((cert, index) => (
                    <CertificationEntry
                      key={cert}
                      certification={cert}
                      isLast={index === (candidate.certifications?.length ?? 0) - 1}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Fallback when no resume data */}
          {!candidate.experience && !candidate.education && (
            <div className="flex items-center justify-center py-16" data-testid="no-resume-fallback">
              <p className="text-text-muted text-sm font-mono">
                No structured resume data available for this candidate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-Score Display ──────────────────────────────────────────────────────

function SubScoreDisplay({ label, value }: { label: string; value: number }) {
  const textClass = getScoreTextClass(value);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-medium ${textClass}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Timeline Entry (Work Experience) ───────────────────────────────────────

function TimelineEntry({
  experience,
  isLast,
}: {
  experience: Experience;
  isLast: boolean;
}) {
  return (
    <div
      className={`relative pl-8 ${isLast ? "pb-0" : "pb-6"}`}
      data-testid={`experience-entry-${experience.company.toLowerCase().replace(/[\s/()]+/g, "-")}`}
    >
      {/* Square node on timeline */}
      <div
        className="absolute left-[3px] top-[6px] w-[9px] h-[9px] bg-accent-primary"
        aria-hidden="true"
      />

      {/* Content card */}
      <div className="bg-surface-secondary border border-border-default p-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-text-primary leading-tight">
              {experience.role}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {experience.company}
            </p>
          </div>
          <span className="font-mono text-[12px] text-text-muted whitespace-nowrap flex-shrink-0">
            {experience.period}
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {experience.description}
        </p>
      </div>
    </div>
  );
}

// ── Education Entry ────────────────────────────────────────────────────────

function EducationEntry({
  education,
  isLast,
}: {
  education: Education;
  isLast: boolean;
}) {
  return (
    <div
      className={`relative pl-8 ${isLast ? "pb-0" : "pb-6"}`}
      data-testid={`education-entry-${education.institution.toLowerCase().replace(/[\s/()]+/g, "-")}`}
    >
      {/* Square node on timeline */}
      <div
        className="absolute left-[3px] top-[6px] w-[9px] h-[9px] bg-accent-secondary"
        aria-hidden="true"
      />

      {/* Content card */}
      <div className="bg-surface-secondary border border-border-default p-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-text-primary leading-tight">
              {education.degree}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {education.institution}
            </p>
          </div>
          <span className="font-mono text-[12px] text-text-muted whitespace-nowrap flex-shrink-0">
            {education.year}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Certification Entry ────────────────────────────────────────────────────

function CertificationEntry({
  certification,
  isLast,
}: {
  certification: string;
  isLast: boolean;
}) {
  return (
    <div
      className={`relative pl-8 ${isLast ? "pb-0" : "pb-4"}`}
      data-testid={`certification-entry`}
    >
      {/* Square node on timeline */}
      <div
        className="absolute left-[3px] top-[6px] w-[9px] h-[9px] bg-signal-warning"
        aria-hidden="true"
      />

      {/* Content card */}
      <div className="bg-surface-secondary border border-border-default p-3">
        <p className="text-sm font-medium text-text-primary leading-tight">
          {certification}
        </p>
      </div>
    </div>
  );
}

// ── AI Evaluation Report ──────────────────────────────────────────────────

function AIEvaluationReport({
  evaluation,
  overallScore,
}: {
  evaluation: AIEvaluation;
  overallScore: number;
}) {
  return (
    <section className="mb-8" data-testid="ai-evaluation-section">
      {/* Section header — table-header style */}
      <h2 className="table-header mb-4 pb-2 border-b border-border-default">
        AI Evaluation Report
      </h2>

      {/* Overall Score + Reasoning */}
      <div
        className="bg-surface-secondary border border-border-default p-4 mb-4"
        data-testid="ai-overall-reasoning"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="table-header text-[10px]">Overall Assessment</span>
          <span
            className={`font-heading font-bold text-[24px] leading-none ${getScoreTextClass(overallScore)}`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {overallScore}
          </span>
          <span className="text-text-muted text-xs font-mono">/ 100</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
          {evaluation.overallReasoning}
        </p>
      </div>

      {/* Dimension Score Bars */}
      <div className="mb-4" data-testid="ai-dimension-scores">
        <h3 className="table-header mb-3 text-[10px]">Dimension Scores</h3>
        <div className="flex flex-col gap-3">
          {evaluation.dimensionScores.map((dim) => (
            <DimensionScoreBar key={dim.dimension} dimension={dim} />
          ))}
        </div>
      </div>

      {/* Dimension Reasoning Details */}
      <div className="mb-4" data-testid="ai-dimension-reasoning">
        <h3 className="table-header mb-3 text-[10px]">Detailed Analysis</h3>
        <div className="flex flex-col gap-2">
          {evaluation.dimensionScores.map((dim) => (
            <div
              key={dim.dimension}
              className="bg-surface-secondary border border-border-default p-3"
              data-testid={`reasoning-${dim.dimension.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium font-500 text-text-primary">{dim.dimension}</span>
                <span
                  className={`font-mono text-xs font-medium ${getScoreTextClass(dim.score)}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {dim.score}
                </span>
              </div>
              <p className="text-text-secondary leading-relaxed" style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
                {dim.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths + Skill Gaps side by side on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div data-testid="ai-strengths">
          <h3 className="table-header mb-3 text-[10px]">Strengths</h3>
          <div className="flex flex-wrap gap-1.5">
            {evaluation.strengths.map((strength) => (
              <span
                key={strength}
                className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-medium leading-tight text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div data-testid="ai-skill-gaps">
          <h3 className="table-header mb-3 text-[10px]">Skill Gaps</h3>
          <div className="flex flex-wrap gap-1.5">
            {evaluation.skillGaps.map((gap) => (
              <span
                key={gap}
                className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-medium leading-tight text-signal-danger border border-signal-danger/40 bg-signal-danger/8"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Dimension Score Bar ───────────────────────────────────────────────────

function DimensionScoreBar({ dimension }: { dimension: DimensionScore }) {
  const barColor = getScoreColor(dimension.score);
  const textClass = getScoreTextClass(dimension.score);

  return (
    <div className="flex items-center gap-3" data-testid={`dimension-bar-${dimension.dimension.toLowerCase().replace(/\s+/g, "-")}`}>
      {/* Label — fixed width for alignment */}
      <span className="w-[140px] flex-shrink-0 text-xs text-text-secondary font-medium truncate">
        {dimension.dimension}
      </span>

      {/* Score value */}
      <span
        className={`w-[32px] flex-shrink-0 font-mono text-sm font-medium text-right ${textClass}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {dimension.score}
      </span>

      {/* Horizontal bar — flat ends, industrial style */}
      <div className="flex-1 h-[8px] bg-surface-tertiary">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${dimension.score}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
}
