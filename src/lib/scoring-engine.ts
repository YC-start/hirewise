/**
 * Deterministic Scoring Engine for HireWise
 *
 * Scores candidates against a JD using four weighted dimensions:
 *   - Technical Fit   (40%)  — skill overlap between candidate and JD
 *   - Experience Depth (30%)  — years of experience + industry relevance
 *   - Culture Fit     (15%)  — location match + company-type alignment
 *   - Leadership      (15%)  — title/seniority alignment
 *
 * All scoring is deterministic: same inputs → same outputs (no Math.random).
 *
 * Design: this module is a pure function layer with no side effects.
 * To swap in LLM-based scoring later, replace `scoreCandidate()` internals
 * with an AI SDK call that returns the same ScoredCandidate shape.
 */

// ── Input types ──────────────────────────────────────────────────────────────

export interface CandidateInput {
  id: string;
  name: string;
  headline?: string;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  linkedinUrl?: string;
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
  source?: string;
}

export interface JDInput {
  title: string;
  department: string;
  location: string;
  experience: string; // e.g. "3+ years"
  seniority: string; // e.g. "Senior", "Lead"
  skills: string[];
  description: string;
}

// ── Output types ─────────────────────────────────────────────────────────────

export interface DimensionScore {
  dimension: string;
  score: number; // 0-100
  reasoning: string;
}

export interface ScoredCandidate {
  id: string;
  name: string;
  matchScore: number; // 0-100 overall
  skills: string[];
  subScores: {
    technicalFit: number;
    cultureFit: number;
    experienceDepth: number;
  };
  pipelineStatus: "New";
  experience: CandidateInput["experience"];
  education: CandidateInput["education"];
  certifications: string[];
  aiEvaluation: {
    overallReasoning: string;
    dimensionScores: DimensionScore[];
    skillGaps: string[];
    strengths: string[];
  };
  // Pass-through fields from Apollo
  headline?: string;
  currentCompany?: string;
  currentTitle?: string;
  location?: string;
  linkedinUrl?: string;
}

// ── Dimension weights ────────────────────────────────────────────────────────

const WEIGHTS = {
  technicalFit: 0.4,
  experienceDepth: 0.3,
  cultureFit: 0.15,
  leadership: 0.15,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a string for comparison (lowercase, trim, collapse whitespace). */
function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Simple deterministic hash of a string → 0..1 float for tie-breaking. */
function deterministicTieBreaker(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

/** Parse "N+ years" → number. */
function parseYearsRequired(exp: string): number {
  const m = exp.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 3;
}

/** Estimate years of experience from employment history periods. */
function estimateYearsOfExperience(
  experience: CandidateInput["experience"],
): number {
  if (experience.length === 0) return 0;

  let totalYears = 0;
  for (const entry of experience) {
    const match = entry.period.match(/(\d{4})\s*[—–-]\s*(\d{4}|Present)/i);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2].toLowerCase() === "present" ? 2026 : parseInt(match[2], 10);
      totalYears += Math.max(0, end - start);
    }
  }
  return totalYears;
}

/** Check if two skill names are equivalent (handles common aliases). */
function skillsMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;

  // Alias map (bidirectional)
  const aliases: Record<string, string[]> = {
    go: ["golang"],
    golang: ["go"],
    k8s: ["kubernetes"],
    kubernetes: ["k8s"],
    js: ["javascript"],
    javascript: ["js"],
    ts: ["typescript"],
    typescript: ["ts"],
    "node.js": ["node", "nodejs"],
    node: ["node.js", "nodejs"],
    nodejs: ["node.js", "node"],
    "next.js": ["nextjs", "next"],
    nextjs: ["next.js", "next"],
    postgres: ["postgresql"],
    postgresql: ["postgres"],
    ml: ["machine learning"],
    "machine learning": ["ml"],
    "ci/cd": ["cicd", "ci cd"],
    react: ["reactjs", "react.js"],
    reactjs: ["react", "react.js"],
    "react.js": ["react", "reactjs"],
    vue: ["vuejs", "vue.js"],
    angular: ["angularjs"],
  };

  const aliasesA = aliases[na] || [];
  return aliasesA.includes(nb);
}

// ── Seniority hierarchy (higher index = more senior) ─────────────────────────

const SENIORITY_LEVELS = [
  "intern",
  "junior",
  "mid-level",
  "mid",
  "senior",
  "staff",
  "lead",
  "principal",
  "head",
  "director",
  "vp",
  "c-level",
];

