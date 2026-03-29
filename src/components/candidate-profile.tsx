"use client";

import Link from "next/link";
import type { Candidate, Experience, Education } from "@/data/mock-candidates";

/**
 * CandidateProfile — Candidate detail page content (D-1).
 *
 * Displays:
 * - Header: candidate name, match score (large + color-coded bar), pipeline status
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
    default:
      return "bg-text-secondary text-surface-primary";
  }
}

export function CandidateProfile({ candidate, jobId, jobTitle }: CandidateProfileProps) {
  const scoreColor = getScoreColor(candidate.matchScore);
  const scoreTextClass = getScoreTextClass(candidate.matchScore);
  const pipelineStatus = candidate.pipelineStatus || "New";

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
                <h1 className="font-heading font-700 text-[28px] text-text-primary leading-tight mb-2">
                  {candidate.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-500 uppercase tracking-wider ${getStatusBadgeClass(pipelineStatus)}`}
                    data-testid="pipeline-status-badge"
                  >
                    {pipelineStatus}
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
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-500 leading-tight text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

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
      <span className="text-[10px] text-text-muted uppercase tracking-wider font-500">
        {label}
      </span>
      <span
        className={`font-mono text-sm font-500 ${textClass}`}
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
            <h3 className="text-sm font-500 text-text-primary leading-tight">
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
            <h3 className="text-sm font-500 text-text-primary leading-tight">
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
        <p className="text-sm font-500 text-text-primary leading-tight">
          {certification}
        </p>
      </div>
    </div>
  );
}
