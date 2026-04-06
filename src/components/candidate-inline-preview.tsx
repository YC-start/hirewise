"use client";

import Link from "next/link";
import {
  ArrowSquareOut,
  ChartBar,
  Lightning,
  Warning,
  Star,
  Briefcase,
  GraduationCap,
} from "@phosphor-icons/react";
import type { Candidate } from "@/data/mock-candidates";

/**
 * CandidateInlinePreview — Expandable preview panel shown below a candidate row (C-4).
 *
 * Shows:
 * - Dimension score breakdown (horizontal mini-bars)
 * - All skills (not just top 3)
 * - AI evaluation summary (reasoning)
 * - Strengths + skill gaps
 * - Latest experience entry
 * - "View Full Profile" navigation link
 *
 * Design follows Industrial Clarity:
 * - surface-secondary background with left accent border
 * - Dense layout, monospace scoring, flat bars
 * - No border-radius, no decorative whitespace
 */

interface CandidateInlinePreviewProps {
  candidate: Candidate;
  jobId: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--score-gradient-high)";
  if (score >= 50) return "var(--score-gradient-mid)";
  return "var(--score-gradient-low)";
}

function getScoreTextClass(score: number): string {
  if (score >= 80) return "text-score-high";
  if (score >= 50) return "text-score-mid";
  return "text-score-low";
}

export function CandidateInlinePreview({
  candidate,
  jobId,
}: CandidateInlinePreviewProps) {
  const evaluation = candidate.aiEvaluation;
  const latestExperience = candidate.experience?.[0];

  return (
    <div
      className="border-b border-border-default border-l-4 border-l-accent-secondary bg-surface-secondary"
      data-testid={`candidate-preview-${candidate.id}`}
    >
      <div className="px-5 py-4">
        {/* Top section: dimension scores + skills */}
        <div className="flex gap-6">
          {/* Left column: Score breakdown */}
          <div className="w-[280px] flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-3">
              <ChartBar size={13} weight="bold" className="text-text-secondary" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Score Breakdown
              </span>
            </div>

            {/* Overall score */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`font-heading font-bold text-2xl leading-none ${getScoreTextClass(candidate.matchScore)}`}
                style={{ fontVariantNumeric: "tabular-nums" }}
                data-testid={`preview-overall-score-${candidate.id}`}
              >
                {candidate.matchScore}
              </span>
              <div className="flex-1 h-[5px] bg-surface-tertiary">
                <div
                  className="h-full"
                  style={{
                    width: `${candidate.matchScore}%`,
                    backgroundColor: getScoreColor(candidate.matchScore),
                  }}
                />
              </div>
            </div>

            {/* Dimension scores */}
            <div className="space-y-2" data-testid={`preview-dimensions-${candidate.id}`}>
              <DimensionBar label="Technical Fit" value={candidate.subScores.technicalFit} />
              <DimensionBar label="Culture Fit" value={candidate.subScores.cultureFit} />
              <DimensionBar label="Experience" value={candidate.subScores.experienceDepth} />
              {evaluation?.dimensionScores
                ?.filter(
                  (d) =>
                    !["Technical Fit", "Culture Fit", "Experience Depth"].includes(d.dimension)
                )
                .map((d) => (
                  <DimensionBar key={d.dimension} label={d.dimension} value={d.score} />
                ))}
            </div>
          </div>

          {/* Right column: Skills, summary, experience */}
          <div className="flex-1 min-w-0">
            {/* All skills */}
            <div className="mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1.5">
                Skills
              </span>
              <div className="flex flex-wrap gap-1" data-testid={`preview-skills-${candidate.id}`}>
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium leading-tight text-accent-primary border border-accent-primary/30 bg-accent-primary/6"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            {evaluation?.overallReasoning && (
              <div className="mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                  AI Summary
                </span>
                <p
                  className="text-xs text-text-secondary leading-relaxed line-clamp-3"
                  data-testid={`preview-summary-${candidate.id}`}
                >
                  {evaluation.overallReasoning}
                </p>
              </div>
            )}

            {/* Strengths + Gaps in a two-column layout */}
            <div className="flex gap-4 mb-3">
              {/* Strengths */}
              {evaluation?.strengths && evaluation.strengths.length > 0 && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Star size={11} weight="bold" className="text-accent-secondary" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                      Strengths
                    </span>
                  </div>
                  <div className="space-y-0.5" data-testid={`preview-strengths-${candidate.id}`}>
                    {evaluation.strengths.slice(0, 3).map((s) => (
                      <div
                        key={s}
                        className="text-[11px] text-text-secondary leading-tight flex items-start gap-1"
                      >
                        <span className="text-accent-secondary mt-0.5 flex-shrink-0">+</span>
                        <span className="truncate">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill gaps */}
              {evaluation?.skillGaps && evaluation.skillGaps.length > 0 && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <Warning size={11} weight="bold" className="text-signal-warning" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                      Gaps
                    </span>
                  </div>
                  <div className="space-y-0.5" data-testid={`preview-gaps-${candidate.id}`}>
                    {evaluation.skillGaps.slice(0, 3).map((g) => (
                      <div
                        key={g}
                        className="text-[11px] text-text-secondary leading-tight flex items-start gap-1"
                      >
                        <span className="text-signal-warning mt-0.5 flex-shrink-0">-</span>
                        <span className="truncate">{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Latest experience */}
            {latestExperience && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <Briefcase size={11} weight="bold" className="text-text-secondary" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    Current Role
                  </span>
                </div>
                <div className="text-xs text-text-primary">
                  <span className="font-medium">{latestExperience.role}</span>
                  <span className="text-text-muted mx-1">at</span>
                  <span className="text-text-secondary">{latestExperience.company}</span>
                  <span className="text-text-muted ml-1.5 font-mono text-[10px]">
                    {latestExperience.period}
                  </span>
                </div>
              </div>
            )}

            {/* Education (if present) */}
            {candidate.education && candidate.education.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <GraduationCap size={11} weight="bold" className="text-text-secondary" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    Education
                  </span>
                </div>
                <div className="text-xs text-text-primary">
                  <span className="font-medium">{candidate.education[0].degree}</span>
                  <span className="text-text-muted mx-1">&mdash;</span>
                  <span className="text-text-secondary">{candidate.education[0].institution}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer: View Full Profile link */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-default">
          <div className="flex items-center gap-2">
            <Lightning size={12} weight="bold" className="text-accent-primary" />
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Inline Preview
            </span>
          </div>
          <Link
            href={`/job/${jobId}/candidate/${candidate.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-accent-primary text-surface-primary hover:bg-accent-primary/90 transition-colors"
            data-testid={`view-full-profile-${candidate.id}`}
          >
            View Full Profile
            <ArrowSquareOut size={12} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Dimension Score Bar ──────────────────────────────────────────────────────

function DimensionBar({ label, value }: { label: string; value: number }) {
  const scoreColor = getScoreColor(value);
  const scoreTextClass = getScoreTextClass(value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted w-[90px] truncate">{label}</span>
      <div className="flex-1 h-[4px] bg-surface-tertiary">
        <div
          className="h-full"
          style={{
            width: `${value}%`,
            backgroundColor: scoreColor,
          }}
        />
      </div>
      <span
        className={`font-mono text-[11px] font-medium min-w-[24px] text-right ${scoreTextClass}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </span>
    </div>
  );
}
