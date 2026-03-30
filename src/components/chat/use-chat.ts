"use client";

import { useCallback, useRef } from "react";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useDataPanelStore } from "@/stores/data-panel-store";
import { useCandidateStore } from "@/stores/candidate-store";
import { MOCK_JOBS } from "@/data/mock-jobs";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { PROGRESS_STEPS } from "./chat-types";
import type { ChatMessage, ActionCardData, JDPreviewData } from "./chat-types";
import type { Job } from "@/data/mock-jobs";
import type { Candidate } from "@/data/mock-candidates";

// ── Search intent detection ─────────────────────────────────────────────────

/** Keywords that trigger the search progress sequence. */
const SEARCH_KEYWORDS = [
  "find",
  "search",
  "look for",
  "looking for",
  "source",
  "candidates",
  "engineers",
  "developers",
  "designers",
  "managers",
  "talent",
];

/** Check if user input contains a search-related keyword. */
function isSearchQuery(text: string): boolean {
  const lower = text.toLowerCase();
  // Exclude if it's a job creation intent (creation takes priority)
  if (isJobCreationIntent(lower)) return false;
  return SEARCH_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Job creation intent detection ───────────────────────────────────────────

/**
 * Keywords/patterns that indicate intent to CREATE a new job/position.
 * Multi-language: English + Chinese.
 */
const JOB_CREATION_PATTERNS_EN = [
  /\bhire\b/,
  /\bhiring\b/,
  /\brecruit\b/,
  /\brecruiting\b/,
  /\bneed\s+(a|an|to\s+hire)\b/,
  /\bneed\s+\d+/,
  /\bopening\s+for\b/,
  /\bopen\s+(a|an)\s+position\b/,
  /\bcreate\s+(a|an)?\s*(new\s+)?(job|position|role|opening)\b/,
  /\bnew\s+(job|position|role|opening|hire)\b/,
  /\bpost\s+(a|an)?\s*(job|position|role)\b/,
  /\blooking\s+to\s+hire\b/,
  /\bwe\s+need\b/,
  /\bi\s+need\b/,
  /\bwant\s+to\s+hire\b/,
  /\badd\s+(a|an)?\s*(new\s+)?(job|position|role)\b/,
];

const JOB_CREATION_PATTERNS_ZH = [
  /招/,
  /聘/,
  /需要.*人/,
  /需要.*员/,
  /需要.*工程师/,
  /需要.*经理/,
  /需要.*设计/,
  /需要.*销售/,
  /需要.*开发/,
  /招一个/,
  /招一名/,
  /招聘/,
  /新岗位/,
  /新职位/,
  /新开/,
  /开放.*职位/,
  /创建.*职位/,
  /创建.*岗位/,
];

/** Detect whether the user is asking to create a new job position. */
function isJobCreationIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    JOB_CREATION_PATTERNS_EN.some((p) => p.test(lower)) ||
    JOB_CREATION_PATTERNS_ZH.some((p) => p.test(text))
  );
}

// ── JD extraction from natural language ─────────────────────────────────────

/** Role/title keyword mappings */
const ROLE_KEYWORDS: Record<string, { title: string; department: string }> = {
  // Engineering
  "backend engineer": { title: "Backend Engineer", department: "Engineering" },
  "backend dev": { title: "Backend Engineer", department: "Engineering" },
  "frontend engineer": { title: "Frontend Engineer", department: "Engineering" },
  "frontend dev": { title: "Frontend Developer", department: "Engineering" },
  "full stack": { title: "Full Stack Engineer", department: "Engineering" },
  "fullstack": { title: "Full Stack Engineer", department: "Engineering" },
  "software engineer": { title: "Software Engineer", department: "Engineering" },
  "devops": { title: "DevOps Engineer", department: "Infrastructure" },
  "sre": { title: "Site Reliability Engineer", department: "Infrastructure" },
  "data engineer": { title: "Data Engineer", department: "Engineering" },
  "mobile dev": { title: "Mobile Developer", department: "Engineering" },
  "ios dev": { title: "iOS Developer", department: "Engineering" },
  "android dev": { title: "Android Developer", department: "Engineering" },
  "qa engineer": { title: "QA Engineer", department: "Engineering" },
  "test engineer": { title: "QA Engineer", department: "Engineering" },
  "工程师": { title: "Engineer", department: "Engineering" },
  "开发": { title: "Developer", department: "Engineering" },
  // Design
  "designer": { title: "Designer", department: "Design" },
  "product designer": { title: "Product Designer", department: "Design" },
  "ux designer": { title: "UX Designer", department: "Design" },
  "ui designer": { title: "UI Designer", department: "Design" },
  "设计师": { title: "Designer", department: "Design" },
  "设计": { title: "Designer", department: "Design" },
  // Data / AI
  "data scientist": { title: "Data Scientist", department: "AI/ML" },
  "ml engineer": { title: "ML Engineer", department: "AI/ML" },
  "ai engineer": { title: "AI Engineer", department: "AI/ML" },
  "数据": { title: "Data Scientist", department: "AI/ML" },
  // Management
  "product manager": { title: "Product Manager", department: "Product" },
  "project manager": { title: "Project Manager", department: "Operations" },
  "engineering manager": { title: "Engineering Manager", department: "Engineering" },
  "tech lead": { title: "Technical Lead", department: "Engineering" },
  "经理": { title: "Manager", department: "Operations" },
  // Sales & BD
  "sales": { title: "Sales Representative", department: "Sales" },
  "销售": { title: "Sales Representative", department: "Sales" },
  "business development": { title: "Business Development Manager", department: "Sales" },
  "bd": { title: "Business Development Manager", department: "Sales" },
  "account manager": { title: "Account Manager", department: "Sales" },
  "account executive": { title: "Account Executive", department: "Sales" },
  // Marketing
  "marketing": { title: "Marketing Manager", department: "Marketing" },
  "content": { title: "Content Manager", department: "Marketing" },
  "市场": { title: "Marketing Manager", department: "Marketing" },
  // HR
  "recruiter": { title: "Recruiter", department: "Human Resources" },
  "hr": { title: "HR Specialist", department: "Human Resources" },
  // Writer
  "technical writer": { title: "Technical Writer", department: "Documentation" },
  "writer": { title: "Technical Writer", department: "Documentation" },
};

/** Seniority keyword mappings */
const SENIORITY_KEYWORDS: Record<string, string> = {
  "junior": "Junior",
  "mid": "Mid-Level",
  "mid-level": "Mid-Level",
  "senior": "Senior",
  "lead": "Lead",
  "principal": "Principal",
  "staff": "Staff",
  "head": "Head",
  "director": "Director",
  "vp": "VP",
  "chief": "C-Level",
  "intern": "Intern",
  "初级": "Junior",
  "中级": "Mid-Level",
  "高级": "Senior",
  "资深": "Senior",
  "主管": "Lead",
  "总监": "Director",
};

