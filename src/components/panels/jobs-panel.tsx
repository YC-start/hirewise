"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  Star,
  CalendarCheck,
  SquaresFour,
  ListBullets,
  ChatCircleDots,
  DotsThreeVertical,
  Archive,
  XCircle,
  Funnel,
  FunnelSimple,
  CaretDown,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useDataPanelStore } from "@/stores/data-panel-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import {
  computeStats,
  getUniqueDepartments,
  STATUS_BADGE_STYLES,
  CURRENT_USER,
  type Job,
} from "@/data/mock-jobs";

/**
 * JobsPanelContent — Jobs dashboard embedded in the right data panel sidebar.
 *
 * Reuses the same data and logic from the original dashboard page,
 * adapted to fit within the sidebar width (~35-40%).
 * Clicking a job card navigates to the Pipeline tab in the sidebar.
 *
 * FLOW-1: The "+ New Job" button now focuses the chat input with a suggested
 * prompt instead of opening the deprecated B-3 modal. On mobile, it switches
 * to the chat tab.
 *
 * B-4: Closed/Archived jobs are visually demoted (opacity-50) and sorted to bottom.
 *      Context menu (three-dot) on each card allows Close/Archive actions.
 */

/** Sort jobs so Closed are pushed to the bottom, preserving order otherwise. */
function sortJobsWithClosedLast(jobs: Job[]): Job[] {
  const active: Job[] = [];
  const closed: Job[] = [];
  for (const job of jobs) {
    if (job.status === "Closed") {
      closed.push(job);
    } else {
      active.push(job);
    }
  }
  return [...active, ...closed];
}

