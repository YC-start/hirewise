/**
 * Mock job data — single source of truth for all job-related views.
 * Replace with API calls when backend is integrated.
 */

export interface SkillTag {
  name: string;
  category: "required" | "nice-to-have";
}

export interface JobDescription {
  seniority: string;
  skills: SkillTag[];
  summary: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  status: "Active" | "Draft" | "Paused" | "Closed";
  resumes: number;
  highScore: number;
  interviews: number;
  owner?: string;
  jd?: JobDescription;
}

/** Mock current user for owner filtering (B-5). */
export const CURRENT_USER = "Alex Chen";

/** All unique departments extracted from the job list. */
export function getUniqueDepartments(jobs: Job[]): string[] {
  const depts = new Set(jobs.map((j) => j.department));
  return Array.from(depts).sort();
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
    owner: "Alex Chen",
    jd: {
      seniority: "Senior (5-8 years)",
      summary:
        "Build and scale distributed backend services powering our recruiting pipeline. Own system design, API contracts, and production reliability.",
      skills: [
        { name: "Go", category: "required" },
        { name: "Kubernetes", category: "required" },
        { name: "PostgreSQL", category: "required" },
        { name: "gRPC", category: "required" },
        { name: "Distributed Systems", category: "required" },
        { name: "Rust", category: "nice-to-have" },
        { name: "Terraform", category: "nice-to-have" },
        { name: "GraphQL", category: "nice-to-have" },
      ],
    },
  },
  {
    id: "2",
    title: "Product Designer",
    department: "Design",
    status: "Active",
    resumes: 89,
    highScore: 8,
    interviews: 2,
    owner: "Sarah Kim",
    jd: {
      seniority: "Mid-Senior (3-6 years)",
      summary:
        "Design end-to-end product experiences for data-dense recruiting workflows. Champion usability, information hierarchy, and design system consistency.",
      skills: [
        { name: "Figma", category: "required" },
        { name: "Design Systems", category: "required" },
        { name: "User Research", category: "required" },
        { name: "Prototyping", category: "required" },
        { name: "Data Visualization", category: "nice-to-have" },
        { name: "Motion Design", category: "nice-to-have" },
        { name: "Front-end CSS", category: "nice-to-have" },
      ],
    },
  },
  {
    id: "3",
    title: "DevOps Lead",
    department: "Infrastructure",
    status: "Draft",
    resumes: 0,
    highScore: 0,
    interviews: 0,
    owner: "Alex Chen",
    jd: {
      seniority: "Lead (7-10 years)",
      summary:
        "Lead infrastructure strategy and CI/CD pipelines. Manage cloud architecture, monitoring, and incident response for a high-availability SaaS platform.",
      skills: [
        { name: "AWS", category: "required" },
        { name: "Terraform", category: "required" },
        { name: "Docker", category: "required" },
        { name: "Kubernetes", category: "required" },
        { name: "CI/CD", category: "required" },
        { name: "Monitoring (Datadog/Grafana)", category: "required" },
        { name: "GCP", category: "nice-to-have" },
        { name: "Pulumi", category: "nice-to-have" },
      ],
    },
  },
  {
    id: "4",
    title: "Frontend Engineer",
    department: "Engineering",
    status: "Paused",
    resumes: 67,
    highScore: 5,
    interviews: 1,
    owner: "Maria Lopez",
    jd: {
      seniority: "Mid (3-5 years)",
      summary:
        "Build performant, accessible UI components for a data-intensive recruiting dashboard. Work closely with designers to implement the Industrial Clarity design system.",
      skills: [
        { name: "React", category: "required" },
        { name: "TypeScript", category: "required" },
        { name: "Next.js", category: "required" },
        { name: "Tailwind CSS", category: "required" },
        { name: "Accessibility (WCAG)", category: "required" },
        { name: "Three.js", category: "nice-to-have" },
        { name: "Framer Motion", category: "nice-to-have" },
      ],
    },
  },
  {
    id: "5",
    title: "Data Scientist",
    department: "AI/ML",
    status: "Active",
    resumes: 203,
    highScore: 18,
    interviews: 6,
    owner: "Alex Chen",
    jd: {
      seniority: "Senior (5-8 years)",
      summary:
        "Design and deploy ML models for resume-to-JD semantic matching, candidate scoring, and talent pool analytics. Drive data-informed product decisions.",
      skills: [
        { name: "Python", category: "required" },
        { name: "PyTorch", category: "required" },
        { name: "NLP / LLMs", category: "required" },
        { name: "SQL", category: "required" },
        { name: "Embeddings & Vector Search", category: "required" },
        { name: "MLOps (MLflow/Kubeflow)", category: "nice-to-have" },
        { name: "Spark", category: "nice-to-have" },
        { name: "RAG Pipelines", category: "nice-to-have" },
      ],
    },
  },
  {
    id: "6",
    title: "Technical Writer",
    department: "Documentation",
    status: "Closed",
    resumes: 34,
    highScore: 3,
    interviews: 2,
    owner: "Sarah Kim",
    jd: {
      seniority: "Mid (2-4 years)",
      summary:
        "Create clear, concise developer documentation, API references, and user guides. Collaborate with engineering to keep docs in sync with product releases.",
      skills: [
        { name: "Technical Writing", category: "required" },
        { name: "API Documentation", category: "required" },
        { name: "Markdown / MDX", category: "required" },
        { name: "Git", category: "required" },
        { name: "Developer Experience", category: "nice-to-have" },
        { name: "Video Tutorials", category: "nice-to-have" },
      ],
    },
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
