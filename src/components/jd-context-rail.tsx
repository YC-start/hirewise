"use client";

import {
  Target,
  Star,
  Briefcase,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import type { JobDescription, SkillTag } from "@/data/mock-jobs";

/**
 * JDContextRail — Left rail displaying JD context tags on the pipeline page (C-1).
 *
 * Displays:
 * - Job title + department header
 * - Seniority level badge
 * - Required skill tags (accent-primary border)
 * - Nice-to-have skill tags (visually differentiated with dashed border)
 * - JD summary
 *
 * Design:
 * - Sticky positioning so it stays visible while scrolling candidates
 * - Industrial Clarity: dark surface, no shadows, max 4px radius
 * - Skill tags are small rectangular labels
 */

interface JDContextRailProps {
  jobId: string;
  jobTitle: string;
  department: string;
  status: string;
  jd: JobDescription;
}

export function JDContextRail({
  jobTitle,
  department,
  status,
  jd,
}: JDContextRailProps) {
  const requiredSkills = jd.skills.filter((s) => s.category === "required");
  const niceToHaveSkills = jd.skills.filter(
    (s) => s.category === "nice-to-have"
  );

  return (
    <aside
      className="w-[280px] min-w-[280px] h-full border-r border-border-default bg-surface-secondary flex flex-col overflow-hidden"
      data-testid="jd-context-rail"
    >
      {/* Scrollable content — sticky in parent flex layout */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Job header */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-heading text-base font-bold text-text-primary leading-tight">
              {jobTitle}
            </h3>
          </div>
          <p className="text-text-secondary text-xs">{department}</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium ${statusStyle(status)}`}
              data-testid="rail-status-badge"
            >
              {status}
            </span>
          </div>
        </div>

        {/* Seniority */}
        <section className="mb-5" data-testid="rail-seniority">
          <SectionHeader
            icon={<Briefcase size={14} weight="bold" />}
            label="Seniority"
          />
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-accent-secondary border border-accent-secondary/40 bg-accent-secondary/8">
              <Target size={12} weight="bold" />
              {jd.seniority}
            </span>
          </div>
        </section>

        {/* Required Skills */}
        <section className="mb-5" data-testid="rail-required-skills">
          <SectionHeader
            icon={<Star size={14} weight="bold" />}
            label="Required Skills"
            count={requiredSkills.length}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {requiredSkills.map((skill) => (
              <SkillTagChip key={skill.name} skill={skill} />
            ))}
          </div>
        </section>

        {/* Nice-to-Have Skills */}
        {niceToHaveSkills.length > 0 && (
          <section className="mb-5" data-testid="rail-nice-to-have-skills">
            <SectionHeader
              icon={<ArrowSquareOut size={14} weight="bold" />}
              label="Nice to Have"
              count={niceToHaveSkills.length}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {niceToHaveSkills.map((skill) => (
                <SkillTagChip key={skill.name} skill={skill} />
              ))}
            </div>
          </section>
        )}

        {/* JD Summary */}
        <section data-testid="rail-jd-summary">
          <SectionHeader
            icon={<Briefcase size={14} weight="bold" />}
            label="Summary"
          />
          <p className="text-text-secondary text-xs leading-relaxed mt-2">
            {jd.summary}
          </p>
        </section>
      </div>
    </aside>
  );
}

// ── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-text-muted">{icon}</span>
      <span className="table-header">{label}</span>
      {count !== undefined && (
        <span className="font-mono text-[10px] text-text-muted ml-auto">
          {count}
        </span>
      )}
    </div>
  );
}

// ── Skill Tag Chip ──────────────────────────────────────────────────────────

function SkillTagChip({ skill }: { skill: SkillTag }) {
  const isRequired = skill.category === "required";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-medium leading-tight ${
        isRequired
          ? "text-accent-primary border border-accent-primary/40 bg-accent-primary/8"
          : "text-text-secondary border border-border-default border-dashed bg-surface-tertiary/50"
      }`}
      data-testid={`skill-tag-${skill.name.toLowerCase().replace(/[\s/()]+/g, "-")}`}
      data-skill-category={skill.category}
    >
      {skill.name}
    </span>
  );
}

// ── Status style helper ─────────────────────────────────────────────────────

function statusStyle(status: string): string {
  switch (status) {
    case "Active":
      return "bg-accent-primary text-surface-primary";
    case "Draft":
      return "bg-text-secondary text-surface-primary";
    case "Paused":
      return "bg-signal-warning text-surface-primary";
    case "Closed":
      return "bg-signal-danger text-surface-primary";
    default:
      return "bg-text-secondary text-surface-primary";
  }
}
