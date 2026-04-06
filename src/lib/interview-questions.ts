/**
 * Interview Questions Engine (D-3)
 *
 * Deterministic generator that produces tailored interview questions for a
 * candidate given the Job Description they are being evaluated against.
 *
 * Every question is grounded in one of three sources:
 *   1. A JD-required skill the candidate claims (verification probe)
 *   2. A JD-required skill the candidate is missing (gap probe)
 *   3. A specific entry in the candidate's work experience (experience probe)
 *
 * Additional questions come from the AI evaluation report's skillGaps list,
 * the seniority level, and the candidate's own strengths/weak dimensions.
 *
 * Pure functions only — same inputs always yield the same outputs (no
 * Math.random, no Date.now). Designed to be swapped for an LLM call later:
 * replace `generateInterviewQuestions()` internals with an AI SDK call that
 * returns the same InterviewQuestion[] shape.
 */

import type { Candidate, Experience } from "@/data/mock-candidates";
import type { JobDescription, SkillTag } from "@/data/mock-jobs";

// ── Public types ────────────────────────────────────────────────────────────

export type QuestionCategory =
  | "Technical Depth"
  | "JD Requirements"
  | "Experience Probe"
  | "Skill Gap"
  | "Culture & Seniority";

export interface InterviewQuestion {
  /** Stable id so React keys stay consistent across re-renders. */
  id: string;
  category: QuestionCategory;
  /** The question text the interviewer will actually ask. */
  text: string;
  /**
   * Short rationale shown to the hiring manager explaining *why* this
   * question was generated — ties back to a JD requirement, a resume line,
   * or an identified skill gap.
   */
  rationale: string;
  /**
   * Skill tags this question touches. Rendered as small chips on the card.
   * May be empty for questions that are not skill-specific.
   */
  skillRefs: string[];
  /**
   * Which AI evaluation dimension this question primarily exercises.
   * Used by the UI to colour-code category headers if desired.
   */
  relatedDimension:
    | "Technical Fit"
    | "Experience Depth"
    | "Culture Fit"
    | "Leadership Potential";
}

// ── Skill alias table (kept in-sync with scoring-engine.ts) ─────────────────

const SKILL_ALIASES: Record<string, string[]> = {
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

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function skillsMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  const aliases = SKILL_ALIASES[na] || [];
  return aliases.includes(nb);
}

function candidateHasSkill(candidate: Candidate, skill: string): boolean {
  return candidate.skills.some((s) => skillsMatch(s, skill));
}

// ── Seniority parsing ───────────────────────────────────────────────────────

type SeniorityBand = "junior" | "mid" | "senior" | "lead" | "principal";

function parseSeniority(seniority: string): SeniorityBand {
  const s = norm(seniority);
  if (/(principal|staff|director|head|vp|chief)/.test(s)) return "principal";
  if (/(lead|manager|tech lead)/.test(s)) return "lead";
  if (/senior/.test(s)) return "senior";
  if (/(junior|entry|intern|associate)/.test(s)) return "junior";
  return "mid";
}

// ── Templated question banks ────────────────────────────────────────────────
//
// Each template is a pure function of (skill, context) → string. Templates
// are deterministic — if you need variety across candidates it comes from
// picking a template index using a hash of the candidate id, not randomness.

type TechTemplate = (skill: string, company?: string) => { text: string; rationale: string };

const TECH_VERIFICATION_TEMPLATES: TechTemplate[] = [
  (skill, company) => ({
    text: `Your resume lists ${skill}${company ? ` at ${company}` : ""}. Walk me through the most technically demanding problem you solved with it — what trade-offs did you make and what would you do differently today?`,
    rationale: `${skill} is a required JD skill. This probes depth vs. surface-level familiarity.`,
  }),
  (skill, company) => ({
    text: `Describe a production incident involving ${skill}${company ? ` while you were at ${company}` : ""}. How did you debug it, and what did it teach you about the tool's failure modes?`,
    rationale: `Verifies ${skill} experience under pressure — required by the JD.`,
  }),
  (skill) => ({
    text: `If we handed you a greenfield service that needed ${skill}, how would you structure the first week of work? Which pitfalls would you anticipate?`,
    rationale: `Tests architectural judgement around ${skill}, a required JD skill.`,
  }),
  (skill) => ({
    text: `What's a common misconception about ${skill} that junior engineers get wrong, and how do you coach them past it?`,
    rationale: `Probes mentoring ability and deep knowledge of ${skill}.`,
  }),
];

