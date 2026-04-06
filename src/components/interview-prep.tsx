"use client";

import type { Candidate } from "@/data/mock-candidates";
import type { JobDescription } from "@/data/mock-jobs";
import {
  generateInterviewQuestions,
  groupQuestionsByCategory,
  type QuestionCategory,
} from "@/lib/interview-questions";

/**
 * InterviewPrep (D-3)
 *
 * Renders AI-generated, JD-aware interview questions for a candidate,
 * grouped by category. Reads from the pure engine in
 * src/lib/interview-questions.ts — no side effects, no network calls,
 * fully deterministic.
 *
 * Design language: Industrial Clarity — dark surfaces, square nodes,
 * table-header section labels, monospace numeric chrome, accent-primary
 * for skill tags.
 */

interface InterviewPrepProps {
  candidate: Candidate;
  jd: JobDescription | undefined;
  jobTitle: string;
}

/** Per-category metadata: short label, accent color class, icon glyph. */
const CATEGORY_META: Record<
  QuestionCategory,
  { label: string; accentVar: string; badgeBg: string }
> = {
  "Technical Depth": {
    label: "Technical Depth",
    accentVar: "var(--accent-primary)",
    badgeBg: "bg-accent-primary text-surface-primary",
  },
  "JD Requirements": {
    label: "JD Requirements",
    accentVar: "var(--accent-secondary)",
    badgeBg: "bg-accent-secondary text-surface-primary",
  },
  "Experience Probe": {
    label: "Experience Probe",
    accentVar: "var(--accent-primary)",
    badgeBg: "bg-accent-primary text-surface-primary",
  },
  "Skill Gap": {
    label: "Skill Gap",
    accentVar: "var(--signal-danger)",
    badgeBg: "bg-signal-danger text-white",
  },
  "Culture & Seniority": {
    label: "Culture & Seniority",
    accentVar: "var(--signal-warning)",
    badgeBg: "bg-signal-warning text-surface-primary",
  },
};

export function InterviewPrep({ candidate, jd, jobTitle }: InterviewPrepProps) {
  const questions = generateInterviewQuestions(candidate, jd);
  const groups = groupQuestionsByCategory(questions);
  const totalCount = questions.length;

  return (
    <section className="mb-8" data-testid="interview-prep">
      {/* Section intro */}
      <header className="mb-6" data-testid="interview-prep-header">
        <h2 className="table-header mb-2 pb-2 border-b border-border-default">
          Interview Prep
        </h2>
        <p
          className="text-text-secondary leading-relaxed"
          style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
        >
          {totalCount} tailored questions generated for{" "}
          <span className="text-text-primary font-medium">{candidate.name}</span>
          {" "}against the{" "}
          <span className="text-text-primary font-medium">{jobTitle}</span>
          {" "}role. Each question is grounded in the candidate&apos;s resume,
          the JD requirements, or the AI evaluation report.
        </p>
      </header>

      {/* No-JD fallback */}
      {!jd && (
        <div
          className="bg-surface-secondary border border-border-default p-4 mb-4"
          data-testid="interview-prep-no-jd-warning"
        >
          <p className="text-text-muted text-xs font-mono">
            This role has no structured JD, so questions fall back to
            generic experience and culture probes.
          </p>
        </div>
      )}

      {/* Empty fallback — should be rare because we always emit culture qs */}
      {groups.length === 0 && (
        <div
          className="bg-surface-secondary border border-border-default p-6"
          data-testid="interview-prep-empty"
        >
          <p className="text-text-muted text-sm font-mono">
            Not enough resume data to generate tailored questions.
          </p>
        </div>
      )}

      {/* Question groups */}
      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const meta = CATEGORY_META[group.category];
          const categorySlug = group.category.toLowerCase().replace(/[^a-z]+/g, "-");
          return (
            <div
              key={group.category}
              data-testid={`question-group-${categorySlug}`}
            >
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-[9px] h-[9px] flex-shrink-0"
                  style={{ backgroundColor: meta.accentVar }}
                  aria-hidden="true"
                />
                <h3 className="table-header text-[11px]">{meta.label}</h3>
                <span
                  className="font-mono text-[11px] text-text-muted"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {group.questions.length.toString().padStart(2, "0")}
                </span>
              </div>

              {/* Questions list */}
              <ol className="flex flex-col gap-3">
                {group.questions.map((q, idx) => (
                  <li
                    key={q.id}
                    className="bg-surface-secondary border border-border-default p-4 flex gap-3"
                    data-testid={`interview-question-${q.id}`}
                  >
                    {/* Numeric index */}
                    <span
                      className="font-mono text-[11px] text-text-muted flex-shrink-0 pt-[2px] w-6"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                      aria-hidden="true"
                    >
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Question text */}
                      <p
                        className="text-text-primary leading-relaxed mb-2"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                        }}
                        data-testid={`question-text-${q.id}`}
                      >
                        {q.text}
                      </p>

                      {/* Skill reference chips */}
                      {q.skillRefs.length > 0 && (
                        <div
                          className="flex flex-wrap gap-1.5 mb-2"
                          data-testid={`question-skills-${q.id}`}
                        >
                          {q.skillRefs.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium leading-tight text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Rationale + dimension tag */}
                      <div className="flex items-start gap-2 pt-2 border-t border-border-default/60">
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider flex-shrink-0"
                          style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
                        >
                          Why
                        </span>
                        <p
                          className="text-text-muted text-[11px] leading-relaxed flex-1"
                          style={{ fontFamily: "var(--font-body)" }}
                          data-testid={`question-rationale-${q.id}`}
                        >
                          {q.rationale}
                        </p>
                        <span
                          className="text-[9px] font-mono uppercase tracking-wider text-text-muted whitespace-nowrap flex-shrink-0"
                          style={{ letterSpacing: "0.08em" }}
                        >
                          {q.relatedDimension}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