function seniorityIndex(level: string): number {
  const idx = SENIORITY_LEVELS.indexOf(norm(level));
  return idx >= 0 ? idx : 4; // default to senior-ish
}

/** Infer seniority from a job title string. */
function inferSeniority(title: string): string {
  const t = norm(title);
  if (t.includes("intern")) return "Intern";
  if (t.includes("junior") || t.includes("jr")) return "Junior";
  if (t.includes("principal")) return "Principal";
  if (t.includes("staff")) return "Staff";
  if (t.includes("lead") || t.includes("team lead")) return "Lead";
  if (t.includes("senior") || t.includes("sr")) return "Senior";
  if (t.includes("head of") || t.includes("head,")) return "Head";
  if (t.includes("director")) return "Director";
  if (t.includes("vp") || t.includes("vice president")) return "VP";
  if (t.includes("chief") || t.includes("cto") || t.includes("ceo")) return "C-Level";
  if (t.includes("manager")) return "Lead";
  return "Mid-Level";
}

// ── Dimension scorers ────────────────────────────────────────────────────────

/**
 * Technical Fit (40%): How well candidate skills match JD required skills.
 */
function scoreTechnicalFit(
  candidate: CandidateInput,
  jd: JDInput,
): { score: number; reasoning: string; matchedSkills: string[]; missingSkills: string[] } {
  const jdSkills = jd.skills;
  if (jdSkills.length === 0) {
    return {
      score: 60,
      reasoning: "No specific skills listed in JD; moderate default score assigned.",
      matchedSkills: [],
      missingSkills: [],
    };
  }

  // Build candidate skill corpus: explicit skills + text from experience descriptions + title
  const candidateSkillSet = new Set(candidate.skills.map(norm));
  const candidateText = [
    candidate.currentTitle || "",
    candidate.headline || "",
    ...candidate.experience.map((e) => `${e.role} ${e.description}`),
  ]
    .join(" ")
    .toLowerCase();

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const jdSkill of jdSkills) {
    const jdNorm = norm(jdSkill);
    // Check direct match
    let found = candidateSkillSet.has(jdNorm);
    // Check alias match
    if (!found) {
      for (const cs of candidateSkillSet) {
        if (skillsMatch(cs, jdNorm)) {
          found = true;
          break;
        }
      }
    }
    // Check text mention (experience descriptions, title, headline)
    if (!found && candidateText.includes(jdNorm)) {
      found = true;
    }

    if (found) {
      matchedSkills.push(jdSkill);
    } else {
      missingSkills.push(jdSkill);
    }
  }

  const matchRatio = matchedSkills.length / jdSkills.length;

  // Score curve: 0% match → 20, 50% → 60, 100% → 98
  // Using a slightly generous curve to avoid overly harsh scores
  let score: number;
  if (matchRatio >= 1.0) {
    score = 98;
  } else if (matchRatio >= 0.8) {
    score = 85 + Math.round((matchRatio - 0.8) * 65); // 85-98
  } else if (matchRatio >= 0.5) {
    score = 60 + Math.round((matchRatio - 0.5) * 83.3); // 60-85
  } else if (matchRatio >= 0.2) {
    score = 35 + Math.round((matchRatio - 0.2) * 83.3); // 35-60
  } else {
    score = 20 + Math.round(matchRatio * 75); // 20-35
  }

  // Bonus for having MORE skills than required (breadth)
  const extraSkills = candidate.skills.filter(
    (s) => !jdSkills.some((js) => skillsMatch(norm(s), norm(js))),
  );
  if (extraSkills.length > 3) {
    score = Math.min(score + 3, 99);
  }

  // Build reasoning
  let reasoning: string;
  if (matchedSkills.length === jdSkills.length) {
    reasoning = `Full skill coverage: matches all ${jdSkills.length} required skills (${matchedSkills.join(", ")}).`;
  } else if (matchedSkills.length > 0) {
    reasoning = `Matches ${matchedSkills.length}/${jdSkills.length} required skills (${matchedSkills.join(", ")}). Missing: ${missingSkills.join(", ")}.`;
  } else {
    reasoning = `No direct skill matches found for required skills (${jdSkills.join(", ")}). Score based on general background.`;
  }

  return { score, reasoning, matchedSkills, missingSkills };
}