const GAP_PROBE_TEMPLATES: TechTemplate[] = [
  (skill) => ({
    text: `The role requires ${skill}, but I don't see it explicitly on your resume. How have you approached learning new tooling like this in the past, and what's your plan to ramp up?`,
    rationale: `${skill} is a required JD skill the candidate does not list. Evaluates learning agility.`,
  }),
  (skill) => ({
    text: `Have you worked with ${skill} in any capacity — even adjacent or exploratory? What's your current mental model of it?`,
    rationale: `Checks whether the missing skill ${skill} is truly absent or simply unlisted.`,
  }),
];

const EXPERIENCE_PROBE_TEMPLATES: Array<(exp: Experience) => { text: string; rationale: string }> = [
  (exp) => ({
    text: `At ${exp.company} you were a ${exp.role}. What was the single biggest business outcome your work drove, and how did you measure it?`,
    rationale: `Probes impact and metrics thinking against a real line on the resume.`,
  }),
  (exp) => ({
    text: `Your time at ${exp.company} spanned "${exp.period}". What changed about how you approach engineering between the start and end of that role?`,
    rationale: `Surfaces growth trajectory and self-awareness tied to a specific role.`,
  }),
  (exp) => ({
    text: `You described this at ${exp.company}: "${truncate(exp.description, 140)}". What's a decision from that work you'd push back on today, with hindsight?`,
    rationale: `Tests reflection and maturity against the candidate's own words.`,
  }),
  (exp) => ({
    text: `Who was the hardest stakeholder to align with during your time at ${exp.company}, and how did you handle it?`,
    rationale: `Behavioural probe tied to a real role from the candidate's history.`,
  }),
];

