import { test, expect, type Page } from "@playwright/test";

/**
 * Evaluator D-3 (independent review)
 *
 * This is the EVALUATOR's own test suite. It exists alongside (not as a
 * replacement for) the Generator's tests/evaluator-d3.spec.ts. The point of
 * this file is to independently re-verify the six features.json test_steps,
 * with extra emphasis on the load-bearing claim that questions are actually
 * GROUNDED in candidate-specific resume content (not just static templates).
 */

const SHOT = "/home/administrator/playground/hirewise/screenshots/evaluator/d3-review";

// Job 1 = Senior Backend Engineer
// JD required skills: Go, Kubernetes, PostgreSQL, gRPC, Distributed Systems
// JD nice-to-have: Rust, Terraform, GraphQL
const JOB1_REQUIRED_SKILLS = [
  "go",
  "kubernetes",
  "postgresql",
  "grpc",
  "distributed systems",
];

// Liam Chen — high-fit, claims Go/K8s/gRPC/PostgreSQL/Distributed Systems
//   experience: Stripe, Cloudflare, Palantir
const LIAM_URL = "/job/1/candidate/c1-01";
const LIAM_COMPANIES = ["stripe", "cloudflare", "palantir"];

// Samuel Osei — only 3 skills (no Go/K8s/gRPC). Missing required ⇒ Skill Gap
//   experience: Andela, Interswitch
const SAMUEL_URL = "/job/1/candidate/c1-08";
const SAMUEL_COMPANIES = ["andela", "interswitch"];
const SAMUEL_OWNED_SKILLS = ["distributed systems", "postgresql", "java"];
// Required skills Samuel does NOT claim:
const SAMUEL_MISSING_REQUIRED = ["go", "kubernetes", "grpc"];

// Closed job = id "6" (Technical Writer). c6-01 has full resume so it should
// not crash even though the job pipeline is frozen.
const CLOSED_CANDIDATE_URL = "/job/6/candidate/c6-01";

async function openProfile(page: Page, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });
  const profile = page.locator('[data-testid="candidate-profile"]');
  await expect(profile).toBeVisible({ timeout: 10000 });
  return profile;
}

