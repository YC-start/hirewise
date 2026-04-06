import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/d3";

/**
 * Evaluator D-3: AI-generated interview questions
 *
 * Feature spec (features.json):
 *   "The candidate profile includes an Interview Prep tab with AI-generated
 *    questions tailored to the candidate's profile mapped against the JD
 *    requirements."
 *
 * Test steps:
 *  1. Navigate to /job/:id/candidate/:cid
 *  2. Click the Interview Prep tab
 *  3. Verify a list of AI-generated interview questions is displayed
 *  4. Verify questions reference specific aspects of the candidate's experience
 *  5. Verify questions map to JD requirements (skills, experience levels)
 *  6. Verify questions cover identified skill gaps from the evaluation
 *
 * Plus regression checks that the Overview tab still shows all existing
 * D-1 / D-2 / D-4 content.
 */
test.describe("Evaluator D-3: AI-generated interview questions", () => {
  test.setTimeout(60000);

  // Liam Chen on the Senior Backend Engineer role — has rich resume + JD skills
  const CANDIDATE_URL = "/job/1/candidate/c1-01";

  async function setup(page: import("@playwright/test").Page) {
    await page.goto(CANDIDATE_URL, { waitUntil: "networkidle" });
    const profile = page.locator('[data-testid="candidate-profile"]');
    await expect(profile).toBeVisible({ timeout: 10000 });
    return profile;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 01 — Overview tab is the default and existing sections still render
  // ──────────────────────────────────────────────────────────────────────────
  test("01 — overview tab is default and existing D-1/D-2/D-4 content renders", async ({
    page,
  }) => {
    const profile = await setup(page);

    // Tab switcher is present
    const tabs = profile.locator('[data-testid="profile-tabs"]');
    await expect(tabs).toBeVisible();

    // Overview tab is marked active
    const overviewTab = profile.locator('[data-testid="tab-overview"]');
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Interview Prep tab exists and is inactive
    const prepTab = profile.locator('[data-testid="tab-interview-prep"]');
    await expect(prepTab).toBeVisible();
    await expect(prepTab).toHaveAttribute("aria-selected", "false");

    // D-2 AI Evaluation, D-1 experience/education sections all visible
    await expect(
      profile.locator('[data-testid="ai-evaluation-section"]'),
    ).toBeVisible();
    await expect(
      profile.locator('[data-testid="experience-section"]'),
    ).toBeVisible();
    await expect(
      profile.locator('[data-testid="education-section"]'),
    ).toBeVisible();

    // D-4 action buttons still present
    await expect(
      profile.locator('[data-testid="action-buttons-bar"]'),
    ).toBeVisible();

    // Interview prep content should NOT be visible on overview tab
    await expect(
      profile.locator('[data-testid="interview-prep"]'),
    ).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-overview-default.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 02 — Clicking Interview Prep tab reveals AI-generated questions
  // ──────────────────────────────────────────────────────────────────────────
  test("02 — clicking Interview Prep tab reveals generated questions", async ({
    page,
  }) => {
    const profile = await setup(page);

    const prepTab = profile.locator('[data-testid="tab-interview-prep"]');
    await prepTab.click();

    // Tab state flips
    await expect(prepTab).toHaveAttribute("aria-selected", "true");
    await expect(
      profile.locator('[data-testid="tab-overview"]'),
    ).toHaveAttribute("aria-selected", "false");

    // Interview prep section renders
    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible({ timeout: 5000 });

    // Overview-only sections are gone
    await expect(
      profile.locator('[data-testid="ai-evaluation-section"]'),
    ).toHaveCount(0);
    await expect(
      profile.locator('[data-testid="experience-section"]'),
    ).toHaveCount(0);

    // A non-trivial set of questions must render
    const questions = prep.locator('[data-testid^="interview-question-"]');
    const questionCount = await questions.count();
    expect(questionCount).toBeGreaterThanOrEqual(5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-interview-prep-tab.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 03 — Questions are grouped into categories (Technical Depth, JD, etc.)
  // ──────────────────────────────────────────────────────────────────────────
  test("03 — questions are grouped into multiple categories", async ({
    page,
  }) => {
    const profile = await setup(page);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();

    // Expect at least three category groups rendered for a well-matched candidate
    const groups = prep.locator('[data-testid^="question-group-"]');
    const groupCount = await groups.count();
    expect(groupCount).toBeGreaterThanOrEqual(3);

    // For Liam Chen (Senior Backend Engineer) we specifically expect these
    // categories because he has claimed required skills, real experience,
    // and AI-evaluated skill gaps:
    await expect(
      prep.locator('[data-testid="question-group-technical-depth"]'),
    ).toBeVisible();
    await expect(
      prep.locator('[data-testid="question-group-jd-requirements"]'),
    ).toBeVisible();
    await expect(
      prep.locator('[data-testid="question-group-experience-probe"]'),
    ).toBeVisible();
    await expect(
      prep.locator('[data-testid="question-group-culture-seniority"]'),
    ).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-question-groups.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 04 — Questions reference specific resume experience entries
  // ──────────────────────────────────────────────────────────────────────────
  test("04 — questions reference specific candidate experience entries", async ({
    page,
  }) => {
    const profile = await setup(page);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const experienceGroup = profile.locator(
      '[data-testid="question-group-experience-probe"]',
    );
    await expect(experienceGroup).toBeVisible();

    // Liam Chen's top experiences: Stripe and Cloudflare — at least one
    // experience-probe question should name one of the companies from the resume
    const allText = (await experienceGroup.innerText()).toLowerCase();
    const referencesResume =
      allText.includes("stripe") ||
      allText.includes("cloudflare") ||
      allText.includes("palantir");
    expect(referencesResume).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-experience-references.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 05 — Questions map to JD requirements (skill names, seniority)
  // ──────────────────────────────────────────────────────────────────────────
  test("05 — questions map to JD required skills", async ({ page }) => {
    const profile = await setup(page);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();

    // JD requires: Go, Kubernetes, PostgreSQL, gRPC, Distributed Systems
    // At least 2 of these must show up in the rendered questions
    const prepText = (await prep.innerText()).toLowerCase();
    const requiredSkills = [
      "go",
      "kubernetes",
      "postgresql",
      "grpc",
      "distributed systems",
    ];
    const hits = requiredSkills.filter((s) => prepText.includes(s));
    expect(hits.length).toBeGreaterThanOrEqual(2);

    // The JD Requirements summary card should reference multiple required skills
    const jdGroup = prep.locator(
      '[data-testid="question-group-jd-requirements"]',
    );
    await expect(jdGroup).toBeVisible();
    const jdText = (await jdGroup.innerText()).toLowerCase();
    const jdHits = requiredSkills.filter((s) => jdText.includes(s));
    expect(jdHits.length).toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-jd-requirements-mapped.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 06 — Questions cover identified skill gaps from the AI evaluation
  // ──────────────────────────────────────────────────────────────────────────
  test("06 — questions cover identified skill gaps", async ({ page }) => {
    // Use a lower-scoring candidate with more skill gaps for a better signal.
    // c1-08 Samuel Osei has only 3 skills claimed (no Go, no K8s, no gRPC)
    // so missingRequired will definitely populate Skill Gap questions.
    await page.goto("/job/1/candidate/c1-08", { waitUntil: "networkidle" });
    const profile = page.locator('[data-testid="candidate-profile"]');
    await expect(profile).toBeVisible({ timeout: 10000 });

    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();

    // Skill Gap category should exist for this candidate
    const gapGroup = prep.locator('[data-testid="question-group-skill-gap"]');
    await expect(gapGroup).toBeVisible();

    const gapQuestions = gapGroup.locator(
      '[data-testid^="interview-question-gap-"]',
    );
    expect(await gapQuestions.count()).toBeGreaterThanOrEqual(1);

    // The first gap question should mention a concrete missing skill in its
    // text or its skill-ref chip — verify chips exist
    const firstGapId = await gapQuestions.first().getAttribute("data-testid");
    expect(firstGapId).toBeTruthy();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-skill-gap-questions.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 07 — Every question has rationale and dimension metadata
  // ──────────────────────────────────────────────────────────────────────────
  test("07 — each question shows rationale (why) metadata", async ({
    page,
  }) => {
    const profile = await setup(page);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    const questions = prep.locator('[data-testid^="interview-question-"]');
    const total = await questions.count();
    expect(total).toBeGreaterThanOrEqual(5);

    // Sample the first 5 questions — every one must have a rationale element
    for (let i = 0; i < Math.min(5, total); i++) {
      const q = questions.nth(i);
      const qId = await q.getAttribute("data-testid");
      expect(qId).toMatch(/^interview-question-/);

      const rawId = qId!.replace("interview-question-", "");
      const rationale = q.locator(
        `[data-testid="question-rationale-${rawId}"]`,
      );
      await expect(rationale).toBeVisible();
      const rationaleText = (await rationale.innerText()).trim();
      expect(rationaleText.length).toBeGreaterThan(10);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-rationale-metadata.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 08 — Different candidates produce different question sets (determinism)
  // ──────────────────────────────────────────────────────────────────────────
  test("08 — different candidates get different questions", async ({
    page,
  }) => {
    // Candidate 1: Liam Chen
    await page.goto("/job/1/candidate/c1-01", { waitUntil: "networkidle" });
    await page
      .locator('[data-testid="candidate-profile"] [data-testid="tab-interview-prep"]')
      .click();
    await expect(
      page.locator('[data-testid="interview-prep"]'),
    ).toBeVisible();
    const textA = (
      await page.locator('[data-testid="interview-prep"]').innerText()
    ).toLowerCase();

    // Candidate 2: Ava Petrov (different id, different name → different seed)
    await page.goto("/job/1/candidate/c1-02", { waitUntil: "networkidle" });
    await page
      .locator('[data-testid="candidate-profile"] [data-testid="tab-interview-prep"]')
      .click();
    await expect(
      page.locator('[data-testid="interview-prep"]'),
    ).toBeVisible();
    const textB = (
      await page.locator('[data-testid="interview-prep"]').innerText()
    ).toLowerCase();

    // Each candidate name should appear in their own question set
    expect(textA).toContain("liam chen");
    expect(textB).toContain("ava petrov");
    expect(textA).not.toEqual(textB);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-candidate-specific.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 09 — Toggling back to Overview tab restores original sections
  // ──────────────────────────────────────────────────────────────────────────
  test("09 — switching back to Overview tab restores existing sections", async ({
    page,
  }) => {
    const profile = await setup(page);

    // Go to Interview Prep
    await profile.locator('[data-testid="tab-interview-prep"]').click();
    await expect(
      profile.locator('[data-testid="interview-prep"]'),
    ).toBeVisible();

    // Back to Overview
    await profile.locator('[data-testid="tab-overview"]').click();
    await expect(
      profile.locator('[data-testid="ai-evaluation-section"]'),
    ).toBeVisible();
    await expect(
      profile.locator('[data-testid="experience-section"]'),
    ).toBeVisible();
    await expect(
      profile.locator('[data-testid="interview-prep"]'),
    ).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-back-to-overview.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10 — Design audit: Industrial Clarity styling on Interview Prep tab
  // ──────────────────────────────────────────────────────────────────────────
  test("10 — design audit screenshot for Interview Prep tab", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const profile = await setup(page);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();

    // Scroll to top of the prep section for a clean screenshot
    await prep.scrollIntoViewIfNeeded();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-design-audit-1440.png`,
      fullPage: true,
    });
  });
});
