/**
 * Mock candidate data — single source of truth for candidate ranking views.
 * Each job maps to 10-15 candidates with AI match scores and skill tags.
 * Replace with API calls when backend is integrated.
 */

export interface SubScores {
  technicalFit: number;
  cultureFit: number;
  experienceDepth: number;
}

export interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  skills: string[];
  subScores: SubScores;
}

/**
 * Map of jobId -> candidate array.
 * Candidates are stored unsorted; the UI sorts by matchScore descending.
 */
export const MOCK_CANDIDATES: Record<string, Candidate[]> = {
  // Job 1: Senior Backend Engineer
  "1": [
    { id: "c1-01", name: "Liam Chen", matchScore: 96, skills: ["Go", "Kubernetes", "gRPC", "PostgreSQL", "Distributed Systems"], subScores: { technicalFit: 98, cultureFit: 90, experienceDepth: 95 } },
    { id: "c1-02", name: "Ava Petrov", matchScore: 93, skills: ["Go", "Kubernetes", "PostgreSQL", "Terraform", "Docker"], subScores: { technicalFit: 95, cultureFit: 88, experienceDepth: 92 } },
    { id: "c1-03", name: "Marcus Webb", matchScore: 89, skills: ["Go", "Distributed Systems", "gRPC", "Rust"], subScores: { technicalFit: 92, cultureFit: 82, experienceDepth: 88 } },
    { id: "c1-04", name: "Yuki Tanaka", matchScore: 87, skills: ["Go", "Kubernetes", "PostgreSQL", "CI/CD"], subScores: { technicalFit: 90, cultureFit: 85, experienceDepth: 82 } },
    { id: "c1-05", name: "Priya Sharma", matchScore: 84, skills: ["Kubernetes", "gRPC", "PostgreSQL", "Python"], subScores: { technicalFit: 86, cultureFit: 84, experienceDepth: 80 } },
    { id: "c1-06", name: "Jordan Blake", matchScore: 81, skills: ["Go", "Docker", "PostgreSQL", "GraphQL"], subScores: { technicalFit: 83, cultureFit: 80, experienceDepth: 78 } },
    { id: "c1-07", name: "Elena Vasquez", matchScore: 77, skills: ["Go", "Kubernetes", "Terraform"], subScores: { technicalFit: 80, cultureFit: 72, experienceDepth: 75 } },
    { id: "c1-08", name: "Samuel Osei", matchScore: 72, skills: ["Distributed Systems", "PostgreSQL", "Java"], subScores: { technicalFit: 74, cultureFit: 70, experienceDepth: 71 } },
    { id: "c1-09", name: "Nina Kowalski", matchScore: 65, skills: ["Go", "Docker", "Redis"], subScores: { technicalFit: 68, cultureFit: 65, experienceDepth: 60 } },
    { id: "c1-10", name: "Ryan Mitchell", matchScore: 58, skills: ["PostgreSQL", "Python", "REST APIs"], subScores: { technicalFit: 55, cultureFit: 62, experienceDepth: 58 } },
    { id: "c1-11", name: "Fatima Al-Rashid", matchScore: 51, skills: ["Java", "Kubernetes", "Microservices"], subScores: { technicalFit: 50, cultureFit: 55, experienceDepth: 48 } },
    { id: "c1-12", name: "Derek Chung", matchScore: 44, skills: ["Node.js", "PostgreSQL", "Docker"], subScores: { technicalFit: 42, cultureFit: 48, experienceDepth: 44 } },
  ],

  // Job 2: Product Designer
  "2": [
    { id: "c2-01", name: "Sofia Lindberg", matchScore: 94, skills: ["Figma", "Design Systems", "User Research", "Prototyping"], subScores: { technicalFit: 96, cultureFit: 92, experienceDepth: 90 } },
    { id: "c2-02", name: "Kai Nakamura", matchScore: 91, skills: ["Figma", "Design Systems", "Data Visualization", "Motion Design"], subScores: { technicalFit: 93, cultureFit: 88, experienceDepth: 89 } },
    { id: "c2-03", name: "Olivia James", matchScore: 88, skills: ["Figma", "User Research", "Prototyping", "Front-end CSS"], subScores: { technicalFit: 90, cultureFit: 85, experienceDepth: 86 } },
    { id: "c2-04", name: "Thomas Müller", matchScore: 85, skills: ["Figma", "Design Systems", "Prototyping"], subScores: { technicalFit: 87, cultureFit: 82, experienceDepth: 83 } },
    { id: "c2-05", name: "Aria Patel", matchScore: 82, skills: ["Figma", "User Research", "Motion Design"], subScores: { technicalFit: 84, cultureFit: 80, experienceDepth: 79 } },
    { id: "c2-06", name: "Lucas Ferreira", matchScore: 76, skills: ["Figma", "Prototyping", "Illustration"], subScores: { technicalFit: 78, cultureFit: 75, experienceDepth: 72 } },
    { id: "c2-07", name: "Zara Ahmed", matchScore: 70, skills: ["Sketch", "Design Systems", "User Research"], subScores: { technicalFit: 72, cultureFit: 68, experienceDepth: 67 } },
    { id: "c2-08", name: "Ethan Park", matchScore: 63, skills: ["Figma", "Front-end CSS", "Accessibility"], subScores: { technicalFit: 65, cultureFit: 60, experienceDepth: 62 } },
    { id: "c2-09", name: "Isabella Costa", matchScore: 55, skills: ["Adobe XD", "Prototyping", "Branding"], subScores: { technicalFit: 52, cultureFit: 58, experienceDepth: 55 } },
    { id: "c2-10", name: "Noah Williams", matchScore: 48, skills: ["Canva", "UI Design", "Typography"], subScores: { technicalFit: 45, cultureFit: 50, experienceDepth: 48 } },
  ],

  // Job 3: DevOps Lead
  "3": [
    { id: "c3-01", name: "Viktor Kozlov", matchScore: 92, skills: ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD"], subScores: { technicalFit: 95, cultureFit: 88, experienceDepth: 91 } },
    { id: "c3-02", name: "Hannah Nguyen", matchScore: 88, skills: ["AWS", "Terraform", "Docker", "Monitoring (Datadog/Grafana)"], subScores: { technicalFit: 90, cultureFit: 86, experienceDepth: 85 } },
    { id: "c3-03", name: "Oscar Martínez", matchScore: 85, skills: ["AWS", "Kubernetes", "CI/CD", "GCP", "Pulumi"], subScores: { technicalFit: 88, cultureFit: 82, experienceDepth: 83 } },
    { id: "c3-04", name: "Ingrid Svensson", matchScore: 80, skills: ["Terraform", "Docker", "Kubernetes", "AWS"], subScores: { technicalFit: 82, cultureFit: 78, experienceDepth: 78 } },
    { id: "c3-05", name: "David Kim", matchScore: 75, skills: ["AWS", "Docker", "CI/CD", "Jenkins"], subScores: { technicalFit: 78, cultureFit: 72, experienceDepth: 73 } },
    { id: "c3-06", name: "Maya Johnson", matchScore: 69, skills: ["Terraform", "AWS", "Monitoring (Datadog/Grafana)"], subScores: { technicalFit: 72, cultureFit: 66, experienceDepth: 67 } },
    { id: "c3-07", name: "Ali Hassan", matchScore: 62, skills: ["Docker", "Kubernetes", "Linux"], subScores: { technicalFit: 64, cultureFit: 60, experienceDepth: 60 } },
    { id: "c3-08", name: "Clara Dubois", matchScore: 54, skills: ["AWS", "Ansible", "Bash"], subScores: { technicalFit: 56, cultureFit: 52, experienceDepth: 53 } },
    { id: "c3-09", name: "James O'Brien", matchScore: 47, skills: ["GCP", "Docker", "Python"], subScores: { technicalFit: 48, cultureFit: 46, experienceDepth: 45 } },
    { id: "c3-10", name: "Mei Lin", matchScore: 40, skills: ["Linux", "Bash", "Networking"], subScores: { technicalFit: 38, cultureFit: 42, experienceDepth: 40 } },
  ],

  // Job 4: Frontend Engineer
  "4": [
    { id: "c4-01", name: "Emma Thompson", matchScore: 95, skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Accessibility (WCAG)"], subScores: { technicalFit: 97, cultureFit: 92, experienceDepth: 93 } },
    { id: "c4-02", name: "Alex Rivera", matchScore: 90, skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Framer Motion"], subScores: { technicalFit: 93, cultureFit: 87, experienceDepth: 88 } },
    { id: "c4-03", name: "Suki Watanabe", matchScore: 86, skills: ["React", "TypeScript", "Tailwind CSS", "Three.js"], subScores: { technicalFit: 88, cultureFit: 84, experienceDepth: 84 } },
    { id: "c4-04", name: "Ben Carter", matchScore: 83, skills: ["React", "TypeScript", "Next.js", "CSS-in-JS"], subScores: { technicalFit: 85, cultureFit: 80, experienceDepth: 82 } },
    { id: "c4-05", name: "Leila Hosseini", matchScore: 79, skills: ["React", "TypeScript", "Accessibility (WCAG)", "Storybook"], subScores: { technicalFit: 82, cultureFit: 76, experienceDepth: 77 } },
    { id: "c4-06", name: "Carlos Mendez", matchScore: 74, skills: ["React", "Next.js", "Tailwind CSS"], subScores: { technicalFit: 76, cultureFit: 72, experienceDepth: 72 } },
    { id: "c4-07", name: "Diana Popescu", matchScore: 68, skills: ["Vue.js", "TypeScript", "CSS"], subScores: { technicalFit: 70, cultureFit: 66, experienceDepth: 66 } },
    { id: "c4-08", name: "Nathan Brooks", matchScore: 61, skills: ["React", "JavaScript", "SASS"], subScores: { technicalFit: 63, cultureFit: 60, experienceDepth: 58 } },
    { id: "c4-09", name: "Aisha Mohammed", matchScore: 53, skills: ["Angular", "TypeScript", "RxJS"], subScores: { technicalFit: 50, cultureFit: 56, experienceDepth: 52 } },
    { id: "c4-10", name: "Greg Sullivan", matchScore: 45, skills: ["jQuery", "HTML", "CSS"], subScores: { technicalFit: 40, cultureFit: 50, experienceDepth: 45 } },
    { id: "c4-11", name: "Rosa Valentini", matchScore: 38, skills: ["WordPress", "PHP", "CSS"], subScores: { technicalFit: 32, cultureFit: 44, experienceDepth: 38 } },
  ],

  // Job 5: Data Scientist
  "5": [
    { id: "c5-01", name: "Dr. Wei Zhang", matchScore: 97, skills: ["Python", "PyTorch", "NLP / LLMs", "Embeddings & Vector Search", "SQL"], subScores: { technicalFit: 99, cultureFit: 93, experienceDepth: 96 } },
    { id: "c5-02", name: "Sarah O'Connor", matchScore: 94, skills: ["Python", "PyTorch", "NLP / LLMs", "RAG Pipelines", "SQL"], subScores: { technicalFit: 96, cultureFit: 90, experienceDepth: 93 } },
    { id: "c5-03", name: "Raj Gupta", matchScore: 91, skills: ["Python", "PyTorch", "Embeddings & Vector Search", "MLOps (MLflow/Kubeflow)"], subScores: { technicalFit: 93, cultureFit: 88, experienceDepth: 90 } },
    { id: "c5-04", name: "Maria Fernandez", matchScore: 87, skills: ["Python", "NLP / LLMs", "SQL", "Spark", "TensorFlow"], subScores: { technicalFit: 89, cultureFit: 85, experienceDepth: 85 } },
    { id: "c5-05", name: "Andrei Volkov", matchScore: 84, skills: ["Python", "PyTorch", "SQL", "Data Engineering"], subScores: { technicalFit: 86, cultureFit: 82, experienceDepth: 82 } },
    { id: "c5-06", name: "Jenny Li", matchScore: 80, skills: ["Python", "NLP / LLMs", "Embeddings & Vector Search"], subScores: { technicalFit: 82, cultureFit: 78, experienceDepth: 78 } },
    { id: "c5-07", name: "Patrick Brennan", matchScore: 76, skills: ["Python", "SQL", "Spark", "Statistics"], subScores: { technicalFit: 78, cultureFit: 74, experienceDepth: 74 } },
    { id: "c5-08", name: "Hana Yoshida", matchScore: 71, skills: ["Python", "PyTorch", "Computer Vision"], subScores: { technicalFit: 73, cultureFit: 70, experienceDepth: 68 } },
    { id: "c5-09", name: "Michael Adeyemi", matchScore: 65, skills: ["Python", "SQL", "Pandas", "Scikit-learn"], subScores: { technicalFit: 62, cultureFit: 68, experienceDepth: 64 } },
    { id: "c5-10", name: "Lisa Johansson", matchScore: 58, skills: ["R", "SQL", "Statistics", "Tableau"], subScores: { technicalFit: 55, cultureFit: 62, experienceDepth: 56 } },
    { id: "c5-11", name: "Tom Reeves", matchScore: 50, skills: ["Python", "Excel", "Power BI"], subScores: { technicalFit: 48, cultureFit: 52, experienceDepth: 50 } },
    { id: "c5-12", name: "Carmen Ruiz", matchScore: 43, skills: ["MATLAB", "Statistics", "Signal Processing"], subScores: { technicalFit: 40, cultureFit: 46, experienceDepth: 42 } },
    { id: "c5-13", name: "Ivan Petrov", matchScore: 35, skills: ["Excel", "SQL", "Data Entry"], subScores: { technicalFit: 30, cultureFit: 40, experienceDepth: 35 } },
  ],

  // Job 6: Technical Writer
  "6": [
    { id: "c6-01", name: "Claire Whitfield", matchScore: 92, skills: ["Technical Writing", "API Documentation", "Markdown / MDX", "Git"], subScores: { technicalFit: 94, cultureFit: 90, experienceDepth: 90 } },
    { id: "c6-02", name: "Daniel Hoffman", matchScore: 88, skills: ["Technical Writing", "API Documentation", "Git", "Developer Experience"], subScores: { technicalFit: 90, cultureFit: 86, experienceDepth: 86 } },
    { id: "c6-03", name: "Nadia Khoury", matchScore: 83, skills: ["Technical Writing", "Markdown / MDX", "Git", "Video Tutorials"], subScores: { technicalFit: 85, cultureFit: 82, experienceDepth: 80 } },
    { id: "c6-04", name: "Robert Chen", matchScore: 78, skills: ["Technical Writing", "API Documentation", "Markdown / MDX"], subScores: { technicalFit: 80, cultureFit: 76, experienceDepth: 76 } },
    { id: "c6-05", name: "Eva Nilsson", matchScore: 72, skills: ["Technical Writing", "Git", "Confluence"], subScores: { technicalFit: 74, cultureFit: 70, experienceDepth: 70 } },
    { id: "c6-06", name: "Jake Morrison", matchScore: 66, skills: ["Copywriting", "Markdown / MDX", "Git"], subScores: { technicalFit: 68, cultureFit: 64, experienceDepth: 64 } },
    { id: "c6-07", name: "Amara Okafor", matchScore: 59, skills: ["Technical Writing", "JIRA", "Agile"], subScores: { technicalFit: 60, cultureFit: 58, experienceDepth: 57 } },
    { id: "c6-08", name: "Peter Lang", matchScore: 52, skills: ["Blogging", "SEO Writing", "WordPress"], subScores: { technicalFit: 50, cultureFit: 54, experienceDepth: 52 } },
    { id: "c6-09", name: "Simone Bianchi", matchScore: 45, skills: ["Content Strategy", "Editing", "Google Docs"], subScores: { technicalFit: 42, cultureFit: 48, experienceDepth: 44 } },
    { id: "c6-10", name: "Kevin Tran", matchScore: 37, skills: ["Journalism", "Proofreading", "AP Style"], subScores: { technicalFit: 34, cultureFit: 40, experienceDepth: 36 } },
  ],
};

/**
 * Get candidates for a job, sorted by matchScore descending.
 */
export function getCandidatesForJob(jobId: string): Candidate[] {
  const candidates = MOCK_CANDIDATES[jobId] || [];
  return [...candidates].sort((a, b) => b.matchScore - a.matchScore);
}