test.describe("Evaluator D-3 review — AI-generated interview questions", () => {
  test.setTimeout(60000);

  // ──────────────────────────────────────────────────────────────────────────
  // R-01 — features.json step 1 + regression: page renders, Overview default,
  //         existing D-1/D-2/D-4 sections still present
  // ──────────────────────────────────────────────────────────────────────────
  test("R-01 — overview is default and D-1/D-2/D-4 still render", async ({ page }) => {
    const profile = await openProfile(page, LIAM_URL);

    // Tab strip exists
    await expect(profile.locator('[data-testid="profile-tabs"]')).toBeVisible();
    await expect(profile.locator('[data-testid="tab-overview"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(profile.locator('[data-testid="tab-interview-prep"]')).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Existing D-2/D-1/D-4 surfaces still render on default tab
    await expect(profile.locator('[data-testid="ai-evaluation-section"]')).toBeVisible();
    await expect(profile.locator('[data-testid="experience-section"]')).toBeVisible();
    await expect(profile.locator('[data-testid="education-section"]')).toBeVisible();
    await expect(profile.locator('[data-testid="action-buttons-bar"]')).toBeVisible();

    // Interview Prep section should NOT be in DOM yet
    await expect(profile.locator('[data-testid="interview-prep"]')).toHaveCount(0);

    await page.screenshot({ path: `${SHOT}/r01-overview-default.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-02 — features.json step 2 + 3: clicking Interview Prep tab reveals a
  //         non-trivial list of questions; URL does not change; tab styling
  //         flips with accent-primary indicator
  // ──────────────────────────────────────────────────────────────────────────
  test("R-02 — Interview Prep tab reveals questions, URL stable, accent active", async ({ page }) => {
    const profile = await openProfile(page, LIAM_URL);
    const urlBefore = page.url();

    const prepTab = profile.locator('[data-testid="tab-interview-prep"]');
    await prepTab.click();

    // URL must not change (tab is client-side state, not navigation)
    expect(page.url()).toBe(urlBefore);

    // ARIA + data-state both flipped
    await expect(prepTab).toHaveAttribute("aria-selected", "true");
    await expect(prepTab).toHaveAttribute("data-state", "active");
    await expect(profile.locator('[data-testid="tab-overview"]')).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Wait until the React re-render swaps the className from text-text-muted
    // to text-accent-primary.
    await expect(prepTab).toHaveClass(/text-accent-primary/);
    // The button has `transition-colors duration-150` which makes a snapshot
    // of getComputedStyle().color race the transition. Wait long enough for
    // the transition to settle, then sample.
    await page.waitForTimeout(400);
    const activeColor = await prepTab.evaluate(
      (el) => getComputedStyle(el).color,
    );
    // Tailwind "text-accent-primary" → rgb(212, 255, 0)
    expect(activeColor).toMatch(/rgb\(\s*212,\s*255,\s*0\s*\)/);

    // The active underline indicator must exist (the <span> Generator renders
    // when isActive). Verifies the visual accent bar at the bottom of the tab.
    const underline = prepTab.locator("span[aria-hidden='true']");
    await expect(underline).toHaveCount(1);
    const underlineBg = await underline.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(underlineBg).toMatch(/rgb\(\s*212,\s*255,\s*0\s*\)/);

    // Interview Prep section appears
    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();

    // At least 5 question cards
    const qs = prep.locator('[data-testid^="interview-question-"]');
    expect(await qs.count()).toBeGreaterThanOrEqual(5);

    await page.screenshot({ path: `${SHOT}/r02-tab-active-questions.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-03 — Multiple distinct category groups exist (visible)
  // ──────────────────────────────────────────────────────────────────────────
  test("R-03 — at least 3 category groups visible for high-fit candidate", async ({ page }) => {
    const profile = await openProfile(page, LIAM_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    const groups = prep.locator('[data-testid^="question-group-"]');
    const groupCount = await groups.count();
    expect(groupCount).toBeGreaterThanOrEqual(3);

    await page.screenshot({ path: `${SHOT}/r03-question-groups.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-04 — features.json step 4 (CRITICAL):
  //         At least one question text references a SPECIFIC piece of the
  //         candidate's resume (company name from their experience array).
  //         This is the "grounding" claim — the heart of D-3.
  // ──────────────────────────────────────────────────────────────────────────
  test("R-04 — at least one question text references a real candidate company", async ({ page }) => {
    const profile = await openProfile(page, LIAM_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    const allText = (await prep.innerText()).toLowerCase();

    // Liam's actual companies must show up at least once
    const matches = LIAM_COMPANIES.filter((c) => allText.includes(c));
    expect(matches.length, `Expected questions to reference at least one of ${LIAM_COMPANIES.join(", ")}`).toBeGreaterThanOrEqual(1);

    // Specifically the Experience Probe group must reference one
    const expGroup = prep.locator('[data-testid="question-group-experience-probe"]');
    await expect(expGroup).toBeVisible();
    const expText = (await expGroup.innerText()).toLowerCase();
    const expMatches = LIAM_COMPANIES.filter((c) => expText.includes(c));
    expect(expMatches.length).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: `${SHOT}/r04-resume-grounding.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-05 — features.json step 5: at least one question maps to a JD required
  //         skill, AND that mapping is reflected in the rendered question text
  //         (not only in a hidden tag).
  // ──────────────────────────────────────────────────────────────────────────
  test("R-05 — at least one question references a JD required skill", async ({ page }) => {
    const profile = await openProfile(page, LIAM_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    const allText = (await prep.innerText()).toLowerCase();
    const skillHits = JOB1_REQUIRED_SKILLS.filter((s) => allText.includes(s));
    expect(
      skillHits.length,
      `Expected at least 2 of ${JOB1_REQUIRED_SKILLS.join(", ")} in question text`,
    ).toBeGreaterThanOrEqual(2);

    // The Technical Depth group should specifically anchor to required skills
    const techGroup = prep.locator('[data-testid="question-group-technical-depth"]');
    await expect(techGroup).toBeVisible();
    const techText = (await techGroup.innerText()).toLowerCase();
    const techHits = JOB1_REQUIRED_SKILLS.filter((s) => techText.includes(s));
    expect(techHits.length).toBeGreaterThanOrEqual(1);

    await page.screenshot({ path: `${SHOT}/r05-jd-skill-mapping.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-06 — features.json step 6 (CRITICAL): Skill Gap questions for
  //         Samuel Osei must reference a skill that is genuinely missing,
  //         i.e. ⊂ JD.required \ candidate.skills, NOT a random skill the
  //         candidate already has.
  // ──────────────────────────────────────────────────────────────────────────
  test("R-06 — skill-gap questions name a truly missing required skill", async ({ page }) => {
    const profile = await openProfile(page, SAMUEL_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    const gapGroup = prep.locator('[data-testid="question-group-skill-gap"]');
    await expect(gapGroup).toBeVisible();

    const gapQuestions = gapGroup.locator('[data-testid^="interview-question-gap-"]');
    const gapCount = await gapQuestions.count();
    expect(gapCount).toBeGreaterThanOrEqual(1);

    // Collect text of every gap question
    const gapTexts: string[] = [];
    for (let i = 0; i < gapCount; i++) {
      gapTexts.push((await gapQuestions.nth(i).innerText()).toLowerCase());
    }
    const allGapText = gapTexts.join(" || ");

    // At least one gap question must name a skill Samuel does NOT have
    const namesMissingSkill = SAMUEL_MISSING_REQUIRED.some((s) => allGapText.includes(s));
    expect(
      namesMissingSkill,
      `Expected one of ${SAMUEL_MISSING_REQUIRED.join(", ")} to appear in skill-gap questions. Got: ${allGapText.slice(0, 400)}`,
    ).toBe(true);

    // Negative-sanity: a gap question should NOT pretend the candidate is
    // missing PostgreSQL (which they actually have).
    // We allow PostgreSQL to appear elsewhere, but not framed as a missing skill
    // in the gap-probe templates ("don't see it", "missing").
    const fakeGapAboutPostgres = gapTexts.some(
      (t) => t.includes("postgresql") && (t.includes("don't see") || t.includes("don't list")),
    );
    expect(fakeGapAboutPostgres, "Gap question wrongly frames an owned skill as missing").toBe(false);

    await page.screenshot({ path: `${SHOT}/r06-skill-gap-grounded.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-07 — Determinism + per-candidate variation:
  //         Two different candidates produce two different question sets.
  //         Same candidate produces the same set on a re-load.
  // ──────────────────────────────────────────────────────────────────────────
  test("R-07 — different candidates → different questions; same candidate → stable", async ({ page }) => {
    // First load Liam
    const liamProfile = await openProfile(page, LIAM_URL);
    await liamProfile.locator('[data-testid="tab-interview-prep"]').click();
    const liamText1 = (await page.locator('[data-testid="interview-prep"]').innerText()).toLowerCase();

    // Second load Samuel
    const samuelProfile = await openProfile(page, SAMUEL_URL);
    await samuelProfile.locator('[data-testid="tab-interview-prep"]').click();
    const samuelText = (await page.locator('[data-testid="interview-prep"]').innerText()).toLowerCase();

    // Re-load Liam to confirm determinism
    const liamProfile2 = await openProfile(page, LIAM_URL);
    await liamProfile2.locator('[data-testid="tab-interview-prep"]').click();
    const liamText2 = (await page.locator('[data-testid="interview-prep"]').innerText()).toLowerCase();

    // Liam's two loads must be identical (deterministic engine)
    expect(liamText1).toBe(liamText2);

    // Liam vs Samuel must be DIFFERENT
    expect(liamText1).not.toBe(samuelText);

    // The candidate name should appear in their own header
    expect(liamText1).toContain("liam chen");
    expect(samuelText).toContain("samuel osei");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-08 — Closed job candidate page does not crash and still renders prep
  // ──────────────────────────────────────────────────────────────────────────
  test("R-08 — closed-job candidate profile still renders Interview Prep", async ({ page }) => {
    const profile = await openProfile(page, CLOSED_CANDIDATE_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();
    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();

    // At minimum the Culture & Seniority group always emits
    await expect(
      prep.locator('[data-testid="question-group-culture-seniority"]'),
    ).toBeVisible();

    // Page should not have any console errors that broke React
    await page.screenshot({ path: `${SHOT}/r08-closed-job-candidate.png`, fullPage: true });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-09 — Every question card has the "Why" rationale row
  // ──────────────────────────────────────────────────────────────────────────
  test("R-09 — every visible question card has a Why rationale", async ({ page }) => {
    const profile = await openProfile(page, LIAM_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    const cards = prep.locator('[data-testid^="interview-question-"]');
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(5);

    // Every card must contain its rationale element with a non-trivial body
    for (let i = 0; i < total; i++) {
      const card = cards.nth(i);
      const cardId = await card.getAttribute("data-testid");
      const rawId = cardId!.replace("interview-question-", "");
      const rat = card.locator(`[data-testid="question-rationale-${rawId}"]`);
      await expect(rat).toBeVisible();
      const text = (await rat.innerText()).trim();
      expect(text.length).toBeGreaterThan(15);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // R-10 — Design audit screenshots: 1440x900 full page + closeup of one card
  // ──────────────────────────────────────────────────────────────────────────
  test("R-10 — design audit at 1440x900 + question-card closeup", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const profile = await openProfile(page, LIAM_URL);
    await profile.locator('[data-testid="tab-interview-prep"]').click();

    const prep = profile.locator('[data-testid="interview-prep"]');
    await expect(prep).toBeVisible();
    await prep.scrollIntoViewIfNeeded();

    await page.screenshot({ path: `${SHOT}/r10-design-1440-full.png`, fullPage: true });

    // Closeup: first question card
    const firstCard = prep.locator('[data-testid^="interview-question-"]').first();
    await firstCard.scrollIntoViewIfNeeded();
    const box = await firstCard.boundingBox();
    if (box) {
      await page.screenshot({
        path: `${SHOT}/r10-card-closeup.png`,
        clip: {
          x: Math.max(0, box.x - 16),
          y: Math.max(0, box.y - 16),
          width: Math.min(1440, box.width + 32),
          height: box.height + 32,
        },
      });
    }
  });
});
