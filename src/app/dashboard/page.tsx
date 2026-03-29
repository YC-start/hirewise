"use client";

import {
  Briefcase,
  Users,
  Star,
  CalendarCheck,
  SquaresFour,
  ListBullets,
} from "@phosphor-icons/react";
import { useDashboardStore } from "@/stores/dashboard-store";

/**
 * Dashboard page — Job card grid / list view (B-1 + B-2).
 *
 * Features:
 * - Card grid view (default) with switchable compact list view
 * - View toggle component (grid / list icons)
 * - Job card data: title, status badge, resume count, high-score count, interviews
 * - Status badges: Active=#D4FF00, Draft=#888888, Paused=#FFB800, Closed=#FF4444
 * - "Industrial Clarity" design: dark surfaces, dense layout, no gradients/shadows
 */

// ── Mock job data ──────────────────────────────────────────────────────────

interface Job {
  id: string;
  title: string;
  department: string;
  status: "Active" | "Draft" | "Paused" | "Closed";
  resumes: number;
  highScore: number;
  interviews: number;
}

const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Backend Engineer",
    department: "Engineering",
    status: "Active",
    resumes: 142,
    highScore: 12,
    interviews: 4,
  },
  {
    id: "2",
    title: "Product Designer",
    department: "Design",
    status: "Active",
    resumes: 89,
    highScore: 8,
    interviews: 2,
  },
  {
    id: "3",
    title: "DevOps Lead",
    department: "Infrastructure",
    status: "Draft",
    resumes: 0,
    highScore: 0,
    interviews: 0,
  },
  {
    id: "4",
    title: "Frontend Engineer",
    department: "Engineering",
    status: "Paused",
    resumes: 67,
    highScore: 5,
    interviews: 1,
  },
  {
    id: "5",
    title: "Data Scientist",
    department: "AI/ML",
    status: "Active",
    resumes: 203,
    highScore: 18,
    interviews: 6,
  },
  {
    id: "6",
    title: "Technical Writer",
    department: "Documentation",
    status: "Closed",
    resumes: 34,
    highScore: 3,
    interviews: 2,
  },
];

// ── Status badge colors ────────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<Job["status"], string> = {
  Active: "bg-accent-primary text-surface-primary",
  Draft: "bg-text-secondary text-surface-primary",
  Paused: "bg-signal-warning text-surface-primary",
  Closed: "bg-signal-danger text-surface-primary",
};

// ── Aggregate stats from mock data ─────────────────────────────────────────

function computeStats(jobs: Job[]) {
  const openPositions = jobs.filter(
    (j) => j.status === "Active" || j.status === "Draft" || j.status === "Paused"
  ).length;
  const totalCandidates = jobs.reduce((sum, j) => sum + j.resumes, 0);
  const highScorers = jobs.reduce((sum, j) => sum + j.highScore, 0);
  const interviews = jobs.reduce((sum, j) => sum + j.interviews, 0);
  return { openPositions, totalCandidates, highScorers, interviews };
}