/**
 * Experience Depth (30%): Years of experience vs requirement + industry relevance.
 */
function scoreExperienceDepth(
  candidate: CandidateInput,
  jd: JDInput,
): { score: number; reasoning: string } {
  const requiredYears = parseYearsRequired(jd.experience);
  const candidateYears = estimateYearsOfExperience(candidate.experience);
  const roleCount = candidate.experience.length;

  // Years match component (0-70 points)
  let yearsScore: number;
  if (candidateYears >= requiredYears) {
    // Meeting or exceeding is good, but diminishing returns past 2x
    const ratio = candidateYears / Math.max(requiredYears, 1);
    if (ratio <= 1.5) {
      yearsScore = 70;
    } else if (ratio <= 2.5) {
      yearsScore = 65; // Slightly over-experienced
    } else {
      yearsScore = 55; // Significantly over-experienced (may not be ideal fit)
    }
  } else {
    // Under the requirement
    const deficit = requiredYears - candidateYears;
    if (deficit <= 1) {
      yearsScore = 55; // Close enough
    } else if (deficit <= 3) {
      yearsScore = 35;
    } else {
      yearsScore = 20;
    }
  }

  // Role diversity component (0-20 points): more roles = broader experience
  const diversityScore = Math.min(roleCount * 5, 20);

  // Industry relevance component (0-10 points): check if experience mentions
  // keywords related to the JD department or title
  const jdKeywords = [
    norm(jd.title),
    norm(jd.department),
    ...jd.skills.map(norm),
  ];
  const experienceText = candidate.experience
    .map((e) => `${e.role} ${e.company} ${e.description}`)
    .join(" ")
    .toLowerCase();
  const relevantMentions = jdKeywords.filter((kw) =>
    experienceText.includes(kw),
  ).length;
  const industryScore = Math.min(relevantMentions * 2, 10);

  const score = Math.min(yearsScore + diversityScore + industryScore, 99);

  // Reasoning
  const parts: string[] = [];
  if (candidateYears > 0) {
    parts.push(`~${candidateYears} years of experience (${requiredYears}+ required)`);
  } else {
    parts.push(`Experience duration unclear from available data`);
  }
  parts.push(`${roleCount} role${roleCount !== 1 ? "s" : ""} across career`);
  if (relevantMentions > 0) {
    parts.push(`industry-relevant keywords found in background`);
  }

  return { score, reasoning: parts.join("; ") + "." };
}

/**
 * Culture Fit (15%): Location match + company-type alignment.
 */
function scoreCultureFit(
  candidate: CandidateInput,
  jd: JDInput,
): { score: number; reasoning: string } {
  const jdLocation = norm(jd.location);
  const candidateLocation = norm(candidate.location || "");

  // Location component (0-60 points)
  let locationScore: number;
  let locationNote: string;

  if (jdLocation === "remote" || jdLocation === "hybrid") {
    locationScore = 55; // Remote-friendly = most candidates fit
    locationNote = "Remote-friendly role; location not a barrier";
  } else if (candidateLocation && candidateLocation.includes(jdLocation)) {
    locationScore = 60;
    locationNote = `Located in ${candidate.location || "target area"}, matching JD requirement`;
  } else if (candidateLocation) {
    // Check partial match (same country, same region)
    const jdParts = jdLocation.split(/[,\s]+/);
    const candParts = candidateLocation.split(/[,\s]+/);
    const overlap = jdParts.some((jp) => candParts.some((cp) => cp === jp));
    if (overlap) {
      locationScore = 45;
      locationNote = `Partial location match (same region/country)`;
    } else {
      locationScore = 25;
      locationNote = `Located in ${candidate.location}; JD prefers ${jd.location}`;
    }
  } else {
    locationScore = 35;
    locationNote = "Location not specified; moderate default";
  }

  // Company-type/background alignment (0-40 points)
  // Use a deterministic signal: if candidate worked at known tech companies,
  // that's a proxy for "startup/tech culture" fit
  const companyText = candidate.experience
    .map((e) => norm(e.company))
    .join(" ");
  const techCompanySignals = [
    "google", "meta", "facebook", "amazon", "apple", "microsoft",
    "stripe", "shopify", "datadog", "cloudflare", "figma", "uber",
    "airbnb", "netflix", "spotify", "twitter", "x", "linkedin",
    "startup", "fintech", "saas",
  ];
  const techMatches = techCompanySignals.filter((s) => companyText.includes(s)).length;
  const companyScore = Math.min(20 + techMatches * 5, 40);

  const score = Math.min(locationScore + companyScore, 99);

  return {
    score,
    reasoning: `${locationNote}. ${techMatches > 0 ? `Background includes ${techMatches} notable tech company${techMatches > 1 ? "ies" : ""}.` : "Company background assessed as moderate culture alignment."}`,
  };
}