/** Known tech skills for extraction */
const KNOWN_SKILLS = [
  // Programming languages
  "Go", "Golang", "Python", "Java", "JavaScript", "TypeScript", "Rust", "C++",
  "C#", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "Elixir", "R",
  // Frameworks
  "React", "Angular", "Vue", "Next.js", "Node.js", "Django", "Flask",
  "Spring", "Rails", "Laravel", "Express", "FastAPI",
  // Infrastructure
  "Kubernetes", "K8s", "Docker", "AWS", "GCP", "Azure", "Terraform",
  "CI/CD", "Jenkins", "GitHub Actions",
  // Databases
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB",
  "Cassandra", "Neo4j",
  // Data/ML
  "Machine Learning", "ML", "Deep Learning", "NLP", "LLM", "PyTorch",
  "TensorFlow", "Spark", "Hadoop", "Pandas", "SQL",
  // Other
  "GraphQL", "gRPC", "REST", "Microservices", "Distributed Systems",
  "Figma", "Design Systems", "Prototyping",
  // Industry
  "Energy Storage", "Solar PV", "Solar", "Renewable Energy", "Clean Energy",
  "Fintech", "Healthcare", "E-commerce", "SaaS", "B2B", "B2C",
  "储能", "光伏", "新能源", "太阳能",
];

/** Location extraction patterns */
const LOCATION_PATTERNS: Array<{
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => string;
}> = [
  { pattern: /\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i, extract: (m) => m[1] },
  { pattern: /\bat\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i, extract: (m) => m[1] },
  { pattern: /(?:located|based)\s+in\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i, extract: (m) => m[1] },
  { pattern: /([A-Z][a-zA-Z]+)\s+office/i, extract: (m) => m[1] },
  { pattern: /remote/i, extract: () => "Remote" },
  { pattern: /hybrid/i, extract: () => "Hybrid" },
  // Chinese location patterns
  { pattern: /在([\u4e00-\u9fff]+(?:代表处|办公室|分公司|总部)?)/, extract: (m) => m[1] },
  { pattern: /([\u4e00-\u9fff]*(?:墨西哥|美国|中国|日本|韩国|德国|英国|法国|新加坡|香港|台湾|北京|上海|深圳|广州|杭州|成都|武汉|南京|西安|柏林|伦敦|巴黎|东京|首尔|纽约|旧金山|洛杉矶|芝加哥|西雅图|波士顿|多伦多|温哥华|悉尼|墨尔本)[\u4e00-\u9fff]*)/, extract: (m) => m[1] },
];

/** Known city/country names for post-processing */
const KNOWN_LOCATIONS = [
  "Berlin", "London", "Paris", "Tokyo", "Seoul", "New York", "San Francisco",
  "Los Angeles", "Chicago", "Seattle", "Boston", "Toronto", "Vancouver",
  "Sydney", "Melbourne", "Singapore", "Hong Kong", "Beijing", "Shanghai",
  "Shenzhen", "Guangzhou", "Hangzhou", "Chengdu", "Mexico", "Mexico City",
  "Amsterdam", "Stockholm", "Dublin", "Zurich", "Munich", "Austin", "Denver",
  "Miami", "Atlanta", "Dallas", "Houston", "Portland", "Phoenix",
  "墨西哥", "美国", "中国", "德国", "英国", "法国", "新加坡",
  "北京", "上海", "深圳", "广州", "杭州", "成都",
];

/**
 * Extract structured JD fields from a natural language job description.
 * This is a client-side mock parser — will be replaced with real LLM later.
 */
function extractJDFromText(text: string): JDPreviewData {
  const lower = text.toLowerCase();

  // 1. Extract title & department
  let title = "New Position";
  let department = "General";
  for (const [keyword, info] of Object.entries(ROLE_KEYWORDS)) {
    if (lower.includes(keyword) || text.includes(keyword)) {
      title = info.title;
      department = info.department;
      break;
    }
  }

  // 2. Extract seniority
  let seniority = "Mid-Level";
  for (const [keyword, level] of Object.entries(SENIORITY_KEYWORDS)) {
    if (lower.includes(keyword) || text.includes(keyword)) {
      seniority = level;
      break;
    }
  }

  // Prepend seniority to title if not already there
  if (seniority !== "Mid-Level" && !title.toLowerCase().includes(seniority.toLowerCase())) {
    title = `${seniority} ${title}`;
  }

  // 3. Extract experience
  let experience = "3+ years";
  const expMatchEn = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)?/i);
  const expMatchZh = text.match(/(\d+)\s*年(?:以上)?(?:经验|工作经验)?/);
  if (expMatchEn) {
    experience = `${expMatchEn[1]}+ years`;
  } else if (expMatchZh) {
    experience = `${expMatchZh[1]}+ years`;
  }

  // 4. Extract location
  let location = "Remote";
  for (const locPattern of LOCATION_PATTERNS) {
    const match = text.match(locPattern.pattern);
    if (match) {
      const extracted = locPattern.extract(match);
      // Verify it looks like a real location (not a random capitalized word)
      if (
        KNOWN_LOCATIONS.some(
          (loc) =>
            extracted.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(extracted.toLowerCase()),
        ) ||
        extracted.length > 2
      ) {
        location = extracted;
        break;
      }
    }
  }
  // Fallback: check for known locations mentioned directly
  if (location === "Remote") {
    for (const loc of KNOWN_LOCATIONS) {
      if (lower.includes(loc.toLowerCase()) || text.includes(loc)) {
        location = loc;
        break;
      }
    }
  }

  // 5. Extract skills
  const skills: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    // For short skills (1-2 chars like "R", "C#"), use word boundary matching to avoid false positives
    const skillLower = skill.toLowerCase();
    const matched = skill.length <= 2
      ? new RegExp(`\\b${skill.replace(/[+#]/g, '\\$&')}\\b`, 'i').test(text)
      : (lower.includes(skillLower) || text.includes(skill));
    if (matched) {
      // Normalize K8s → Kubernetes
      if (skill === "K8s" && !skills.includes("Kubernetes")) {
        skills.push("Kubernetes");
      } else if (skill === "Golang" && !skills.includes("Go")) {
        skills.push("Go");
      } else if (skill !== "K8s" && skill !== "Golang" && !skills.includes(skill)) {
        skills.push(skill);
      }
    }
  }
  // If no skills detected, infer from role
  if (skills.length === 0) {
    if (department === "Engineering") {
      skills.push("Problem Solving", "Team Collaboration");
    } else if (department === "Sales") {
      skills.push("Communication", "Negotiation", "Client Management");
    } else if (department === "Design") {
      skills.push("Figma", "Prototyping", "User Research");
    } else {
      skills.push("Communication", "Team Collaboration");
    }
  }

  // 6. Generate description
  const description = generateDescription(title, location, experience, skills, department);

  return {
    title,
    department,
    location,
    experience,
    skills,
    description,
    seniority,
  };
}

