/**
 * POST /api/score-candidates
 *
 * Accepts an array of candidates + JD data, scores each candidate using the
 * deterministic scoring engine, and returns ranked results.
 *
 * Request body:
 *   { candidates: CandidateInput[], jd: JDInput }
 *
 * Response:
 *   { candidates: ScoredCandidate[], total: number }
 *
 * Future: replace the scoring-engine call with an LLM-based scoring pipeline
 * using Vercel AI SDK's `generateObject()` for richer reasoning traces.
 *
 *   // import { generateObject } from "ai";
 *   // import { openai } from "@ai-sdk/openai";
 *   // const result = await generateObject({
 *   //   model: openai("gpt-4o"),
 *   //   schema: scoredCandidateSchema,
 *   //   prompt: buildScoringPrompt(candidate, jd),
 *   // });
 */

import {
  scoreCandidates,
  type CandidateInput,
  type JDInput,
} from "@/lib/scoring-engine";

interface RequestBody {
  candidates: CandidateInput[];
  jd: JDInput;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { candidates, jd } = body;

    if (!candidates || !Array.isArray(candidates)) {
      return Response.json(
        { error: "Missing or invalid 'candidates' array in request body." },
        { status: 400 },
      );
    }

    if (!jd || !jd.title) {
      return Response.json(
        { error: "Missing or invalid 'jd' object in request body." },
        { status: 400 },
      );
    }

    // Score and rank all candidates deterministically
    const scoredCandidates = scoreCandidates(candidates, jd);

    return Response.json({
      candidates: scoredCandidates,
      total: scoredCandidates.length,
    });
  } catch (error) {
    console.error("[Score] Scoring error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown scoring error";
    return Response.json(
      { error: message, candidates: [], total: 0 },
      { status: 500 },
    );
  }
}
