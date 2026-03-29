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
import { useDataPanelStore } from "@/stores/data-panel-store";
import {
  computeStats,
  STATUS_BADGE_STYLES,
  type Job,
} from "@/data/mock-jobs";

/**
 * JobsPanelContent — Jobs dashboard embedded in the right data panel sidebar.
 *
 * Reuses the same data and logic from the original dashboard page,
 * adapted to fit within the sidebar width (~35-40%).
 * Clicking a job card navigates to the Pipeline tab in the sidebar.
 */
export function JobsPanelContent() {
  const { viewMode, setViewMode, jobs, openCreateModal } = useDashboardStore();
  const { selectJob } = useDataPanelStore();
  const stats = computeStats(jobs);

  return (
    <div className="flex flex-col h-full overflow-hidden" data-testid="jobs-panel">
      {/* Mini toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between h-10 px-3 border-b border-border-default">
        <span className="text-text-muted text-[11px] font-mono uppercase tracking-widest">
          {stats.openPositions} open positions
        </span>
        <div className="flex items-center gap-2">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 px-3 py-1 bg-accent-primary text-surface-primary font-heading text-[11px] font-700 rounded-full hover:opacity-90 transition-opacity"
            data-testid="new-job-btn"
          >
            + New Job
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Stats row — compact 2-column */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MiniStatCard
            label="Candidates"
            value={String(stats.totalCandidates)}
            icon={<Users size={14} weight="bold" />}
          />
          <MiniStatCard
            label="High Score"
            value={String(stats.highScorers)}
            icon={<Star size={14} weight="bold" />}
            accent
          />
        </div>

        {/* Jobs — Grid or List view */}
        {viewMode === "grid" ? (
          <div
            className="flex flex-col gap-2"
            data-testid="job-grid-view"
          >
            {jobs.map((job) => (
              <JobCardCompact
                key={job.id}
                job={job}
                onSelect={() => selectJob(job.id)}
              />
            ))}
          </div>
        ) : (
          <div data-testid="job-list-view">
            <JobListCompact jobs={jobs} onSelectJob={(id) => selectJob(id)} />
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
      className="flex items-center border border-border-default bg-surface-tertiary"
      data-testid="view-toggle"
    >
      <button
        onClick={() => onChange("grid")}
        className={`flex items-center justify-center w-6 h-6 transition-colors ${
          viewMode === "grid"
            ? "bg-accent-primary text-surface-primary"
            : "text-text-secondary hover:text-text-primary"
        }`}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        data-testid="view-toggle-grid"
      >
        <SquaresFour size={12} weight="bold" />
      </button>
      <button
        onClick={() => onChange("list")}
        className={`flex items-center justify-center w-6 h-6 transition-colors ${
          viewMode === "list"
            ? "bg-accent-primary text-surface-primary"
            : "text-text-secondary hover:text-text-primary"
        }`}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
        data-testid="view-toggle-list"
      >
        <ListBullets size={12} weight="bold" />
      </button>
    </div>
  );
}

// ── Mini Stat Card ──────────────────────────────────────────────────────────

function MiniStatCard({
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
    <div className="border border-border-default bg-surface-tertiary/50 p-2 flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-7 h-7 ${
          accent
            ? "bg-accent-primary text-surface-primary"
            : "bg-surface-tertiary text-text-secondary"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-text-muted text-[10px] font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="font-heading text-base font-700 text-text-primary">
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Job Card Compact (Grid) ─────────────────────────────────────────────────

function JobCardCompact({
  job,
  onSelect,
}: {
  job: Job;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left border border-border-default bg-surface-tertiary/30 p-3 hover:bg-surface-tertiary transition-colors cursor-pointer group"
      data-testid={`job-card-${job.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-sm font-700 text-text-primary group-hover:text-accent-primary transition-colors truncate">
            {job.title}
          </h3>
          <p className="text-text-secondary text-[11px] mt-0.5">{job.department}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-border-default">
        <MetricItem
          icon={<Users size={12} weight="bold" />}
          value={job.resumes}
          label="Res"
        />
        <MetricItem
          icon={<Star size={12} weight="bold" />}
          value={job.highScore}
          label=">80%"
          accent={job.highScore > 0}
        />
        <MetricItem
          icon={<CalendarCheck size={12} weight="bold" />}
          value={job.interviews}
          label="Int"
        />
      </div>
    </button>
  );
}

// ── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Job["status"] }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-500 ${STATUS_BADGE_STYLES[status]}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}

// ── Metric Item ─────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-1">
      <span className={accent ? "text-accent-primary" : "text-text-muted"}>
        {icon}
      </span>
      <span
        className={`font-mono text-[11px] font-500 ${
          accent ? "text-accent-primary" : "text-text-primary"
        }`}
      >
        {value}
      </span>
      <span className="text-text-muted text-[10px]">{label}</span>
    </div>
  );
}

// ── Job List Compact ────────────────────────────────────────────────────────

function JobListCompact({
  jobs,
  onSelectJob,
}: {
  jobs: Job[];
  onSelectJob: (id: string) => void;
}) {
  return (
    <div className="border border-border-default bg-surface-tertiary/30 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center px-3 border-b border-border-default bg-surface-primary"
        style={{ height: "var(--row-height)" }}
      >
        <span className="flex-1 table-header">Position</span>
        <span className="w-16 table-header text-center">Status</span>
        <span className="w-12 table-header text-right">Res</span>
      </div>

      {/* Rows */}
      {jobs.map((job, idx) => (
        <button
          key={job.id}
          onClick={() => onSelectJob(job.id)}
          className={`w-full flex items-center px-3 border-b border-border-default last:border-b-0 hover:bg-surface-tertiary transition-colors cursor-pointer text-left ${
            idx % 2 === 1 ? "bg-surface-tertiary/30" : ""
          }`}
          style={{ height: "var(--row-height)" }}
          data-testid={`job-row-${job.id}`}
        >
          <div className="flex-1 min-w-0">
            <span className="font-heading text-xs font-700 text-text-primary truncate block">
              {job.title}
            </span>
          </div>
          <div className="w-16 flex justify-center">
            <StatusBadge status={job.status} />
          </div>
          <div className="w-12 text-right">
            <span className="font-mono text-xs font-500 text-text-primary">
              {job.resumes}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
