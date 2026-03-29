/**
 * Mock job data — single source of truth for all job-related views.
 * Replace with API calls when backend is integrated.
 */

export interface Job {
  id: string;
  title: string;
  department: string;
  status: "Active" | "Draft" | "Paused" | "Closed";
  resumes: number;
  highScore: number;
  interviews: number;
}

export const MOCK_JOBS: Job[] = [
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

/** Compute aggregate stats from a list of jobs. */
export function computeStats(jobs: Job[]) {
  const openPositions = jobs.filter(
    (j) => j.status === "Active" || j.status === "Draft" || j.status === "Paused"
  ).length;
  const totalCandidates = jobs.reduce((sum, j) => sum + j.resumes, 0);
  const highScorers = jobs.reduce((sum, j) => sum + j.highScore, 0);
  const interviews = jobs.reduce((sum, j) => sum + j.interviews, 0);
  return { openPositions, totalCandidates, highScorers, interviews };
}

/** Status badge color mapping. */
export const STATUS_BADGE_STYLES: Record<Job["status"], string> = {
  Active: "bg-accent-primary text-surface-primary",
  Draft: "bg-text-secondary text-surface-primary",
  Paused: "bg-signal-warning text-surface-primary",
  Closed: "bg-signal-danger text-surface-primary",
};