/** Generate a concise job description from extracted fields. */
function generateDescription(
  title: string,
  location: string,
  experience: string,
  skills: string[],
  department: string,
): string {
  const skillsList = skills.slice(0, 4).join(", ");
  const locationPhrase = location === "Remote" ? "remote" : `based in ${location}`;

  return `We are looking for a ${title} (${locationPhrase}) with ${experience} of relevant experience. The ideal candidate has strong expertise in ${skillsList}. This role is part of the ${department} team and offers an opportunity to make significant impact in a fast-growing organization.`;
}

// ── Confirmation intent detection ────────────────────────────────────────────

/** Keywords that indicate user is confirming a suggested action (e.g., "yes, search candidates") */
const CONFIRMATION_PATTERNS = [
  /^(yes|yeah|yep|sure|ok|okay|go ahead|do it|please|let's go|let's do it|搜|搜索|好的|可以|行|好)$/i,
  /^(yes|yeah|sure|ok|okay),?\s/i,
  /search.*(candidate|people|talent)/i,
  /find.*(candidate|people|talent)/i,
  /^start\s+search/i,
];

function isConfirmationIntent(text: string): boolean {
  const trimmed = text.trim();
  return CONFIRMATION_PATTERNS.some((p) => p.test(trimmed));
}

// ── Apollo API integration ──────────────────────────────────────────────────

interface ApolloSearchParams {
  title?: string;
  skills?: string[];
  location?: string;
  seniority?: string;
  industry?: string;
}

interface ApolloCandidate {
  id: string;
  name: string;
  headline: string;
  currentCompany: string;
  currentTitle: string;
  location: string;
  linkedinUrl: string;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  skills: string[];
  source: "apollo";
}

interface ApolloSearchResponse {
  candidates: ApolloCandidate[];
  total: number;
  cached: boolean;
  cacheTimestamp?: string;
  error?: string;
}

/** Call our /api/search-candidates endpoint */
async function searchCandidatesAPI(
  params: ApolloSearchParams,
): Promise<ApolloSearchResponse> {
  const response = await fetch("/api/search-candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string }).error ||
        `Search API error: ${response.status}`,
    );
  }

  return (await response.json()) as ApolloSearchResponse;
}

// ── Scoring API integration (FLOW-3) ─────────────────────────────────────────

interface ScoreRequestJD {
  title: string;
  department: string;
  location: string;
  experience: string;
  seniority: string;
  skills: string[];
  description: string;
}

interface ScoredCandidateResponse {
  candidates: Candidate[];
  total: number;
  error?: string;
}

/**
 * Call the /api/score-candidates endpoint to score and rank candidates
 * using the deterministic scoring engine (server-side).
 */
async function scoreCandidatesAPI(
  apolloCandidates: ApolloCandidate[],
  jdData: JDPreviewData,
): Promise<ScoredCandidateResponse> {
  // Transform Apollo candidates into CandidateInput shape for the scoring engine
  const candidateInputs = apolloCandidates.map((ac, index) => ({
    id: ac.id || `apollo-${index}`,
    name: ac.name,
    headline: ac.headline,
    currentCompany: ac.currentCompany,
    currentTitle: ac.currentTitle,
    location: ac.location,
    linkedinUrl: ac.linkedinUrl,
    experience: ac.experience,
    education: ac.education,
    skills: ac.skills,
    source: ac.source,
  }));

  const jd: ScoreRequestJD = {
    title: jdData.title,
    department: jdData.department,
    location: jdData.location,
    experience: jdData.experience,
    seniority: jdData.seniority,
    skills: jdData.skills,
    description: jdData.description,
  };

  const response = await fetch("/api/score-candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidates: candidateInputs, jd }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string }).error ||
        `Scoring API error: ${response.status}`,
    );
  }

  return (await response.json()) as ScoredCandidateResponse;
}

// ── Search matching (existing logic) ────────────────────────────────────────

/**
 * Attempt to match user query to a specific mock job based on keywords.
 * Returns the best-matching job or defaults to job "1".
 */
function matchJobFromQuery(query: string): {
  jobId: string;
  jobTitle: string;
  totalCandidates: number;
  highScoreCount: number;
  avgScore: number;
} {
  const lower = query.toLowerCase();

  let bestJob = MOCK_JOBS[0];
  let bestScore = 0;

  for (const job of MOCK_JOBS) {
    let score = 0;
    const titleWords = job.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 2 && lower.includes(word)) {
        score += 2;
      }
    }
    if (job.jd) {
      for (const skill of job.jd.skills) {
        if (lower.includes(skill.name.toLowerCase())) {
          score += 3;
        }
      }
    }
    if (lower.includes(job.department.toLowerCase())) {
      score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestJob = job;
    }
  }

  const candidates = MOCK_CANDIDATES[bestJob.id] || [];
  const totalCandidates = candidates.length > 0 ? candidates.length : bestJob.resumes;
  const highScoreCount =
    candidates.length > 0
      ? candidates.filter((c) => c.matchScore >= 80).length
      : bestJob.highScore;
  const avgScore =
    candidates.length > 0
      ? Math.round(candidates.reduce((s, c) => s + c.matchScore, 0) / candidates.length)
      : 74;

  return {
    jobId: bestJob.id,
    jobTitle: bestJob.title,
    totalCandidates,
    highScoreCount,
    avgScore,
  };
}

/**
 * Extract a concise description of what the user is searching for,
 * used to generate the agent acknowledgement message.
 */
function buildAcknowledgement(query: string, jobTitle: string): string {
  const lower = query.toLowerCase();

  const fillers = [
    "find me",
    "find",
    "search for",
    "look for",
    "looking for",
    "i need",
    "i want",
    "can you find",
    "please",
    "help me find",
    "source",
    "recruit",
  ];
  let core = lower;
  for (const filler of fillers) {
    core = core.replace(filler, "");
  }
  core = core.replace(/^\s+/, "").replace(/\s+$/, "");

  if (core.length > 10) {
    const desc = core.charAt(0).toUpperCase() + core.slice(1);
    return `Got it! Searching for ${desc}. Matching against the ${jobTitle} pipeline...`;
  }

  return `Got it! Searching candidates for the ${jobTitle} role...`;
}

