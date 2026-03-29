import { test, expect } from "@playwright/test";

/**
 * D-1 Evaluation: Resume inline preview — structured timeline
 *
 * Tests the candidate profile page at /job/1/candidate/c1-01 (Liam Chen).
 * Validates structured timeline layout, score display, navigation, and design.
 */

test.describe("D-1: Candidate Profile — Structured Timeline", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders candidate profile with all required sections", async ({
    page,
  }) => {
    await page.goto("/job/1/candidate/c1-01");
    await page.waitForLoadState("networkidle");

    // ── Candidate Name ──────────────────────────────────────
    const heading = page.locator(
      '[data-testid="candidate-header"] h1'
    );
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText("Liam Chen");

    // ── AI Match Score: number displayed ────────────────────
    const scoreSection = page.locator('[data-testid="candidate-score"]');
    await expect(scoreSection).toBeVisible();
    const scoreValue = scoreSection.locator(".text-score-lg");
    await expect(scoreValue).toBeVisible();
    await expect(scoreValue).toHaveText("96");

    // ── Score progress bar exists ───────────────────────────
    const scoreBar = page.locator('[data-testid="score-bar"]');
    await expect(scoreBar).toBeVisible();
    const scoreBarFill = scoreBar.locator("> div");
    await expect(scoreBarFill).toBeVisible();

    // ── Score bar color correct for high score (>=80) ───────
    // Score 96 -> should use --score-gradient-high (#D4FF00)
    const barBgColor = await scoreBarFill.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // #D4FF00 = rgb(212, 255, 0)
    expect(barBgColor).toBe("rgb(212, 255, 0)");

    // ── Score bar width proportional to score ───────────────
    const barWidth = await scoreBarFill.evaluate(
      (el) => el.style.width
    );
    expect(barWidth).toBe("96%");

    // ── Pipeline status badge ───────────────────────────────
    const statusBadge = page.locator(
      '[data-testid="pipeline-status-badge"]'
    );
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveText("Interview");

    // ── Work Experience section ─────────────────────────────
    const expSection = page.locator(
      '[data-testid="experience-section"]'
    );
    await expect(expSection).toBeVisible();
    await expect(
      expSection.locator("h2")
    ).toHaveText("Work Experience");

    // ── At least 1 experience entry ─────────────────────────
    const expEntries = expSection.locator("[data-testid^='experience-entry-']");
    const expCount = await expEntries.count();
    expect(expCount).toBeGreaterThanOrEqual(1);
    // Liam Chen has 3 entries (Stripe, Cloudflare, Palantir)
    expect(expCount).toBe(3);

    // ── Experience entries contain company, role, period ─────
    // Verify first entry (Stripe)
    const firstExp = expEntries.nth(0);
    await expect(firstExp.locator("h3")).toHaveText(
      "Staff Backend Engineer"
    );
    await expect(firstExp.locator("p").first()).toContainText("Stripe");
    await expect(firstExp.locator("span.font-mono")).toContainText(
      "2021"
    );

    // Verify second entry (Cloudflare)
    const secondExp = expEntries.nth(1);
    await expect(secondExp.locator("h3")).toHaveText(
      "Senior Software Engineer"
    );
    await expect(secondExp.locator("p").first()).toContainText(
      "Cloudflare"
    );
    await expect(secondExp.locator("span.font-mono")).toContainText(
      "2018"
    );

    // ── Time period uses monospace font ─────────────────────
    const periodSpan = firstExp.locator("span.font-mono");
    const fontFamily = await periodSpan.evaluate(
      (el) => getComputedStyle(el).fontFamily
    );
    // Should contain JetBrains Mono or monospace
    const isMonospace =
      fontFamily.toLowerCase().includes("jetbrains") ||
      fontFamily.toLowerCase().includes("monospace");
    expect(isMonospace).toBe(true);

    // ── Education section ───────────────────────────────────
    const eduSection = page.locator(
      '[data-testid="education-section"]'
    );
    await expect(eduSection).toBeVisible();
    await expect(eduSection.locator("h2")).toHaveText("Education");

    // ── At least 1 education entry ──────────────────────────
    const eduEntries = eduSection.locator("[data-testid^='education-entry-']");
    const eduCount = await eduEntries.count();
    expect(eduCount).toBeGreaterThanOrEqual(1);
    // Liam Chen has 2 entries (CMU, UC Berkeley)
    expect(eduCount).toBe(2);

    // ── Timeline vertical line — Work Experience ────────────
    const expTimelineLine = expSection.locator(
      "div.absolute.left-\\[7px\\]"
    );
    await expect(expTimelineLine).toBeVisible();
    const lineBg = await expTimelineLine.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // Should have a visible background color (not transparent)
    expect(lineBg).not.toBe("rgba(0, 0, 0, 0)");

    // ── Timeline vertical line — Education ──────────────────
    const eduTimelineLine = eduSection.locator(
      "div.absolute.left-\\[7px\\]"
    );
    await expect(eduTimelineLine).toBeVisible();

    // ── Take screenshot of full profile ─────────────────────
    await page.screenshot({
      path: "screenshots/d1-candidate-profile.png",
      fullPage: false,
    });

    // ── Back to pipeline link ───────────────────────────────
    const backLink = page.locator(
      '[data-testid="back-to-pipeline"]'
    );
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText("Back to Pipeline");
    // Verify href
    const href = await backLink.getAttribute("href");
    expect(href).toBe("/job/1/pipeline");

    // ── Scroll to bottom and screenshot ─────────────────────
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Also scroll the inner scrollable container
    const scrollContainer = page.locator(
      '[data-testid="candidate-profile"] .overflow-y-auto'
    );
    if ((await scrollContainer.count()) > 0) {
      await scrollContainer.evaluate((el) =>
        el.scrollTo(0, el.scrollHeight)
      );
    }
    await page.waitForTimeout(300);
    await page.screenshot({
      path: "screenshots/d1-candidate-bottom.png",
      fullPage: false,
    });

    // ── Click back link and verify navigation ───────────────
    await backLink.click();
    await page.waitForURL("**/job/1/pipeline");
    expect(page.url()).toContain("/job/1/pipeline");
  });
});