export function JobsPanelContent() {
  const {
    viewMode,
    setViewMode,
    jobs,
    updateJobStatus,
    departmentFilter,
    myJobsOnly,
    setDepartmentFilter,
    setMyJobsOnly,
    clearFilters,
    hasActiveFilters,
    getFilteredJobs,
  } = useDashboardStore();
  const { selectJob } = useDataPanelStore();
  const { setMobileActiveTab } = useSidebarStore();

  const filteredJobs = getFilteredJobs();
  const stats = computeStats(filteredJobs);
  const allDepartments = getUniqueDepartments(jobs);
  const isFiltered = hasActiveFilters();

  const sortedJobs = sortJobsWithClosedLast(filteredJobs);

  const handleNewJob = () => {
    // On mobile, switch to chat tab
    setMobileActiveTab("chat");
    // Focus the chat input — small delay to let the DOM update on mobile tab switch
    setTimeout(() => {
      const chatInput = document.querySelector<HTMLInputElement>(
        '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
      );
      if (chatInput) {
        chatInput.focus();
        chatInput.placeholder =
          "Describe the role you want to hire for...";
      }
    }, 100);
  };

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
            onClick={handleNewJob}
            className="flex items-center gap-1 px-3 py-1 bg-accent-primary text-surface-primary font-heading text-[11px] font-bold rounded-full hover:opacity-90 transition-opacity"
            data-testid="new-job-btn"
          >
            <ChatCircleDots size={12} weight="bold" />
            + New Job
          </button>
        </div>
      </div>

      {/* B-5: Filter bar */}
      <FilterBar
        departments={allDepartments}
        departmentFilter={departmentFilter}
        myJobsOnly={myJobsOnly}
        isFiltered={isFiltered}
        onDepartmentChange={setDepartmentFilter}
        onMyJobsChange={setMyJobsOnly}
        onClearFilters={clearFilters}
        totalJobs={jobs.length}
        filteredCount={filteredJobs.length}
      />

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

        {/* Empty state when filters produce no results */}
        {sortedJobs.length === 0 && isFiltered && (
          <div className="flex flex-col items-center justify-center py-8 gap-2" data-testid="no-results-message">
            <FunnelSimple size={28} weight="bold" className="text-text-muted" />
            <p className="text-text-secondary text-xs text-center">
              No jobs match the current filters.
            </p>
            <button
              onClick={clearFilters}
              className="text-accent-primary text-[11px] font-mono uppercase tracking-wider hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Jobs — Grid or List view */}
        {viewMode === "grid" ? (
          <div
            className="flex flex-col gap-2"
            data-testid="job-grid-view"
          >
            {sortedJobs.map((job) => (
              <JobCardCompact
                key={job.id}
                job={job}
                onSelect={() => selectJob(job.id)}
                onUpdateStatus={(status) => updateJobStatus(job.id, status)}
              />
            ))}
          </div>
        ) : (
          <div data-testid="job-list-view">
            <JobListCompact
              jobs={sortedJobs}
              onSelectJob={(id) => selectJob(id)}
              onUpdateStatus={(id, status) => updateJobStatus(id, status)}
            />
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
        <p className="font-heading text-base font-bold text-text-primary">
          {value}
        </p>
      </div>
    </div>
  );
}

// ── B-5: Filter Bar ──────────────────────────────────────────────────────

function FilterBar({
  departments,
  departmentFilter,
  myJobsOnly,
  isFiltered,
  onDepartmentChange,
  onMyJobsChange,
  onClearFilters,
  totalJobs,
  filteredCount,
}: {
  departments: string[];
  departmentFilter: string | null;
  myJobsOnly: boolean;
  isFiltered: boolean;
  onDepartmentChange: (dept: string | null) => void;
  onMyJobsChange: (on: boolean) => void;
  onClearFilters: () => void;
  totalJobs: number;
  filteredCount: number;
}) {
  const [deptOpen, setDeptOpen] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!deptOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setDeptOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [deptOpen]);

  return (
    <div
      className="flex-shrink-0 border-b border-border-default"
      data-testid="filter-bar"
    >
      {/* Filter controls row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Funnel size={12} weight="bold" className="text-text-muted flex-shrink-0" />

        {/* Department dropdown */}
        <div className="relative" ref={deptRef}>
          <button
            onClick={() => setDeptOpen(!deptOpen)}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono border transition-colors ${
              departmentFilter
                ? "border-accent-primary text-accent-primary bg-accent-primary/10"
                : "border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted"
            }`}
            style={{ borderRadius: "2px" }}
            data-testid="department-filter"
            aria-expanded={deptOpen}
          >
            {departmentFilter || "Department"}
            <CaretDown size={10} weight="bold" />
          </button>

          {deptOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-50 min-w-[160px] border border-border-default bg-surface-secondary shadow-lg"
              style={{ borderRadius: "4px" }}
              data-testid="department-filter-dropdown"
            >
              {/* "All" option */}
              <button
                onClick={() => {
                  onDepartmentChange(null);
                  setDeptOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                  departmentFilter === null
                    ? "text-accent-primary bg-accent-primary/10"
                    : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                }`}
                data-testid="department-option-all"
              >
                All Departments
              </button>
              <div className="border-t border-border-default" />
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    onDepartmentChange(dept);
                    setDeptOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                    departmentFilter === dept
                      ? "text-accent-primary bg-accent-primary/10"
                      : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
                  }`}
                  data-testid={`department-option-${dept.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My Jobs toggle */}
        <button
          onClick={() => onMyJobsChange(!myJobsOnly)}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono border transition-colors ${
            myJobsOnly
              ? "border-accent-primary text-accent-primary bg-accent-primary/10"
              : "border-border-default text-text-secondary hover:text-text-primary hover:border-text-muted"
          }`}
          style={{ borderRadius: "2px" }}
          data-testid="my-jobs-filter"
          aria-pressed={myJobsOnly}
        >
          <UserCircle size={12} weight={myJobsOnly ? "fill" : "bold"} />
          My Jobs
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear filters */}
        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-text-muted hover:text-signal-danger transition-colors"
            data-testid="clear-filters"
          >
            <X size={10} weight="bold" />
            Clear
          </button>
        )}
      </div>

      {/* Active filter summary — only when filtering */}
      {isFiltered && (
        <div
          className="flex items-center gap-2 px-3 pb-2"
          data-testid="filter-summary"
        >
          <span className="text-text-muted text-[10px] font-mono">
            Showing {filteredCount} of {totalJobs}
          </span>
          {departmentFilter && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border border-accent-primary/40 text-accent-primary bg-accent-primary/5"
              style={{ borderRadius: "2px" }}
              data-testid="active-filter-department"
            >
              {departmentFilter}
              <button
                onClick={() => onDepartmentChange(null)}
                className="hover:text-text-primary transition-colors"
                aria-label={`Remove ${departmentFilter} filter`}
              >
                <X size={8} weight="bold" />
              </button>
            </span>
          )}
          {myJobsOnly && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono border border-accent-primary/40 text-accent-primary bg-accent-primary/5"
              style={{ borderRadius: "2px" }}
              data-testid="active-filter-my-jobs"
            >
              {CURRENT_USER}
              <button
                onClick={() => onMyJobsChange(false)}
                className="hover:text-text-primary transition-colors"
                aria-label="Remove My Jobs filter"
              >
                <X size={8} weight="bold" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Job Context Menu ──────────────────────────────────────────────────────

function JobContextMenu({
  job,
  onUpdateStatus,
}: {
  job: Job;
  onUpdateStatus: (status: Job["status"]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Don't show the menu for already-closed jobs
  if (job.status === "Closed") return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center w-6 h-6 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Job actions"
        data-testid={`job-context-menu-${job.id}`}
      >
        <DotsThreeVertical size={16} weight="bold" />
      </button>
      {isOpen && (
        <div
          className="absolute right-0 top-7 z-50 min-w-[140px] border border-border-default bg-surface-secondary shadow-lg"
          style={{ borderRadius: "4px" }}
          data-testid={`job-context-dropdown-${job.id}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus("Closed");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-tertiary transition-colors"
            data-testid={`job-close-btn-${job.id}`}
          >
            <XCircle size={14} weight="bold" className="text-signal-danger" />
            Close Job
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdateStatus("Closed");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-tertiary transition-colors border-t border-border-default"
            data-testid={`job-archive-btn-${job.id}`}
          >
            <Archive size={14} weight="bold" className="text-text-muted" />
            Archive Job
          </button>
        </div>
      )}
    </div>
  );
}