// ── Page Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { viewMode, setViewMode } = useDashboardStore();
  const stats = computeStats(MOCK_JOBS);

  return (
    <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-6 border-b border-border-default bg-surface-primary">
        <h2 className="font-heading text-base font-700 text-text-primary">
          Job Dashboard
        </h2>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          <button className="flex items-center gap-2 px-4 py-1.5 bg-accent-primary text-surface-primary font-heading text-sm font-700 hover:opacity-90 transition-opacity">
            + New Job
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <div className="p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Open Positions"
            value={String(stats.openPositions)}
            icon={<Briefcase size={18} weight="bold" />}
          />
          <StatCard
            label="Total Candidates"
            value={String(stats.totalCandidates)}
            icon={<Users size={18} weight="bold" />}
          />
          <StatCard
            label="High Scorers"
            value={String(stats.highScorers)}
            icon={<Star size={18} weight="bold" />}
            accent
          />
          <StatCard
            label="Interviews"
            value={String(stats.interviews)}
            icon={<CalendarCheck size={18} weight="bold" />}
          />
        </div>

        {/* Jobs — Grid or List view */}
        {viewMode === "grid" ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
            data-testid="job-grid-view"
          >
            {MOCK_JOBS.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div data-testid="job-list-view">
            <JobListView jobs={MOCK_JOBS} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── View Toggle ────────────────────────────────────────────────────────────

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}) {
  return (
    <div
      className="flex items-center border border-border-default bg-surface-secondary"
      data-testid="view-toggle"
    >
      <button
        onClick={() => onChange("grid")}
        className={`flex items-center justify-center w-8 h-8 transition-colors ${
          viewMode === "grid"
            ? "bg-accent-primary text-surface-primary"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
        }`}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        data-testid="view-toggle-grid"
      >
        <SquaresFour size={16} weight="bold" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`flex items-center justify-center w-8 h-8 transition-colors ${
          viewMode === "list"
            ? "bg-accent-primary text-surface-primary"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
        }`}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
        data-testid="view-toggle-list"
      >
        <ListBullets size={16} weight="bold" />
      </button>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="border border-border-default bg-surface-secondary p-3 flex items-center gap-3">
      <div
        className={`flex items-center justify-center w-9 h-9 ${
          accent
            ? "bg-accent-primary text-surface-primary"
            : "bg-surface-tertiary text-text-secondary"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="font-heading text-xl font-700 text-text-primary">
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Job Card (Grid View) ───────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  return (
    <div
      className="border border-border-default bg-surface-secondary p-4 hover:bg-surface-tertiary transition-colors cursor-pointer group"
      data-testid={`job-card-${job.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-base font-700 text-text-primary group-hover:text-accent-primary transition-colors">
            {job.title}
          </h3>
          <p className="text-text-secondary text-xs mt-0.5">{job.department}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-4 pt-3 border-t border-border-default">
        <MetricItem
          icon={<Users size={14} weight="bold" />}
          value={job.resumes}
          label="Resumes"
        />
        <MetricItem
          icon={<Star size={14} weight="bold" />}
          value={job.highScore}
          label=">80%"
          accent={job.highScore > 0}
        />
        <MetricItem
          icon={<CalendarCheck size={14} weight="bold" />}
          value={job.interviews}
          label="Interviews"
        />
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Job["status"] }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-500 ${STATUS_BADGE_STYLES[status]}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

// ── Metric Item ────────────────────────────────────────────────────────────

function MetricItem({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={accent ? "text-accent-primary" : "text-text-muted"}>
        {icon}
      </span>
      <span
        className={`font-mono text-sm font-500 ${
          accent ? "text-accent-primary" : "text-text-primary"
        }`}
      >
        {value}
      </span>
      <span className="text-text-muted text-xs">{label}</span>
    </div>
  );
}

// ── Job List View (Compact Table) ──────────────────────────────────────────

function JobListView({ jobs }: { jobs: Job[] }) {
  return (
    <div className="border border-border-default bg-surface-secondary overflow-hidden">
      {/* Table header */}
      <div
        className="grid items-center px-4 border-b border-border-default bg-surface-primary"
        style={{
          gridTemplateColumns: "1fr 100px 90px 90px 100px",
          height: "var(--row-height)",
        }}
      >
        <span className="table-header">Position</span>
        <span className="table-header text-center">Status</span>
        <span className="table-header text-right">Resumes</span>
        <span className="table-header text-right">&gt;80%</span>
        <span className="table-header text-right">Interviews</span>
      </div>

      {/* Table rows */}
      {jobs.map((job, idx) => (
        <div
          key={job.id}
          className={`grid items-center px-4 border-b border-border-default last:border-b-0 hover:bg-surface-tertiary transition-colors cursor-pointer ${
            idx % 2 === 1 ? "bg-surface-tertiary/30" : ""
          }`}
          style={{
            gridTemplateColumns: "1fr 100px 90px 90px 100px",
            height: "var(--row-height)",
          }}
          data-testid={`job-row-${job.id}`}
        >
          {/* Position */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <span className="font-heading text-sm font-700 text-text-primary truncate block">
                {job.title}
              </span>
              <span className="text-text-muted text-xs truncate block">
                {job.department}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex justify-center">
            <StatusBadge status={job.status} />
          </div>

          {/* Resumes */}
          <div className="text-right">
            <span className="font-mono text-sm font-500 text-text-primary">
              {job.resumes}
            </span>
          </div>

          {/* High Score */}
          <div className="text-right">
            <span
              className={`font-mono text-sm font-500 ${
                job.highScore > 0 ? "text-accent-primary" : "text-text-muted"
              }`}
            >
              {job.highScore}
            </span>
          </div>

          {/* Interviews */}
          <div className="text-right">
            <span className="font-mono text-sm font-500 text-text-primary">
              {job.interviews}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