/**
 * Leadership Potential (15%): Seniority/title alignment with JD.
 */
function scoreLeadership(
  candidate: CandidateInput,
  jd: JDInput,
): { score: number; reasoning: string } {
  const jdSeniority = seniorityIndex(jd.seniority);

  // Infer candidate seniority from most recent title
  const latestTitle = candidate.currentTitle || candidate.experience[0]?.role || "";
  const candidateSeniority = seniorityIndex(inferSeniority(latestTitle));

  const diff = candidateSeniority - jdSeniority;

  let score: number;
  let reasoning: string;

  if (diff === 0) {
    score = 90;
    reasoning = `Seniority level aligns well with the ${jd.seniority} requirement.`;
  } else if (diff === 1) {
    score = 85;
    reasoning = `Slightly more senior than required (${jd.seniority}); could be a strong fit with leadership upside.`;
  } else if (diff === -1) {
    score = 70;
    reasoning = `One level below the ${jd.seniority} requirement; potential for growth into the role.`;
  } else if (diff > 1) {
    score = 60;
    reasoning = `Significantly more senior than required; may be overqualified for the ${jd.seniority} role.`;
  } else {
    // diff < -1
    score = Math.max(30, 70 + diff * 15);
    reasoning = `Below the ${jd.seniority} seniority level by ${Math.abs(diff)} tiers; may lack required leadership experience.`;
  }

  // Bonus: if candidate has "lead", "manager", "head" in any role title
  const hasLeadershipHistory = candidate.experience.some((e) => {
    const t = norm(e.role);
    return (
      t.includes("lead") ||
      t.includes("manager") ||
      t.includes("head") ||
      t.includes("director") ||
      t.includes("principal") ||
      t.includes("staff")
    );
  });
  if (hasLeadershipHistory && diff < 0) {
    score = Math.min(score + 10, 95);
    reasoning += " Prior leadership experience noted in career history.";
  }

  return { score, reasoning };
}

// ── Main scoring function ────────────────────────────────────────────────────

/**
 * Score a single candidate against a JD.
 *
 * This function is deterministic: same candidate + same JD = same output.
 * To replace with LLM scoring in the future, swap the internals of this
 * function with an AI SDK call that returns the same ScoredCandidate shape:
 *
 *   // Future LLM version:
 *   // const result = await generateObject({
 *   //   model: openai("gpt-4o"),
 *   //   schema: scoredCandidateSchema,
 *   //   prompt: buildScoringPrompt(candidate, jd),
 *   // });
 *   // return result.object;
 */