// ── Refinement intent detection (A-4) ───────────────────────────────────────

/** Patterns that indicate the user wants to refine/filter the current search results. */
const REFINEMENT_PATTERNS = [
  // Filter by attribute
  /\b(show|display|list)\s+(me\s+)?(only|just)\b/i,
  /\b(only|just)\s+(show|display|list|include|keep)\b/i,
  /\bfilter\s+(by|for|to|out)\b/i,
  /\bnarrow\s+(down|it|results|to)\b/i,
  /\bexclude\b/i,
  /\bremove\b.*\b(candidate|anyone|those|them)\b/i,
  /\bwithout\b/i,
  /\bwith\s+(at\s+least|more\s+than|over)/i,
  // Score thresholds
  /\b(minimum|min)\s+score\b/i,
  /\bscore\s*(above|over|>=?|higher\s+than|at\s+least)\s*\d+/i,
  /\babove\s+\d+/i,
  /\bbelow\s+\d+/i,
  /\bhigher\s+than\s+\d+/i,
  // Re-ranking
  /\b(re-?rank|resort|re-?sort|sort\s+by|rank\s+by|order\s+by)\b/i,
  // Top N
  /\b(top|best|highest)\s+\d+/i,
  /\bfirst\s+\d+/i,
  // Contextual refinement
  /\b(startup|enterprise|big\s+tech|faang|fortune\s+500)\s+(experience|background)\b/i,
  /\bcs\s+degree\b/i,
  /\bcomputer\s+science\b/i,
  /\bmaster'?s?\b/i,
  /\bphd\b/i,
  /\b(located|based)\s+in\b/i,
  // Chinese refinement patterns
  /只(看|显示|保留|要)/,
  /排除/,
  /筛选/,
  /重新排序/,
  /最低分/,
  /分数.*以上/,
  /前\d+名/,
];

/** Check if user input is a refinement of existing search results. */
function isRefinementIntent(text: string): boolean {
  return REFINEMENT_PATTERNS.some((p) => p.test(text));
}

/** Search context for tracking the active search state across follow-up messages. */
interface SearchContext {
  jobId: string;
  jdData: JDPreviewData;
  /** The full set of candidates from the original search (before any refinements) */
  originalCandidates: Candidate[];
  /** The currently displayed (possibly filtered/re-ranked) candidates */
  currentCandidates: Candidate[];
}

/**
 * Parse a refinement query and return a filter/sort function.
 * Returns a description of what was applied for the agent response.
 */
function parseRefinement(
  text: string,
  ctx: SearchContext,
): {
  filtered: Candidate[];
  description: string;
} {
  const lower = text.toLowerCase();
  let candidates = [...ctx.currentCandidates];
  const actions: string[] = [];

  // ── Score threshold filters ───────────────────────────────────────────
  const scoreAboveMatch = lower.match(/(?:score\s*(?:above|over|>=?|higher\s+than|at\s+least)|above|minimum\s+score|min\s+score)\s*(\d+)/);
  const scoreBelowMatch = lower.match(/(?:score\s*(?:below|under|<=?|lower\s+than)|below)\s*(\d+)/);

  if (scoreAboveMatch) {
    const threshold = parseInt(scoreAboveMatch[1], 10);
    candidates = candidates.filter((c) => c.matchScore >= threshold);
    actions.push(`score >= ${threshold}`);
  }
  if (scoreBelowMatch) {
    const threshold = parseInt(scoreBelowMatch[1], 10);
    candidates = candidates.filter((c) => c.matchScore < threshold);
    actions.push(`score < ${threshold}`);
  }

  // ── Top N ─────────────────────────────────────────────────────────────
  const topNMatch = lower.match(/(?:top|best|highest|first)\s+(\d+)/);
  const zhTopN = text.match(/前(\d+)名/);
  if (topNMatch || zhTopN) {
    const n = parseInt((topNMatch || zhTopN)![1], 10);
    candidates = candidates.slice(0, n);
    actions.push(`top ${n}`);
  }

  // ── Skill-based filters ───────────────────────────────────────────────
  // "with X experience/skill" or "who know X"
  const includeSkills: string[] = [];
  const excludeSkills: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    const skillLower = skill.toLowerCase();
    // Check for exclusion: "without X", "exclude X", "no X"
    const excludePattern = new RegExp(`(?:without|exclude|excluding|no|remove)\\s+.*?${skillLower.replace(/[+.*]/g, '\\$&')}`, 'i');
    const includePattern = new RegExp(`(?:with|know|have|has|using|who\\s+(?:know|have|use))\\s+.*?${skillLower.replace(/[+.*]/g, '\\$&')}`, 'i');

    if (excludePattern.test(lower)) {
      excludeSkills.push(skill);
    } else if (includePattern.test(lower) || (lower.includes(skillLower) && !excludePattern.test(lower) && isFilterContext(lower))) {
      includeSkills.push(skill);
    }
  }

  if (includeSkills.length > 0) {
    candidates = candidates.filter((c) =>
      includeSkills.some((skill) =>
        c.skills.some((cs) => cs.toLowerCase() === skill.toLowerCase()),
      ),
    );
    actions.push(`with skills: ${includeSkills.join(", ")}`);
  }
  if (excludeSkills.length > 0) {
    candidates = candidates.filter((c) =>
      !excludeSkills.some((skill) =>
        c.skills.some((cs) => cs.toLowerCase() === skill.toLowerCase()),
      ),
    );
    actions.push(`excluding skills: ${excludeSkills.join(", ")}`);
  }

  // ── Experience-based filters (startup, enterprise, etc.) ──────────────
  if (/startup/i.test(lower) && (isFilterContext(lower) || /experience|background/i.test(lower))) {
    candidates = candidates.filter((c) =>
      c.experience?.some((exp) =>
        /startup|seed|series\s+[a-c]|early[- ]stage|incubat/i.test(
          `${exp.company} ${exp.description}`,
        ),
      ) ?? false,
    );
    actions.push("startup experience");
  }

  if (/(?:big\s*tech|faang|fortune\s*500|enterprise)/i.test(lower) && (isFilterContext(lower) || /experience|background/i.test(lower))) {
    const bigTechNames = /google|meta|facebook|amazon|apple|microsoft|netflix|uber|airbnb|stripe|salesforce|oracle|ibm|intel|cisco/i;
    candidates = candidates.filter((c) =>
      c.experience?.some((exp) => bigTechNames.test(exp.company)) ?? false,
    );
    actions.push("big tech experience");
  }

  // ── Education filters ─────────────────────────────────────────────────
  if (/\bcs\s+degree\b|computer\s+science/i.test(lower)) {
    candidates = candidates.filter((c) =>
      c.education?.some((edu) =>
        /computer\s+science|cs\b|software|computing/i.test(edu.degree),
      ) ?? false,
    );
    actions.push("CS degree");
  }
  if (/\bmaster'?s?\s+(degree)?\b/i.test(lower) && isFilterContext(lower)) {
    candidates = candidates.filter((c) =>
      c.education?.some((edu) =>
        /master|m\.?s\.?\b|msc\b|m\.?eng/i.test(edu.degree),
      ) ?? false,
    );
    actions.push("Master's degree");
  }
  if (/\bphd\b/i.test(lower) && isFilterContext(lower)) {
    candidates = candidates.filter((c) =>
      c.education?.some((edu) => /ph\.?d|doctor/i.test(edu.degree)) ?? false,
    );
    actions.push("PhD");
  }

  // ── Location filters ──────────────────────────────────────────────────
  const locationMatch = lower.match(/(?:located|based)\s+in\s+(\w+(?:\s+\w+)?)/i);
  if (locationMatch) {
    const loc = locationMatch[1].toLowerCase();
    candidates = candidates.filter((c) =>
      c.location?.toLowerCase().includes(loc) ?? false,
    );
    actions.push(`located in ${locationMatch[1]}`);
  }

  // ── Re-rank / sort-by ─────────────────────────────────────────────────
  if (/(?:re-?rank|resort|re-?sort|sort|rank|order)\s*(?:by)?\s*(?:technical|tech)/i.test(lower)) {
    candidates.sort((a, b) => (b.subScores?.technicalFit ?? 0) - (a.subScores?.technicalFit ?? 0));
    actions.push("sorted by Technical Fit");
  } else if (/(?:re-?rank|resort|re-?sort|sort|rank|order)\s*(?:by)?\s*(?:culture|cultural)/i.test(lower)) {
    candidates.sort((a, b) => (b.subScores?.cultureFit ?? 0) - (a.subScores?.cultureFit ?? 0));
    actions.push("sorted by Culture Fit");
  } else if (/(?:re-?rank|resort|re-?sort|sort|rank|order)\s*(?:by)?\s*(?:experience|exp)/i.test(lower)) {
    candidates.sort((a, b) => (b.subScores?.experienceDepth ?? 0) - (a.subScores?.experienceDepth ?? 0));
    actions.push("sorted by Experience Depth");
  }

  // ── Build description ─────────────────────────────────────────────────
  let description: string;
  if (actions.length > 0) {
    description = `Refined results: ${actions.join(", ")}. ${candidates.length} candidates remain from the original ${ctx.currentCandidates.length}.`;
  } else {
    // Generic fallback: try to extract a keyword-based filter
    const keywords = extractRefinementKeywords(lower);
    if (keywords.length > 0) {
      candidates = candidates.filter((c) => {
        const blob = [
          c.name, ...c.skills,
          c.headline, c.currentCompany, c.currentTitle, c.location,
          ...(c.experience?.map((e) => `${e.company} ${e.role} ${e.description}`) ?? []),
          ...(c.education?.map((e) => `${e.institution} ${e.degree}`) ?? []),
        ].filter(Boolean).join(" ").toLowerCase();
        return keywords.some((kw) => blob.includes(kw));
      });
      description = `Filtered by: ${keywords.join(", ")}. ${candidates.length} candidates match from the original ${ctx.currentCandidates.length}.`;
    } else {
      description = `Applied your refinement. ${candidates.length} candidates shown.`;
    }
  }

  return { filtered: candidates, description };
}