// ── Job Card Compact (Grid) ─────────────────────────────────────────────────

function JobCardCompact({
  job,
  onSelect,
  onUpdateStatus,
}: {
  job: Job;
  onSelect: () => void;
  onUpdateStatus: (status: Job["status"]) => void;
}) {
  const isClosed = job.status === "Closed";

  return (
    <div
      className={`relative w-full text-left border border-border-default bg-surface-tertiary/30 p-3 transition-all cursor-pointer group ${
        isClosed ? "opacity-50" : "hover:bg-surface-tertiary"
      }`}
      data-testid={`job-card-${job.id}`}
      data-job-status={job.status}
    >
      <button
        onClick={onSelect}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-text-secondary text-[11px] mt-0.5">{job.department}</p>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={job.status} />
          </div>
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
      {/* Context menu positioned in top-right corner */}
      <div className="absolute top-2 right-2">
        <JobContextMenu job={job} onUpdateStatus={onUpdateStatus} />
      </div>
    </div>
  );
}

// ── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Job["status"] }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium ${STATUS_BADGE_STYLES[status]}`}
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
        className={`font-mono text-[11px] font-medium ${
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
  onUpdateStatus,
}: {
  jobs: Job[];
  onSelectJob: (id: string) => void;
  onUpdateStatus: (id: string, status: Job["status"]) => void;
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
        <span className="w-8" />
      </div>

      {/* Rows */}
      {jobs.map((job, idx) => {
        const isClosed = job.status === "Closed";
        return (
          <div
            key={job.id}
            className={`w-full flex items-center px-3 border-b border-border-default last:border-b-0 transition-colors text-left ${
              isClosed
                ? "opacity-50"
                : idx % 2 === 1
                  ? "bg-surface-tertiary/30 hover:bg-surface-tertiary"
                  : "hover:bg-surface-tertiary"
            }`}
            style={{ height: "var(--row-height)" }}
            data-testid={`job-row-${job.id}`}
            data-job-status={job.status}
          >
            <button
              onClick={() => onSelectJob(job.id)}
              className="flex-1 min-w-0 cursor-pointer h-full flex items-center"
            >
              <span className="font-heading text-xs font-bold text-text-primary truncate block">
                {job.title}
              </span>
            </button>
            <div className="w-16 flex justify-center">
              <StatusBadge status={job.status} />
            </div>
            <div className="w-12 text-right">
              <span className="font-mono text-xs font-medium text-text-primary">
                {job.resumes}
              </span>
            </div>
            <div className="w-8 flex justify-center">
              <JobContextMenu
                job={job}
                onUpdateStatus={(status) => onUpdateStatus(job.id, status)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
