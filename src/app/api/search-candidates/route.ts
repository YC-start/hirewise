import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchParams {
  person_titles?: string[];
  person_locations?: string[];
  q_keywords?: string;
  person_seniorities?: string[];
  per_page?: number;
}

interface ApolloEmploymentEntry {
  title?: string;
  organization_name?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  current?: boolean;
}

interface ApolloEducationEntry {
  school_name?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
}

interface ApolloPerson {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  headline?: string;
  title?: string;
  organization?: {
    name?: string;
    industry?: string;
  };
  city?: string;
  state?: string;
  country?: string;
  linkedin_url?: string;
  employment_history?: ApolloEmploymentEntry[];
  departments?: string[];
  subdepartments?: string[];
  seniority?: string;
  email?: string;
  organization_id?: string;
}

interface CacheEntry {
  query_hash: string;
  params: SearchParams;
  timestamp: string;
  results: ApolloPerson[];
}

interface CacheData {
  searches: CacheEntry[];
}

interface TransformedCandidate {
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

// ── Seniority mapping ────────────────────────────────────────────────────────

const SENIORITY_MAP: Record<string, string> = {
  Junior: "entry",
  "Mid-Level": "senior",
  Mid: "senior",
  Senior: "senior",
  Lead: "manager",
  Principal: "director",
  Staff: "director",
  Head: "vp",
  Director: "director",
  VP: "vp",
  "C-Level": "c_suite",
  Intern: "entry",
};

// ── Cache helpers ────────────────────────────────────────────────────────────

const CACHE_FILE_PATH = join(process.cwd(), "src", "data", "apollo-cache.json");

function computeHash(params: SearchParams): string {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

function readCache(): CacheData {
  try {
    if (!existsSync(CACHE_FILE_PATH)) {
      return { searches: [] };
    }
    const raw = readFileSync(CACHE_FILE_PATH, "utf-8");
    return JSON.parse(raw) as CacheData;
  } catch {
    return { searches: [] };
  }
}

function writeCache(data: CacheData): void {
  try {
    // Filesystem write works in local dev; on serverless (Vercel) the fs is
    // read-only so this silently no-ops — cached results from git still serve
    // reads, and new API responses simply won't persist across cold starts.
    writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Expected on read-only serverless filesystems — not an error.
    console.info("[Apollo Cache] Filesystem is read-only; skipping cache write.");
  }
}

function findCachedResult(params: SearchParams): CacheEntry | null {
  const hash = computeHash(params);
  const cache = readCache();
  return cache.searches.find((entry) => entry.query_hash === hash) || null;
}

function saveToCacheFile(params: SearchParams, results: ApolloPerson[]): void {
  const cache = readCache();
  const hash = computeHash(params);

  // Remove existing entry with same hash (update)
  cache.searches = cache.searches.filter((entry) => entry.query_hash !== hash);

  cache.searches.push({
    query_hash: hash,
    params,
    timestamp: new Date().toISOString(),
    results,
  });

  writeCache(cache);
}

// ── Apollo API call ──────────────────────────────────────────────────────────

async function callApolloAPI(params: SearchParams): Promise<ApolloPerson[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    throw new Error("APOLLO_API_KEY is not configured");
  }

  const response = await fetch(
    "https://api.apollo.io/api/v1/mixed_people/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        ...params,
        per_page: params.per_page || 25,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `Apollo API error: ${response.status} ${response.statusText} — ${errorText}`,
    );
  }

  const data = await response.json();
  return (data.people || []) as ApolloPerson[];
}

// ── Data transformation ──────────────────────────────────────────────────────

function formatPeriod(start?: string, end?: string, current?: boolean): string {
  const startYear = start ? new Date(start).getFullYear() : null;
  const endPart = current ? "Present" : end ? new Date(end).getFullYear() : null;

  if (startYear && endPart) return `${startYear} — ${endPart}`;
  if (startYear) return `${startYear} — Present`;
  return "N/A";
}

