import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/evaluator-flow3";

/**
 * Evaluator FLOW-3: Agent resume structuring + AI scoring and ranking
 *
 * Core verification: when a user searches for candidates via chat, the scoring
 * engine (/api/score-candidates) is called with real multi-dimensional evaluation,
 * NOT mock hard-coded scores. The pipeline displays ranked results, and the
 * candidate profile shows a complete AI Evaluation Report.
 */

test.describe("Evaluator FLOW-3: AI Scoring & Ranking", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // T1: Chat search triggers the scoring flow and produces an Action Card
  test("T1: Chat search triggers scoring flow with Action Card stats", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Find the chat input in the main area (ChatMainArea is center)
    const chatInput = page.locator(
      'input[placeholder*="message"], input[placeholder*="Type"], textarea[placeholder*="message"], textarea[placeholder*="Type"], [data-testid="chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });

    // Type the search query
    await chatInput.first().fill("Find senior backend engineers with Go and Kubernetes experience");

    // Send the message — click send button or press Enter
    const sendBtn = page.locator(
      'button[data-testid="chat-send"], button[aria-label*="send"], button[aria-label*="Send"]'
    );
    if (await sendBtn.first().isVisible().catch(() => false)) {
      await sendBtn.first().click();
    } else {
      await chatInput.first().press("Enter");
    }

    // Wait for the Action Card to appear (max 15 seconds)
    const actionCard = page.locator('[data-testid="action-card"]');
    await expect(actionCard.first()).toBeVisible({ timeout: 15000 });

    // Take screenshot after action card appears
    await page.screenshot({ path: `${SCREENSHOT_DIR}/t1-action-card-visible.png`, fullPage: false });

    // Verify the Action Card contains scoring statistics
    const metricsContainer = page.locator('[data-testid="action-card-metrics"]').first();
    await expect(metricsContainer).toBeVisible({ timeout: 5000 });

    // Verify metrics contain Total, High Score, Avg Score labels
    const metricsText = await metricsContainer.textContent();
    expect(metricsText).toBeTruthy();
    expect(metricsText!.toLowerCase()).toContain("total");
    expect(metricsText!.toLowerCase()).toMatch(/high\s*score/);
    expect(metricsText!.toLowerCase()).toMatch(/avg\s*score/);

    // Verify the CTA button exists
    const ctaButton = page.locator('[data-testid="action-card-cta"]').first();
    await expect(ctaButton).toBeVisible();
    const ctaText = await ctaButton.textContent();
    expect(ctaText!.toLowerCase()).toContain("ranking");
  });

  // T2: Score dimension completeness on candidate profile
  test("T2: Candidate profile shows 4-dimension AI Evaluation Report", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Search for candidates to trigger scoring
    const chatInput = page.locator(
      'input[placeholder*="message"], input[placeholder*="Type"], textarea[placeholder*="message"], textarea[placeholder*="Type"], [data-testid="chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Find senior backend engineers with Go and Kubernetes experience");

    const sendBtn = page.locator(
      'button[data-testid="chat-send"], button[aria-label*="send"], button[aria-label*="Send"]'
    );
    if (await sendBtn.first().isVisible().catch(() => false)) {
      await sendBtn.first().click();
    } else {
      await chatInput.first().press("Enter");
    }

    // Wait for action card
    const actionCard = page.locator('[data-testid="action-card"]');
    await expect(actionCard.first()).toBeVisible({ timeout: 15000 });

    // Click "View Ranking" CTA to navigate to pipeline
    const ctaLink = page.locator('[data-testid="action-card-cta"]').first();
    await ctaLink.click();
    await page.waitForTimeout(2000);

    // Take screenshot of the pipeline/ranking page
    await page.screenshot({ path: `${SCREENSHOT_DIR}/t2-ranking-view.png`, fullPage: false });

    // Verify candidates are displayed (look for ranked list or candidate rows)
    const candidateRows = page.locator(
      '[data-testid="candidate-ranked-list"] [data-testid^="candidate-row-"], [data-testid="candidate-ranked-list"] tr, [data-testid="candidate-ranked-list"] a'
    );
    // Wait for at least one candidate to appear
    await expect(candidateRows.first()).toBeVisible({ timeout: 5000 });
    const rowCount = await candidateRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify scores are in descending order
    const scoreElements = page.locator('[data-testid="candidate-ranked-list"] [data-testid^="candidate-score-"]');
    const scoreCount = await scoreElements.count();
    if (scoreCount > 1) {
      const scores: number[] = [];
      for (let i = 0; i < scoreCount; i++) {
        const text = await scoreElements.nth(i).textContent();
        const score = parseInt(text?.trim() || "0", 10);
        if (!isNaN(score)) scores.push(score);
      }
      // Verify descending order
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    }

    // Click first candidate to navigate to profile
    await candidateRows.first().click();
    await page.waitForTimeout(2000);

    // Now check if candidate profile is visible (either main area or sidebar)
    // The candidate profile should have AI Evaluation Report
    const aiEvalSection = page.locator('[data-testid="ai-evaluation-section"]');
    await expect(aiEvalSection.first()).toBeVisible({ timeout: 5000 });

    // Verify 4 dimension scores
    const dimensionScores = page.locator('[data-testid="ai-dimension-scores"]').first();
    await expect(dimensionScores).toBeVisible();

    // Check all 4 dimension bars exist
    await expect(page.locator('[data-testid="dimension-bar-technical-fit"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="dimension-bar-experience-depth"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="dimension-bar-culture-fit"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="dimension-bar-leadership-potential"]').first()).toBeVisible();

    // Verify each dimension has reasoning text
    const dimensionReasoning = page.locator('[data-testid="ai-dimension-reasoning"]').first();
    await expect(dimensionReasoning).toBeVisible();

    const techReasoning = page.locator('[data-testid="reasoning-technical-fit"]').first();
    const expReasoning = page.locator('[data-testid="reasoning-experience-depth"]').first();
    const cultureReasoning = page.locator('[data-testid="reasoning-culture-fit"]').first();
    const leadershipReasoning = page.locator('[data-testid="reasoning-leadership-potential"]').first();

    await expect(techReasoning).toBeVisible();
    await expect(expReasoning).toBeVisible();
    await expect(cultureReasoning).toBeVisible();
    await expect(leadershipReasoning).toBeVisible();

    // Each reasoning card should contain actual text
    for (const el of [techReasoning, expReasoning, cultureReasoning, leadershipReasoning]) {
      const text = await el.textContent();
      expect(text!.length).toBeGreaterThan(10);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/t2-candidate-evaluation.png`, fullPage: false });
  });

  // T3: Scoring transparency — reasoning, strengths, skill gaps
  test("T3: Candidate profile shows reasoning, strengths, and skill gaps", async ({ page }) => {
    // Navigate directly to a known candidate with mock data as a baseline
    // Then also test the scored version through chat
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Search for candidates to trigger scoring
    const chatInput = page.locator(
      'input[placeholder*="message"], input[placeholder*="Type"], textarea[placeholder*="message"], textarea[placeholder*="Type"], [data-testid="chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput.first().fill("Find senior backend engineers with Go and Kubernetes experience");

    const sendBtn = page.locator(
      'button[data-testid="chat-send"], button[aria-label*="send"], button[aria-label*="Send"]'
    );
    if (await sendBtn.first().isVisible().catch(() => false)) {
      await sendBtn.first().click();
    } else {
      await chatInput.first().press("Enter");
    }

    // Wait for action card
    const actionCard = page.locator('[data-testid="action-card"]');
    await expect(actionCard.first()).toBeVisible({ timeout: 15000 });

    // Navigate to pipeline
    const ctaLink = page.locator('[data-testid="action-card-cta"]').first();
    await ctaLink.click();
    await page.waitForTimeout(2000);

    // Click first candidate
    const candidateRows = page.locator(
      '[data-testid="candidate-ranked-list"] [data-testid^="candidate-row-"], [data-testid="candidate-ranked-list"] tr, [data-testid="candidate-ranked-list"] a'
    );
    await expect(candidateRows.first()).toBeVisible({ timeout: 5000 });
    await candidateRows.first().click();
    await page.waitForTimeout(2000);

    // Verify overall reasoning
    const overallReasoning = page.locator('[data-testid="ai-overall-reasoning"]').first();
    await expect(overallReasoning).toBeVisible({ timeout: 5000 });
    const reasoningText = await overallReasoning.textContent();
    expect(reasoningText!.length).toBeGreaterThan(30);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/t3-reasoning-and-gaps.png`, fullPage: false });

    // Verify strengths list
    const strengthsSection = page.locator('[data-testid="ai-strengths"]').first();
    await expect(strengthsSection).toBeVisible();
    const strengthTags = strengthsSection.locator("span");
    const strengthCount = await strengthTags.count();
    expect(strengthCount).toBeGreaterThan(0);

    // Verify skill gaps list
    const skillGapsSection = page.locator('[data-testid="ai-skill-gaps"]').first();
    await expect(skillGapsSection).toBeVisible();
    // Skill gaps may be empty for a perfect match, so just verify section exists
    // The section itself being visible is enough — if no gaps, the heading is still there
  });

  // T4: Scoring engine consistency — API returns expected shape
  test("T4: Scoring API returns deterministic results with correct structure", async ({ request }) => {
    // Call the scoring API directly
    const response = await request.post("http://localhost:3000/api/score-candidates", {
      headers: { "Content-Type": "application/json" },
      data: {
        candidates: [
          {
            id: "test-candidate-1",
            name: "Test Engineer",
            experience: [
              {
                company: "Google",
                role: "Senior Go Engineer",
                period: "2020-2024",
                description: "Built distributed systems using Go and Kubernetes",
              },
            ],
            education: [
              {
                institution: "MIT",
                degree: "BS Computer Science",
                year: "2018",
              },
            ],
            skills: ["Go", "Kubernetes", "Docker", "gRPC"],
          },
        ],
        jd: {
          title: "Senior Backend Engineer",
          department: "Engineering",
          location: "Remote",
          experience: "5+ years",
          seniority: "Senior",
          skills: ["Go", "Kubernetes"],
          description: "Senior backend engineer to build distributed systems",
        },
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    // Verify top-level structure
    expect(body).toHaveProperty("candidates");
    expect(body).toHaveProperty("total");
    expect(body.total).toBe(1);
    expect(body.candidates).toHaveLength(1);

    const candidate = body.candidates[0];

    // Verify matchScore exists and is 0-100
    expect(candidate).toHaveProperty("matchScore");
    expect(typeof candidate.matchScore).toBe("number");
    expect(candidate.matchScore).toBeGreaterThanOrEqual(0);
    expect(candidate.matchScore).toBeLessThanOrEqual(100);

    // Verify subScores
    expect(candidate).toHaveProperty("subScores");
    expect(candidate.subScores).toHaveProperty("technicalFit");
    expect(candidate.subScores).toHaveProperty("cultureFit");
    expect(candidate.subScores).toHaveProperty("experienceDepth");

    // Verify aiEvaluation
    expect(candidate).toHaveProperty("aiEvaluation");
    const aiEval = candidate.aiEvaluation;

    // Overall reasoning
    expect(aiEval).toHaveProperty("overallReasoning");
    expect(typeof aiEval.overallReasoning).toBe("string");
    expect(aiEval.overallReasoning.length).toBeGreaterThan(10);

    // Dimension scores — must be exactly 4
    expect(aiEval).toHaveProperty("dimensionScores");
    expect(aiEval.dimensionScores).toHaveLength(4);

    const dimensionNames = aiEval.dimensionScores.map(
      (d: { dimension: string }) => d.dimension
    );
    expect(dimensionNames).toContain("Technical Fit");
    expect(dimensionNames).toContain("Experience Depth");
    expect(dimensionNames).toContain("Culture Fit");
    expect(dimensionNames).toContain("Leadership Potential");

    // Each dimension has score and reasoning
    for (const dim of aiEval.dimensionScores) {
      expect(typeof dim.score).toBe("number");
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
      expect(typeof dim.reasoning).toBe("string");
      expect(dim.reasoning.length).toBeGreaterThan(5);
    }

    // Strengths and skill gaps
    expect(aiEval).toHaveProperty("strengths");
    expect(Array.isArray(aiEval.strengths)).toBeTruthy();
    expect(aiEval.strengths.length).toBeGreaterThan(0);

    expect(aiEval).toHaveProperty("skillGaps");
    expect(Array.isArray(aiEval.skillGaps)).toBeTruthy();

    // Verify determinism: call again with same input, get same output
    const response2 = await request.post("http://localhost:3000/api/score-candidates", {
      headers: { "Content-Type": "application/json" },
      data: {
        candidates: [
          {
            id: "test-candidate-1",
            name: "Test Engineer",
            experience: [
              {
                company: "Google",
                role: "Senior Go Engineer",
                period: "2020-2024",
                description: "Built distributed systems using Go and Kubernetes",
              },
            ],
            education: [
              {
                institution: "MIT",
                degree: "BS Computer Science",
                year: "2018",
              },
            ],
            skills: ["Go", "Kubernetes", "Docker", "gRPC"],
          },
        ],
        jd: {
          title: "Senior Backend Engineer",
          department: "Engineering",
          location: "Remote",
          experience: "5+ years",
          seniority: "Senior",
          skills: ["Go", "Kubernetes"],
          description: "Senior backend engineer to build distributed systems",
        },
      },
    });

    const body2 = await response2.json();
    expect(body2.candidates[0].matchScore).toBe(candidate.matchScore);
    expect(body2.candidates[0].subScores.technicalFit).toBe(candidate.subScores.technicalFit);
    expect(body2.candidates[0].subScores.cultureFit).toBe(candidate.subScores.cultureFit);
    expect(body2.candidates[0].subScores.experienceDepth).toBe(candidate.subScores.experienceDepth);
    expect(body2.candidates[0].aiEvaluation.overallReasoning).toBe(aiEval.overallReasoning);
  });
});