/** Check if the context suggests this is a filter request (not just mentioning a skill). */
function isFilterContext(text: string): boolean {
  return /(?:show|only|just|filter|with|who|has|have|exclude|without|keep|include|display|list|narrow)/i.test(text);
}

/** Extract meaningful keywords from a refinement query for fallback text-search. */
function extractRefinementKeywords(text: string): string[] {
  // Remove common stop words and refinement verbs
  const stopWords = new Set([
    "show", "me", "only", "just", "the", "a", "an", "and", "or", "with",
    "without", "who", "that", "have", "has", "are", "is", "in", "at",
    "from", "to", "for", "of", "by", "on", "can", "do", "does", "their",
    "filter", "exclude", "include", "keep", "remove", "display", "list",
    "candidates", "candidate", "people", "results", "those", "them",
    "please", "re-rank", "rerank", "sort", "rank", "order",
  ]);
  const words = text.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  return words.length > 0 ? words : [];
}

// ── Main hook ───────────────────────────────────────────────────────────────

/**
 * Shared chat logic hook — used by both ChatMainArea and MobileChatView.
 * Messages are stored in the Zustand sidebar store so they survive
 * mobile tab switches (MobileChatView unmount/remount).
 *
 * Handles three flows:
 * 1. Search flow: detect search intent → progress ticker → action card
 * 2. Job creation flow (FLOW-1): detect hire intent → extract JD → preview card
 * 3. Refinement flow (A-4): detect follow-up refinement → filter/re-rank → updated action card
 */