export function scoreCandidate(
  candidate: CandidateInput,
  jd: JDInput,
): ScoredCandidate {
  // Score each dimension
  const techResult = scoreTechnicalFit(candidate, jd);
  const expResult = scoreExperienceDepth(candidate, jd);
  const cultureResult = scoreCultureFit(candidate, jd);
  const leadershipResult = scoreLeadership(candidate, jd);

  // Weighted overall score
  const rawOverall =
    techResult.score * WEIGHTS.technicalFit +
    expResult.score * WEIGHTS.experienceDepth +
    cultureResult.score * WEIGHTS.cultureFit +
    leadershipResult.score * WEIGHTS.leadership;

  // Add a tiny deterministic tie-breaker so candidates with identical weighted
  // scores still have a stable, distinct matchScore
  const tieBreak = deterministicTieBreaker(candidate.id + candidate.name);
  const matchScore = Math.min(Math.round(rawOverall + tieBreak * 0.5), 99);

  // Build strengths list
  const strengths: string[] = [];
  if (techResult.score >= 80) strengths.push("Strong technical skill alignment");
  if (techResult.matchedSkills.length >= 3) {
    strengths.push(`Proficient in ${techResult.matchedSkills.slice(0, 4).join(", ")}`);
  }
  if (expResult.score >= 75) strengths.push("Solid experience depth and career progression");
  if (cultureResult.score >= 70) strengths.push("Good culture and location fit");
  if (leadershipResult.score >= 80) strengths.push("Appropriate seniority level");
  if (candidate.experience.length >= 3) strengths.push("Diverse work history across multiple roles");
  if (candidate.education.length > 0) {
    strengths.push(`Education: ${candidate.education[0].degree} from ${candidate.education[0].institution}`);
  }
  // Ensure at least one strength
  if (strengths.length === 0) {
    strengths.push("Relevant industry background");
  }

  // Skill gaps = missing JD skills
  const skillGaps = techResult.missingSkills.length > 0
    ? techResult.missingSkills
    : [];

  // Overall reasoning
  const overallReasoning = buildOverallReasoning(
    candidate,
    jd,
    matchScore,
    techResult,
    expResult,
  );

  return {
    id: candidate.id,
    name: candidate.name,
    matchScore,
    skills: candidate.skills.length > 0 ? candidate.skills : jd.skills.slice(0, 3),
    subScores: {
      technicalFit: techResult.score,
      cultureFit: cultureResult.score,
      experienceDepth: expResult.score,
    },
    pipelineStatus: "New",
    experience: candidate.experience,
    education: candidate.education,
    certifications: [],
    aiEvaluation: {
      overallReasoning,
      dimensionScores: [
        { dimension: "Technical Fit", score: techResult.score, reasoning: techResult.reasoning },
        { dimension: "Experience Depth", score: expResult.score, reasoning: expResult.reasoning },
        { dimension: "Culture Fit", score: cultureResult.score, reasoning: cultureResult.reasoning },
        { dimension: "Leadership Potential", score: leadershipResult.score, reasoning: leadershipResult.reasoning },
      ],
      skillGaps,
      strengths,
    },
    headline: candidate.headline,
    currentCompany: candidate.currentCompany,
    currentTitle: candidate.currentTitle,
    location: candidate.location,
    linkedinUrl: candidate.linkedinUrl,
  };
}

function buildOverallReasoning(
  candidate: CandidateInput,
  jd: JDInput,
  matchScore: number,
  techResult: { score: number; matchedSkills: string[]; missingSkills: string[] },
  expResult: { score: number },
): string {
  const name = candidate.name.split(" ")[0]; // First name for readability

  if (matchScore >= 85) {
    return `${name} is a strong match for the ${jd.title} role, demonstrating ${techResult.matchedSkills.length > 0 ? `expertise in ${techResult.matchedSkills.slice(0, 3).join(", ")}` : "relevant technical background"} with solid career depth.${techResult.missingSkills.length > 0 ? ` Minor gap in ${techResult.missingSkills[0]} could be addressed through onboarding.` : ""} Recommended for interview.`;
  }

  if (matchScore >= 70) {
    return `${name} shows good alignment with the ${jd.title} position. ${techResult.matchedSkills.length > 0 ? `Matches on ${techResult.matchedSkills.join(", ")}` : "Background is broadly relevant"}, though ${techResult.missingSkills.length > 0 ? `gaps in ${techResult.missingSkills.slice(0, 2).join(" and ")} should be evaluated` : "some areas may need further assessment"}. ${expResult.score >= 70 ? "Experience level is appropriate." : "Experience may be slightly below target."}`;
  }

  if (matchScore >= 50) {
    return `${name} has a moderate fit for the ${jd.title} role. ${techResult.matchedSkills.length > 0 ? `Some relevant skills (${techResult.matchedSkills.join(", ")})` : "Limited direct skill overlap"}, but ${techResult.missingSkills.length > 0 ? `notable gaps in ${techResult.missingSkills.slice(0, 3).join(", ")}` : "overall alignment is partial"}. Consider if candidate's broader experience compensates.`;
  }

  return `${name} shows limited alignment with the ${jd.title} requirements. ${techResult.missingSkills.length > 0 ? `Missing key skills: ${techResult.missingSkills.slice(0, 3).join(", ")}` : "Skill overlap is minimal"}. May be better suited for a different role or level.`;
}

// ── Batch scoring ────────────────────────────────────────────────────────────

/**
 * Score an array of candidates against a JD and return them sorted by
 * matchScore descending.
 *
 * This is the main entry point for the API route.
 */
export function scoreCandidates(
  candidates: CandidateInput[],
  jd: JDInput,
): ScoredCandidate[] {
  const scored = candidates.map((c) => scoreCandidate(c, jd));
  // Sort descending by matchScore (stable: deterministic tie-breaker in score)
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored;
}