// Culture / seniority questions vary by band so we ask the right thing to the right level
const CULTURE_QUESTIONS: Record<SeniorityBand, { text: string; rationale: string }[]> = {
  junior: [
    {
      text: "Tell me about a time a senior engineer's feedback changed how you write code. What specifically clicked for you?",
      rationale: "Junior-appropriate: measures coachability and growth mindset.",
    },
    {
      text: "When you get stuck on a problem for more than an hour, what's your exact next step?",
      rationale: "Junior-appropriate: probes debugging discipline and when to ask for help.",
    },
  ],
  mid: [
    {
      text: "Describe a time you disagreed with a technical decision made by your team. How did you raise it and what happened?",
      rationale: "Mid-level: tests technical voice and healthy disagreement.",
    },
    {
      text: "Walk me through a project where you had to balance shipping speed against code quality. Where did you draw the line?",
      rationale: "Mid-level: probes judgement on pragmatic trade-offs.",
    },
  ],
  senior: [
    {
      text: "Tell me about a time you inherited a system that was technically broken but business-critical. What was your first 30 days?",
      rationale: "Senior-level: tests incident triage and risk management.",
    },
    {
      text: "When was the last time you changed your mind about a strongly-held technical opinion? What convinced you?",
      rationale: "Senior-level: probes intellectual honesty and openness.",
    },
  ],
  lead: [
    {
      text: "Describe how you'd run the first team meeting with 4 engineers you've just inherited, two of whom are underperforming.",
      rationale: "Lead-level: tests people management under constraint.",
    },
    {
      text: "Tell me about a technical direction you championed that later proved wrong. How did you recover the team's trust?",
      rationale: "Lead-level: probes accountability and leadership credibility.",
    },
  ],
  principal: [
    {
      text: "Walk me through a multi-quarter technical bet you made that the org pushed back on. What was the outcome and what did it cost you to push it through?",
      rationale: "Principal-level: tests organisational influence and long-horizon conviction.",
    },
    {
      text: "How do you decide whether a problem deserves a new system vs. evolution of the existing one? Give me a concrete example.",
      rationale: "Principal-level: probes architectural judgement at scale.",
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

/**
 * Deterministic positive integer hash of a string — used to pick templates
 * so different candidates get different questions without real randomness.
 */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickTemplate<T>(arr: T[], seed: number, offset: number): T {
  return arr[(seed + offset) % arr.length];
}

// ── Main entry point ────────────────────────────────────────────────────────

/**
 * Generate a tailored interview question set for this candidate / JD pair.
 *
 * Guarantees:
 * - Deterministic (same candidate + JD → identical question set)
 * - Always returns at least one question per non-empty category source
 * - Every Technical Depth / Skill Gap question references a JD-required skill
 * - Every Experience Probe question references a real entry in candidate.experience
 * - Skill-gap questions use aiEvaluation.skillGaps when available, falling back
 *   to JD-required skills the candidate does not list
 */
export function generateInterviewQuestions(
  candidate: Candidate,
  jd: JobDescription | undefined,
): InterviewQuestion[] {
  const seed = hash(candidate.id + candidate.name);
  const questions: InterviewQuestion[] = [];

  // JD skills — partitioned by whether the candidate claims them
  const requiredSkills: SkillTag[] = jd?.skills.filter((s) => s.category === "required") ?? [];
  const niceToHaveSkills: SkillTag[] = jd?.skills.filter((s) => s.category === "nice-to-have") ?? [];

  const claimedRequired = requiredSkills.filter((s) => candidateHasSkill(candidate, s.name));
  const missingRequired = requiredSkills.filter((s) => !candidateHasSkill(candidate, s.name));

  // ── 1. Technical Depth — verify claimed required skills ────────────────
  // Pick up to 3 claimed required skills, each gets one question.
  const depthTargets = claimedRequired.slice(0, 3);
  depthTargets.forEach((skill, idx) => {
    // Find the most recent experience entry that mentions the skill, for grounding
    const anchorExp = candidate.experience?.find((e) =>
      norm(e.description + " " + e.role).includes(norm(skill.name)),
    );
    const template = pickTemplate(TECH_VERIFICATION_TEMPLATES, seed, idx);
    const { text, rationale } = template(skill.name, anchorExp?.company);
    questions.push({
      id: `tech-${candidate.id}-${idx}`,
      category: "Technical Depth",
      text,
      rationale,
      skillRefs: [skill.name],
      relatedDimension: "Technical Fit",
    });
  });

  // ── 2. JD Requirements — map every required skill to coverage ──────────
  // One summary question that forces the candidate to narrate the JD fit end-to-end.
  if (requiredSkills.length > 0) {
    const claimedList = claimedRequired.map((s) => s.name).slice(0, 5);
    const missingList = missingRequired.map((s) => s.name).slice(0, 3);

    if (claimedList.length > 0) {
      questions.push({
        id: `jdmap-${candidate.id}-0`,
        category: "JD Requirements",
        text: `The role requires ${joinList(requiredSkills.map((s) => s.name))}. Looking at your background, which of these do you feel you could teach to a new hire from day one, and which would you need to brush up on?`,
        rationale: `Direct mapping exercise against the ${requiredSkills.length} required JD skills. Surfaces self-assessment accuracy.`,
        skillRefs: requiredSkills.map((s) => s.name).slice(0, 6),
        relatedDimension: "Technical Fit",
      });
    }

    if (niceToHaveSkills.length > 0) {
      questions.push({
        id: `jdmap-${candidate.id}-1`,
        category: "JD Requirements",
        text: `We also value ${joinList(niceToHaveSkills.map((s) => s.name).slice(0, 4))} on this team. Which of these have you used in anger, and what would you pick up first if hired?`,
        rationale: `Probes depth on the nice-to-have skills without penalising absence.`,
        skillRefs: niceToHaveSkills.map((s) => s.name).slice(0, 4),
        relatedDimension: "Technical Fit",
      });
    }
  }

  // ── 3. Experience Probe — reference real resume lines ────────────────────
  const experiences = candidate.experience ?? [];
  // Take the two most recent experiences (they are stored reverse-chron already)
  const probeTargets = experiences.slice(0, 2);
  probeTargets.forEach((exp, idx) => {
    const template = pickTemplate(EXPERIENCE_PROBE_TEMPLATES, seed, idx + 1);
    const { text, rationale } = template(exp);
    questions.push({
      id: `exp-${candidate.id}-${idx}`,
      category: "Experience Probe",
      text,
      rationale,
      skillRefs: [],
      relatedDimension: "Experience Depth",
    });
  });

  // ── 4. Skill Gap — prioritise aiEvaluation.skillGaps, fall back to JD ──
  // Only include gaps that look like real skill names (short, no prose).
  const evalGaps = (candidate.aiEvaluation?.skillGaps ?? []).filter(
    (g) => g.length > 0 && g.length < 60,
  );
  const gapPool: string[] = [];
  // Prefer JD-required missing skills (they are concrete)
  for (const s of missingRequired) gapPool.push(s.name);
  // Then fall back to AI evaluation skill gaps that are not already covered
  for (const g of evalGaps) {
    if (!gapPool.some((existing) => skillsMatch(existing, g))) {
      gapPool.push(g);
    }
  }

  const gapTargets = gapPool.slice(0, 2);
  gapTargets.forEach((gap, idx) => {
    const isJDRequired = missingRequired.some((s) => skillsMatch(s.name, gap));
    if (isJDRequired) {
      const template = pickTemplate(GAP_PROBE_TEMPLATES, seed, idx);
      const { text, rationale } = template(gap);
      questions.push({
        id: `gap-${candidate.id}-${idx}`,
        category: "Skill Gap",
        text,
        rationale,
        skillRefs: [gap],
        relatedDimension: "Technical Fit",
      });
    } else {
      // Softer framing for AI-identified gaps (may be stylistic, not absent)
      questions.push({
        id: `gap-${candidate.id}-${idx}`,
        category: "Skill Gap",
        text: `Our AI evaluation flagged "${gap}" as a potential growth area. Do you see it that way, and what's your plan to address it in this role?`,
        rationale: `Surfaced by AI Evaluation Report as a skill gap. Lets the candidate contextualise the finding.`,
        skillRefs: [gap],
        relatedDimension: "Experience Depth",
      });
    }
  });

  // ── 5. Culture & Seniority ──────────────────────────────────────────────
  const band = parseSeniority(jd?.seniority ?? "");
  const cultureQs = CULTURE_QUESTIONS[band];
  cultureQs.forEach((q, idx) => {
    questions.push({
      id: `culture-${candidate.id}-${idx}`,
      category: "Culture & Seniority",
      text: q.text,
      rationale: q.rationale,
      skillRefs: [],
      relatedDimension: idx === 0 ? "Culture Fit" : "Leadership Potential",
    });
  });

  return questions;
}

// ── Small helpers ───────────────────────────────────────────────────────────

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Group a flat list of questions by category, preserving insertion order
 * within each group. Returned as an array so the UI can render in a
 * deterministic sequence.
 */
export function groupQuestionsByCategory(
  questions: InterviewQuestion[],
): Array<{ category: QuestionCategory; questions: InterviewQuestion[] }> {
  const order: QuestionCategory[] = [
    "Technical Depth",
    "JD Requirements",
    "Experience Probe",
    "Skill Gap",
    "Culture & Seniority",
  ];
  const buckets: Record<QuestionCategory, InterviewQuestion[]> = {
    "Technical Depth": [],
    "JD Requirements": [],
    "Experience Probe": [],
    "Skill Gap": [],
    "Culture & Seniority": [],
  };
  for (const q of questions) buckets[q.category].push(q);
  return order
    .filter((cat) => buckets[cat].length > 0)
    .map((cat) => ({ category: cat, questions: buckets[cat] }));
}