export function useChat() {
  const { chatMessages, addChatMessage, updateChatMessage } =
    useSidebarStore();
  const addJob = useDashboardStore((s) => s.addJob);
  const dashboardJobs = useDashboardStore((s) => s.jobs);
  const selectJob = useDataPanelStore((s) => s.selectJob);
  const setDataPanelOpen = useDataPanelStore((s) => s.setDataPanelOpen);
  const setCandidates = useCandidateStore((s) => s.setCandidates);
  const getCandidates = useCandidateStore((s) => s.getCandidates);
  const setLoadingCandidates = useCandidateStore((s) => s.setLoading);
  const setCandidateError = useCandidateStore((s) => s.setError);
  const progressTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Tracks the most recently created job (from FLOW-1) so we can auto-search for it */
  const lastCreatedJobRef = useRef<{ jobId: string; jdData: JDPreviewData } | null>(null);
  /** Tracks the active search context for follow-up refinements (A-4) */
  const searchContextRef = useRef<SearchContext | null>(null);

  /** Generate a unique job ID based on timestamp */
  const generateJobId = useCallback(() => {
    return `job-${Date.now()}`;
  }, []);

  /** Handle confirming a JD preview → create the job */
  const handleJDConfirm = useCallback(
    (jdData: JDPreviewData) => {
      const jobId = generateJobId();

      // Create the new Job object
      const newJob: Job = {
        id: jobId,
        title: jdData.title,
        department: jdData.department,
        status: "Draft",
        resumes: 0,
        highScore: 0,
        interviews: 0,
        jd: {
          seniority: jdData.seniority,
          summary: jdData.description,
          skills: jdData.skills.map((s) => ({
            name: s,
            category: "required" as const,
          })),
        },
      };

      // Add to dashboard store
      addJob(newJob);

      // Track this job so user can confirm search next
      lastCreatedJobRef.current = { jobId, jdData };

      // Open data panel and switch to jobs tab to show the new job
      setDataPanelOpen(true);

      // Add confirmation message
      const confirmMsg: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: "agent",
        content: `Job created: ${jdData.title} (${jdData.location}) — Status: Draft. The job is now visible in the Jobs panel.`,
        timestamp: new Date(),
      };
      addChatMessage(confirmMsg);

      // Follow-up: ask about candidate search
      setTimeout(() => {
        const followUpMsg: ChatMessage = {
          id: `followup-${Date.now()}`,
          role: "agent",
          content: `Want me to start searching for candidates for this ${jdData.title} role? I'll search Apollo.io for real candidate profiles.`,
          timestamp: new Date(),
        };
        addChatMessage(followUpMsg);
      }, 800);
    },
    [addJob, setDataPanelOpen, addChatMessage, generateJobId],
  );

  /** Handle modifying a JD preview (no-op for state — card manages its own editing) */
  const handleJDModify = useCallback((_jdData: JDPreviewData) => {
    // The JDPreviewCard handles its own editing state internally.
    // This callback is available for future use (e.g., analytics, logging).
  }, []);

  /** Find a recently created (user) job that matches the search query */
  const findRecentUserJob = useCallback(
    (query: string): Job | null => {
      const lower = query.toLowerCase();
      // Only check user-created jobs (IDs starting with "job-")
      for (const job of dashboardJobs) {
        if (!job.id.startsWith("job-")) continue;
        const titleWords = job.title.toLowerCase().split(/\s+/);
        const matchCount = titleWords.filter(
          (w) => w.length > 2 && lower.includes(w),
        ).length;
        if (matchCount > 0) return job;
      }
      return null;
    },
    [dashboardJobs],
  );

  /**
   * FLOW-2: Execute an Apollo.io candidate search for a given job.
   * Shows progress in chat, calls the API, stores results, shows action card.
   */
  const executeApolloSearch = useCallback(
    (jobId: string, jdData: JDPreviewData) => {
      // 1. Acknowledgement
      const ackMessage: ChatMessage = {
        id: `ack-search-${Date.now()}`,
        role: "agent",
        content: `Searching Apollo.io for ${jdData.title} candidates${jdData.location !== "Remote" ? ` in ${jdData.location}` : ""}...`,
        timestamp: new Date(),
      };
      addChatMessage(ackMessage);

      // 2. Start progress
      const progressId = `progress-apollo-${Date.now() + 1}`;

      progressTimers.current.forEach(clearTimeout);
      progressTimers.current = [];

      const progressTimer = setTimeout(() => {
        const progressMessage: ChatMessage = {
          id: progressId,
          role: "agent",
          content: "",
          timestamp: new Date(),
          type: "progress",
          progress: {
            currentStep: 0,
            statusText: "Searching Apollo.io talent pool...",
            isComplete: false,
          },
        };
        addChatMessage(progressMessage);

        // Mark loading in candidate store
        setLoadingCandidates(jobId, true);
        setCandidateError(jobId, null);

        // Advance to step 1 after a beat
        const step1Timer = setTimeout(() => {
          updateChatMessage(progressId, {
            progress: {
              currentStep: 1,
              statusText: "Retrieving candidate profiles...",
              isComplete: false,
            },
          });
        }, 1200);
        progressTimers.current.push(step1Timer);

        // 3. Call Apollo API
        const apiParams: ApolloSearchParams = {
          title: jdData.title.replace(/^(Junior|Mid-Level|Senior|Lead|Principal|Staff|Head|Director|VP|C-Level|Intern)\s+/i, ""),
          skills: jdData.skills,
          location: jdData.location !== "Remote" ? jdData.location : undefined,
          seniority: jdData.seniority,
        };

        searchCandidatesAPI(apiParams)
          .then((response) => {
            // Step 2: Scoring — call the real scoring engine API
            updateChatMessage(progressId, {
              progress: {
                currentStep: 2,
                statusText: `Scoring ${response.total} candidates against JD...`,
                isComplete: false,
              },
            });

            // FLOW-3: Call the scoring engine API for deterministic AI scoring
            scoreCandidatesAPI(response.candidates, jdData)
              .then((scoreResponse) => {
                const candidates = scoreResponse.candidates;

                // Store scored candidates in candidate store
                setCandidates(jobId, candidates);
                setLoadingCandidates(jobId, false);

                // Save search context for follow-up refinements (A-4)
                searchContextRef.current = {
                  jobId,
                  jdData,
                  originalCandidates: [...candidates],
                  currentCandidates: [...candidates],
                };

                // Complete progress
                updateChatMessage(progressId, {
                  progress: {
                    currentStep: 3,
                    statusText: `Complete: ${candidates.length} candidates scored & ranked`,
                    isComplete: true,
                  },
                });

                // Open pipeline panel for this job
                selectJob(jobId);
                setDataPanelOpen(true);

                // 4. Action card with real scoring data
                const cardTimer = setTimeout(() => {
                  const highScoreCount = candidates.filter(
                    (c) => c.matchScore >= 80,
                  ).length;
                  const avgScore =
                    candidates.length > 0
                      ? Math.round(
                          candidates.reduce((s, c) => s + c.matchScore, 0) /
                            candidates.length,
                        )
                      : 0;

                  const actionCardData: ActionCardData = {
                    title: "Search Complete",
                    summary: `Found ${candidates.length} candidates from Apollo.io.${response.cached ? " (cached)" : ""} ${highScoreCount} scored above 80% for ${jdData.title}.`,
                    metrics: [
                      { label: "Total", value: candidates.length },
                      { label: "High Score", value: highScoreCount },
                      { label: "Avg Score", value: avgScore },
                    ],
                    actionLabel: "View Pipeline",
                    actionHref: `/job/${jobId}/pipeline`,
                  };
                  const actionCardMessage: ChatMessage = {
                    id: `action-card-apollo-${Date.now()}`,
                    role: "agent",
                    content: "",
                    timestamp: new Date(),
                    type: "action-card",
                    actionCard: actionCardData,
                  };
                  addChatMessage(actionCardMessage);
                }, 600);
                progressTimers.current.push(cardTimer);
              })
              .catch((scoreError) => {
                // Scoring failed — fall back to unsorted candidates without AI evaluation
                console.error("[FLOW-3] Scoring error, using raw candidates:", scoreError);
                const fallbackCandidates: Candidate[] = response.candidates.map((ac, idx) => ({
                  id: ac.id || `apollo-${idx}`,
                  name: ac.name,
                  matchScore: 50,
                  skills: ac.skills.length > 0 ? ac.skills : jdData.skills.slice(0, 3),
                  subScores: { technicalFit: 50, cultureFit: 50, experienceDepth: 50 },
                  pipelineStatus: "New" as const,
                  experience: ac.experience,
                  education: ac.education,
                  certifications: [],
                }));

                setCandidates(jobId, fallbackCandidates);
                setLoadingCandidates(jobId, false);

                // Save search context for follow-up refinements (A-4)
                searchContextRef.current = {
                  jobId,
                  jdData,
                  originalCandidates: [...fallbackCandidates],
                  currentCandidates: [...fallbackCandidates],
                };

                updateChatMessage(progressId, {
                  progress: {
                    currentStep: 3,
                    statusText: `Complete: ${fallbackCandidates.length} candidates (scoring unavailable)`,
                    isComplete: true,
                  },
                });

                selectJob(jobId);
                setDataPanelOpen(true);

                const cardTimer = setTimeout(() => {
                  const actionCardData: ActionCardData = {
                    title: "Search Complete",
                    summary: `Found ${fallbackCandidates.length} candidates from Apollo.io. Scoring engine was unavailable — candidates shown without AI ranking.`,
                    metrics: [
                      { label: "Total", value: fallbackCandidates.length },
                      { label: "Scored", value: 0 },
                    ],
                    actionLabel: "View Pipeline",
                    actionHref: `/job/${jobId}/pipeline`,
                  };
                  const actionCardMessage: ChatMessage = {
                    id: `action-card-apollo-${Date.now()}`,
                    role: "agent",
                    content: "",
                    timestamp: new Date(),
                    type: "action-card",
                    actionCard: actionCardData,
                  };
                  addChatMessage(actionCardMessage);
                }, 600);
                progressTimers.current.push(cardTimer);
              });
          })
          .catch((error) => {
            setLoadingCandidates(jobId, false);
            setCandidateError(
              jobId,
              error instanceof Error ? error.message : "Search failed",
            );

            updateChatMessage(progressId, {
              progress: {
                currentStep: 3,
                statusText: "Search failed",
                isComplete: true,
              },
            });

            const errorMsg: ChatMessage = {
              id: `error-${Date.now()}`,
              role: "agent",
              content: `Search encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. You can try again or check if the API key is configured.`,
              timestamp: new Date(),
            };
            addChatMessage(errorMsg);
          });
      }, 400);
      progressTimers.current.push(progressTimer);
    },
    [
      addChatMessage,
      updateChatMessage,
      setCandidates,
      setLoadingCandidates,
      setCandidateError,
      selectJob,
      setDataPanelOpen,
    ],
  );

  const handleSend = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      addChatMessage(userMessage);

      // ── FLOW-1: Job creation intent ───────────────────────────────────
      if (isJobCreationIntent(trimmed)) {
        // 1. Agent acknowledges
        const ackMessage: ChatMessage = {
          id: `ack-${Date.now()}`,
          role: "agent",
          content:
            "Got it! Let me extract the job details from your description...",
          timestamp: new Date(),
        };
        addChatMessage(ackMessage);

        // 2. Show a brief progress state, then present JD preview
        const progressId = `progress-jd-${Date.now() + 1}`;
        const progressTimer = setTimeout(() => {
          const progressMessage: ChatMessage = {
            id: progressId,
            role: "agent",
            content: "",
            timestamp: new Date(),
            type: "progress",
            progress: {
              currentStep: 0,
              statusText: "Analyzing job requirements...",
              isComplete: false,
            },
          };
          addChatMessage(progressMessage);
        }, 300);

        progressTimers.current.forEach(clearTimeout);
        progressTimers.current = [progressTimer];

        // Advance to step 1 (extracting)
        const step1Timer = setTimeout(() => {
          updateChatMessage(progressId, {
            progress: {
              currentStep: 1,
              statusText: "Extracting structured fields...",
              isComplete: false,
            },
          });
        }, 1200);
        progressTimers.current.push(step1Timer);

        // Complete and show JD preview
        const completeTimer = setTimeout(() => {
          updateChatMessage(progressId, {
            progress: {
              currentStep: 3,
              statusText: "JD extraction complete",
              isComplete: true,
            },
          });

          // Extract JD from user input
          const jdData = extractJDFromText(trimmed);

          // Add JD preview card message
          setTimeout(() => {
            const jdPreviewMessage: ChatMessage = {
              id: `jd-preview-${Date.now()}`,
              role: "agent",
              content: "",
              timestamp: new Date(),
              type: "jd-preview",
              jdPreview: jdData,
            };
            addChatMessage(jdPreviewMessage);
          }, 400);
        }, 2500);
        progressTimers.current.push(completeTimer);

        return;
      }

      // ── A-4: Refinement follow-up on existing search results ──────────
      if (searchContextRef.current && isRefinementIntent(trimmed)) {
        const ctx = searchContextRef.current;

        // Agent acknowledges refinement
        const ackMessage: ChatMessage = {
          id: `ack-refine-${Date.now()}`,
          role: "agent",
          content: "Refining results based on your criteria...",
          timestamp: new Date(),
        };
        addChatMessage(ackMessage);

        // Apply refinement after a brief delay for natural feel
        setTimeout(() => {
          const { filtered, description } = parseRefinement(trimmed, ctx);

          // Update candidates in the store
          setCandidates(ctx.jobId, filtered);

          // Update current candidates in context (keep original for reset)
          searchContextRef.current = {
            ...ctx,
            currentCandidates: filtered,
          };

          // Refresh pipeline panel
          selectJob(ctx.jobId);
          setDataPanelOpen(true);

          // Agent response with summary
          const summaryMsg: ChatMessage = {
            id: `refine-summary-${Date.now()}`,
            role: "agent",
            content: description,
            timestamp: new Date(),
          };
          addChatMessage(summaryMsg);

          // Show updated action card with new metrics
          setTimeout(() => {
            const highScoreCount = filtered.filter((c) => c.matchScore >= 80).length;
            const avgScore =
              filtered.length > 0
                ? Math.round(filtered.reduce((s, c) => s + c.matchScore, 0) / filtered.length)
                : 0;

            const actionCardData: ActionCardData = {
              title: "Refined Results",
              summary: `${filtered.length} candidates after refinement. ${highScoreCount} scored above 80% for ${ctx.jdData.title}.`,
              metrics: [
                { label: "Showing", value: filtered.length },
                { label: "Original", value: ctx.originalCandidates.length },
                { label: "High Score", value: highScoreCount },
                { label: "Avg Score", value: avgScore },
              ],
              actionLabel: "View Pipeline",
              actionHref: `/job/${ctx.jobId}/pipeline`,
            };
            const actionCardMessage: ChatMessage = {
              id: `action-card-refine-${Date.now()}`,
              role: "agent",
              content: "",
              timestamp: new Date(),
              type: "action-card",
              actionCard: actionCardData,
            };
            addChatMessage(actionCardMessage);
          }, 400);
        }, 500);

        return;
      }

      // ── A-4: Reset refinement ("show all", "reset", "start over") ─────
      if (searchContextRef.current && /\b(show\s+all|reset|start\s+over|clear\s+filter|undo|restore|全部|重置)\b/i.test(trimmed)) {
        const ctx = searchContextRef.current;

        // Restore original candidates
        setCandidates(ctx.jobId, ctx.originalCandidates);
        searchContextRef.current = {
          ...ctx,
          currentCandidates: [...ctx.originalCandidates],
        };

        selectJob(ctx.jobId);
        setDataPanelOpen(true);

        const resetMsg: ChatMessage = {
          id: `reset-${Date.now()}`,
          role: "agent",
          content: `Filters cleared. Showing all ${ctx.originalCandidates.length} candidates for ${ctx.jdData.title}.`,
          timestamp: new Date(),
        };
        addChatMessage(resetMsg);
        return;
      }

      // ── FLOW-2: Confirmation after job creation → Apollo search ────────
      if (isConfirmationIntent(trimmed) && lastCreatedJobRef.current) {
        const { jobId, jdData } = lastCreatedJobRef.current;
        lastCreatedJobRef.current = null; // Consume the ref

        executeApolloSearch(jobId, jdData);
        return;
      }

      // ── Existing: Search flow ─────────────────────────────────────────
      if (isSearchQuery(trimmed)) {
        // Check if this search can target a recently created job (from FLOW-1)
        // or find the best matching mock job
        const lastCreated = lastCreatedJobRef.current;
        if (lastCreated) {
          // User typed a search query with a pending job — use that job
          lastCreatedJobRef.current = null;
          executeApolloSearch(lastCreated.jobId, lastCreated.jdData);
          return;
        }

        // Try to find a matching job from the dashboard (includes user-created jobs)
        const userCreatedJob = findRecentUserJob(trimmed);
        if (userCreatedJob) {
          const jdData: JDPreviewData = {
            title: userCreatedJob.title,
            department: userCreatedJob.department,
            location: "Remote",
            experience: "3+ years",
            skills: userCreatedJob.jd?.skills.map((s) => s.name) || [],
            description: userCreatedJob.jd?.summary || "",
            seniority: userCreatedJob.jd?.seniority || "Mid-Level",
          };
          executeApolloSearch(userCreatedJob.id, jdData);
          return;
        }

        // Fallback to existing mock job matching
        const match = matchJobFromQuery(trimmed);

        const ackMessage: ChatMessage = {
          id: `ack-${Date.now()}`,
          role: "agent",
          content: buildAcknowledgement(trimmed, match.jobTitle),
          timestamp: new Date(),
        };
        addChatMessage(ackMessage);

        const progressId = `progress-${Date.now() + 1}`;
        const progressTimer = setTimeout(() => {
          const progressMessage: ChatMessage = {
            id: progressId,
            role: "agent",
            content: "",
            timestamp: new Date(),
            type: "progress",
            progress: {
              currentStep: 0,
              statusText: PROGRESS_STEPS[0].label,
              isComplete: false,
            },
          };
          addChatMessage(progressMessage);
        }, 400);

        progressTimers.current.forEach(clearTimeout);
        progressTimers.current = [progressTimer];

        const stepDelays = [1900, 3400, 4900];

        stepDelays.forEach((delay, i) => {
          const stepIndex = i + 1;
          const timer = setTimeout(() => {
            const isLast = stepIndex === PROGRESS_STEPS.length - 1;
            updateChatMessage(progressId, {
              progress: {
                currentStep: stepIndex,
                statusText: PROGRESS_STEPS[stepIndex].label,
                isComplete: isLast,
              },
            });

            if (isLast) {
              // Save search context for follow-up refinements (A-4)
              const mockCandidates = MOCK_CANDIDATES[match.jobId] || [];
              const matchedJob = MOCK_JOBS.find((j) => j.id === match.jobId);
              if (mockCandidates.length > 0 && matchedJob) {
                searchContextRef.current = {
                  jobId: match.jobId,
                  jdData: {
                    title: matchedJob.title,
                    department: matchedJob.department,
                    location: "Remote",
                    experience: "3+ years",
                    skills: matchedJob.jd?.skills.map((s) => s.name) || [],
                    description: matchedJob.jd?.summary || "",
                    seniority: matchedJob.jd?.seniority || "Mid-Level",
                  },
                  originalCandidates: [...mockCandidates],
                  currentCandidates: [...mockCandidates],
                };
              }

              const actionTimer = setTimeout(() => {
                const actionCardData: ActionCardData = {
                  title: "Search Complete",
                  summary: `Found ${match.totalCandidates} candidates. ${match.highScoreCount} scored above 85% for ${match.jobTitle}.`,
                  metrics: [
                    { label: "Total", value: match.totalCandidates },
                    { label: "High Score", value: match.highScoreCount },
                    { label: "Avg Score", value: match.avgScore },
                  ],
                  actionLabel: "View Ranking",
                  actionHref: `/job/${match.jobId}/pipeline`,
                };
                const actionCardMessage: ChatMessage = {
                  id: `action-card-${Date.now()}`,
                  role: "agent",
                  content: "",
                  timestamp: new Date(),
                  type: "action-card",
                  actionCard: actionCardData,
                };
                addChatMessage(actionCardMessage);
              }, 600);
              progressTimers.current.push(actionTimer);
            }
          }, delay);
          progressTimers.current.push(timer);
        });
      } else {
        // Non-search, non-job-creation: standard simulated agent response
        setTimeout(() => {
          const agentMessage: ChatMessage = {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: `Processing your request: "${trimmed}". Full agent integration will be available in a future update.`,
            timestamp: new Date(),
          };
          addChatMessage(agentMessage);
        }, 600);
      }
    },
    [addChatMessage, updateChatMessage, executeApolloSearch, findRecentUserJob, setCandidates, selectJob, setDataPanelOpen],
  );

  return { messages: chatMessages, handleSend, handleJDConfirm, handleJDModify };
}
