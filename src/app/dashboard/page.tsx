"use client";

import { Briefcase, Users, Star, CalendarCheck } from "@phosphor-icons/react";

/**
 * Dashboard page — Job card grid.
 * This page demonstrates the "Industrial Clarity" design system:
 * - Dark surfaces, accent colors, typography hierarchy, component patterns.
 * Full interactivity (view toggle, real data) comes in B-1 / B-2.
 */

// Placeholder job data for design system demonstration
const DEMO_JOBS = [
  {
    id: "1",
    title: "Senior Backend Engineer",
    department: "Engineering",
    status: "Active" as const,
    resumes: 142,
    highScore: 12,
    interviews: 4,
  },
  {
    id: "2",
    title: "Product Designer",
    department: "Design",
    status: "Active" as const,
    resumes: 89,
    highScore: 8,
    interviews: 2,
  },
  {
    id: "3",
    title: "DevOps Lead",
    department: "Infrastructure",
    status: "Draft" as const,
    resumes: 0,
    highScore: 0,
    interviews: 0,
  },
  {
    id: "4",
    title: "Frontend Engineer",
    department: "Engineering",
    status: "Paused" as const,
    resumes: 67,
    highScore: 5,
    interviews: 1,
  },
  {
    id: "5",
    title: "Data Scientist",
    department: "AI/ML",
    status: "Active" as const,
    resumes: 203,
    highScore: 18,
    interviews: 6,
  },
  {
    id: "6",
    title: "Technical Writer",
    department: "Documentation",
    status: "Closed" as const,
    resumes: 34,
    highScore: 3,
    interviews: 2,
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-accent-primary text-surface-primary",
  Draft: "bg-surface-tertiary text-text-secondary",
  Paused: "bg-signal-warning text-surface-primary",
  Closed: "bg-text-muted text-surface-primary",
};

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-6 border-b border-border-default bg-surface-primary">
        <h2 className="font-heading text-base font-700 text-text-primary">
          Job Dashboard
        </h2>
        <button className="flex items-center gap-2 px-4 py-1.5 bg-accent-primary text-surface-primary font-heading text-sm font-700 hover:opacity-90 transition-opacity">
          + New Job
        </button>
      </header>

      {/* Dashboard content */}
      <div className="p-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Open Positions"
            value="4"
            icon={<Briefcase size={18} weight="bold" />}
          />
          <StatCard
            label="Total Candidates"
            value="535"
            icon={<Users size={18} weight="bold" />}
          />
          <StatCard
            label="High Scorers"
            value="46"
            icon={<Star size={18} weight="bold" />}
            accent
          />
          <StatCard
            label="Interviews"
            value="15"
            icon={<CalendarCheck size={18} weight="bold" />}
          />
        </div>

        {/* Job card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {DEMO_JOBS.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}

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

function JobCard({
  job,
}: {
  job: {
    id: string;
    title: string;
    department: string;
    status: string;
    resumes: number;
    highScore: number;
    interviews: number;
  };
}) {
  return (
    <div className="border border-border-default bg-surface-secondary p-4 hover:bg-surface-tertiary transition-colors cursor-pointer group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading text-base font-700 text-text-primary group-hover:text-accent-primary transition-colors">
            {job.title}
          </h3>
          <p className="text-text-secondary text-xs mt-0.5">{job.department}</p>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-500 ${
            STATUS_STYLES[job.status] || STATUS_STYLES.Draft
          }`}
        >
          {job.status}
        </span>
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