function transformCandidate(
  person: ApolloPerson,
  index: number,
  jdSkills: string[],
): TransformedCandidate {
  const firstName = person.first_name || "";
  const lastName = person.last_name || "";
  const name = person.name || `${firstName} ${lastName}`.trim() || `Candidate ${index + 1}`;

  // Build location string
  const locationParts = [person.city, person.state, person.country].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(", ") : "Unknown";

  // Transform employment history
  const experience = (person.employment_history || [])
    .slice(0, 5) // Limit to 5 most recent
    .map((emp) => ({
      company: emp.organization_name || "Unknown Company",
      role: emp.title || "Unknown Role",
      period: formatPeriod(emp.start_date, emp.end_date, emp.current),
      description: emp.description || `Worked as ${emp.title || "professional"} at ${emp.organization_name || "the company"}.`,
    }));

  // Skills: infer from JD keywords + title + departments
  const inferredSkills: string[] = [];
  const personText = [
    person.title,
    person.headline,
    person.organization?.industry,
    ...(person.departments || []),
    ...(person.subdepartments || []),
    ...(person.employment_history || []).map((e) => `${e.title} ${e.description || ""}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const skill of jdSkills) {
    if (personText.includes(skill.toLowerCase())) {
      inferredSkills.push(skill);
    }
  }
  // If no skills matched, take first 3 JD skills as potential skills
  if (inferredSkills.length === 0 && jdSkills.length > 0) {
    inferredSkills.push(...jdSkills.slice(0, Math.min(3, jdSkills.length)));
  }

  return {
    id: person.id || `apollo-${index}-${Date.now()}`,
    name,
    headline: person.headline || person.title || "",
    currentCompany: person.organization?.name || "N/A",
    currentTitle: person.title || "N/A",
    location,
    linkedinUrl: person.linkedin_url || "",
    experience,
    education: [], // Apollo people search does not return education data
    skills: inferredSkills,
    source: "apollo",
  };
}

// ── Request body types ───────────────────────────────────────────────────────

interface RequestBody {
  title?: string;
  skills?: string[];
  location?: string;
  seniority?: string;
  industry?: string;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { title, skills, location, seniority, industry } = body;

    // Build Apollo search parameters
    const searchParams: SearchParams = {
      per_page: 25,
    };

    if (title) {
      searchParams.person_titles = [title];
    }

    if (location) {
      searchParams.person_locations = [location];
    }

    if (skills && skills.length > 0) {
      // Combine skills + industry into keywords
      const keywordParts = [...skills];
      if (industry) keywordParts.push(industry);
      searchParams.q_keywords = keywordParts.join(" ");
    } else if (industry) {
      searchParams.q_keywords = industry;
    }

    if (seniority) {
      const mapped = SENIORITY_MAP[seniority];
      if (mapped) {
        searchParams.person_seniorities = [mapped];
      }
    }

    // Check cache first
    const cached = findCachedResult(searchParams);
    if (cached) {
      console.log(
        `[Apollo] Cache HIT for hash ${cached.query_hash.slice(0, 12)}... (${cached.results.length} results)`,
      );
      const candidates = cached.results.map((person, i) =>
        transformCandidate(person, i, skills || []),
      );
      return Response.json({
        candidates,
        total: candidates.length,
        cached: true,
        cacheTimestamp: cached.timestamp,
      });
    }

    // Cache miss — call Apollo API
    console.log("[Apollo] Cache MISS — calling Apollo API...");
    console.log("[Apollo] Search params:", JSON.stringify(searchParams));

    const rawResults = await callApolloAPI(searchParams);

    // Save raw results to cache
    saveToCacheFile(searchParams, rawResults);
    console.log(`[Apollo] Saved ${rawResults.length} results to cache`);

    // Transform to our format
    const candidates = rawResults.map((person, i) =>
      transformCandidate(person, i, skills || []),
    );

    return Response.json({
      candidates,
      total: candidates.length,
      cached: false,
    });
  } catch (error) {
    console.error("[Apollo] Search error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown search error";
    return Response.json(
      { error: message, candidates: [], total: 0 },
      { status: 500 },
    );
  }
}
