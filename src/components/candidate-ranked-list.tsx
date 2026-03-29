"use client";

import Link from "next/link";
import { getCandidatesForJob } from "@/data/mock-candidates";
import { useCandidateStore } from "@/stores/candidate-store";
import type { Candidate } from "@/data/mock-candidates";

/**
 * CandidateRankedList — Main panel component for the pipeline page (C-2).
 *
 * Displays candidates sorted by AI match score descending.
 * Each row shows: name, match score (large numeric + horizontal bar), top 3 skill tags.
 *
 * Design:
 * - Table-style layout with 40-44px row height
 * - Alternating row tint (surface-tertiary/30)
 * - Column headers: uppercase 11px #555555 letter-spacing 0.08em
 * - Score bar: flat/square ends (no rounded), color-coded by score range
 * - Score number: Space Grotesk 700 via JetBrains Mono for monospace alignment
 * - Click row to navigate to /job/[id]/candidate/[cid]
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

export function CandidateRankedList({ jobId }: CandidateRankedListProps) {
  const apiCandidates = useCandidateStore((s) => s.candidatesByJob[jobId] || []);
  const candidates = apiCandidates.length > 0
    ? [...apiCandidates].sort((a, b) => b.matchScore - a.matchScore)
    : getCandidatesForJob(jobId);

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
        <div className="w-8 table-header text-center">#</div>
        <div className="flex-1 min-w-[140px] table-header pl-3">Candidate</div>
        <div className="w-[200px] table-header pl-3">AI Score</div>
        <div className="flex-1 min-w-[200px] table-header pl-3">Matched Skills</div>
        <div className="w-[180px] table-header pl-3 hidden xl:block">Sub-Scores</div>
      </div>

      {/* Candidate rows */}
      <div className="flex-1 overflow-y-auto" data-testid="candidate-list-body">
        {candidates.map((candidate, index) => (
          <CandidateRow
            key={candidate.id}
            candidate={candidate}
            rank={index + 1}
            jobId={jobId}
            isOdd={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}

// ── Candidate Row ────────────────────────────────────────────────────────────

interface CandidateRowProps {
  candidate: Candidate;
  rank: number;
  jobId: string;
  isOdd: boolean;
}

function CandidateRow({ candidate, rank, jobId, isOdd }: CandidateRowProps) {
  const topSkills = candidate.skills.slice(0, 3);
  const scoreColor = getScoreColor(candidate.matchScore);
  const scoreTextClass = getScoreTextClass(candidate.matchScore);

  return (
    <Link
      href={`/job/${jobId}/candidate/${candidate.id}`}
      className={`flex items-center h-[42px] px-4 border-b border-border-default cursor-pointer transition-colors hover:bg-surface-tertiary ${
        isOdd ? "bg-surface-tertiary/30" : "bg-transparent"
      }`}
      data-testid={`candidate-row-${candidate.id}`}
    >
      {/* Rank */}
      <div className="w-8 text-center font-mono text-xs text-text-muted">
        {rank}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-[140px] pl-3">
        <span className="text-sm text-text-primary font-500 truncate block">
          {candidate.name}
        </span>
      </div>

      {/* AI Score: number + bar */}
      <div className="w-[200px] pl-3 flex items-center gap-3">
        <span
          className={`font-heading font-700 text-lg leading-none min-w-[36px] ${scoreTextClass}`}
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
            className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-500 leading-tight text-accent-primary border border-accent-primary/40 bg-accent-primary/8 whitespace-nowrap flex-shrink-0"
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
    </Link>
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
      <span className={`font-mono text-[11px] font-500 ${scoreTextClass}`}>
        {value}
      </span>
    </div>
  );
}
