import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/evaluator-d1-eval";

/**
 * Evaluator D-1: Resume inline preview (structured timeline)
 *
 * Target URL: /job/1/candidate/c1-01 (Liam Chen)
 * Expected data (from mock-candidates.ts):
 *   - 3 work experience: Stripe (2021-Present), Cloudflare (2018-2021), Palantir (2015-2018)
 *   - 2 education: Carnegie Mellon (M.S. CS, 2015), UC Berkeley (B.S. EECS, 2013)
 *   - 2 certifications: CKA, AWS Solutions Architect
 *   - matchScore: 96, pipelineStatus: Interview
 *
 * All selectors scope to data-testid="candidate-profile" (main area component).
 */

test.describe("Evaluator D-1: Resume inline preview", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  const URL = "/job/1/candidate/c1-01";

  async function loadProfile(page: import("@playwright/test").Page) {
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const profile = page.locator('[data-testid="candidate-profile"]');
    await expect(profile).toBeVisible({ timeout: 10000 });
    return profile;
  }

  // ── T1: Candidate Profile page renders (desktop 1280x800) ──

  test("T1: candidate profile page renders with name and score", async ({ page }) => {
    const profile = await loadProfile(page);

    // Screenshot of initial load
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t1-profile-loaded.png`,
      fullPage: false,
    });

    // Verify candidate name is visible
    const header = profile.locator('[data-testid="candidate-header"]');
    await expect(header).toBeVisible();
    const headerText = await header.textContent();
    expect(headerText).toContain("Liam Chen");
    console.log("T1: Candidate name 'Liam Chen' is visible.");

    // Verify AI match score is visible
    const scoreEl = profile.locator('[data-testid="candidate-score"]');
    await expect(scoreEl).toBeVisible();
    const scoreText = await scoreEl.textContent();
    expect(scoreText).toContain("96");
    console.log(`T1: AI match score text: "${scoreText?.trim()}"`);

    console.log("T1 PASS: Candidate profile renders with name and AI match score.");
  });

  // ── T2: Work experience timeline ──

  test("T2: work experience timeline with reverse chronological order and monospace dates", async ({ page }) => {
    const profile = await loadProfile(page);

    // Verify experience section exists
    const expSection = profile.locator('[data-testid="experience-section"]');
    await expect(expSection).toBeVisible({ timeout: 5000 });

    // Count experience entries — we expect 3 for Liam Chen
    const entries = expSection.locator('[data-testid^="experience-entry-"]');
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(2);
    console.log(`T2: Found ${count} experience entries.`);

    // Verify reverse chronological order by checking innerHTML position
    const sectionHtml = await expSection.innerHTML();
    const stripeIdx = sectionHtml.indexOf("Stripe");
    const cloudflareIdx = sectionHtml.indexOf("Cloudflare");
    const palantirIdx = sectionHtml.indexOf("Palantir");

    expect(stripeIdx).toBeGreaterThan(-1);
    expect(cloudflareIdx).toBeGreaterThan(-1);
    expect(palantirIdx).toBeGreaterThan(-1);
    expect(stripeIdx).toBeLessThan(cloudflareIdx);
    expect(cloudflareIdx).toBeLessThan(palantirIdx);
    console.log("T2: Entries in reverse chronological order (Stripe > Cloudflare > Palantir).");

    // Verify time period text uses monospace font
    const periodEl = expSection.locator(".font-mono").first();
    await expect(periodEl).toBeVisible();
    const fontFamily = await periodEl.evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );
    const isMonospace =
      fontFamily.toLowerCase().includes("jetbrains mono") ||
      fontFamily.toLowerCase().includes("monospace");
    expect(isMonospace).toBeTruthy();
    console.log(`T2: Time period font-family: ${fontFamily}`);

    // Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t2-experience-timeline.png`,
      fullPage: false,
    });

    console.log("T2 PASS: Work experience timeline is correct.");
  });

  // ── T3: Education section ──

  test("T3: education entries are present", async ({ page }) => {
    const profile = await loadProfile(page);

    // Scroll to education section
    const scrollArea = profile.locator(".overflow-y-auto");
    if ((await scrollArea.count()) > 0) {
      await scrollArea.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }

    const eduSection = profile.locator('[data-testid="education-section"]');
    await expect(eduSection).toBeVisible({ timeout: 5000 });

    const eduEntries = eduSection.locator('[data-testid^="education-entry-"]');
    const count = await eduEntries.count();
    expect(count).toBeGreaterThanOrEqual(1);
    console.log(`T3: Found ${count} education entries.`);

    const eduText = await eduSection.textContent();
    expect(eduText).toContain("Carnegie Mellon");
    expect(eduText).toContain("UC Berkeley");
    console.log("T3: Education entries contain Carnegie Mellon and UC Berkeley.");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t3-education.png`,
      fullPage: false,
    });

    console.log("T3 PASS: Education entries are present.");
  });

  // ── T4: Certifications section ──

  test("T4: certifications entries are present", async ({ page }) => {
    const profile = await loadProfile(page);

    // Scroll to certifications section
    const scrollArea = profile.locator(".overflow-y-auto");
    if ((await scrollArea.count()) > 0) {
      await scrollArea.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }

    const certSection = profile.locator('[data-testid="certifications-section"]');
    await expect(certSection).toBeVisible({ timeout: 5000 });

    const certEntries = certSection.locator('[data-testid="certification-entry"]');
    const count = await certEntries.count();
    expect(count).toBeGreaterThanOrEqual(1);
    console.log(`T4: Found ${count} certification entries.`);

    const certText = await certSection.textContent();
    expect(certText).toContain("Kubernetes");
    console.log("T4: Certification text includes Kubernetes-related cert.");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t4-certifications.png`,
      fullPage: false,
    });

    console.log("T4 PASS: Certifications entries are present.");
  });

  // ── T5: Section headers styling (uppercase + letter-spacing) ──

  test("T5: section headers use uppercase and letter-spacing", async ({ page }) => {
    const profile = await loadProfile(page);

    // Check experience section header
    const expHeader = profile.locator('[data-testid="experience-section"] h2.table-header');
    await expect(expHeader).toBeVisible();

    const expStyles = await expHeader.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        textTransform: cs.textTransform,
        letterSpacing: cs.letterSpacing,
        fontSize: cs.fontSize,
      };
    });

    expect(expStyles.textTransform).toBe("uppercase");
    const spacing = parseFloat(expStyles.letterSpacing);
    expect(spacing).toBeGreaterThan(0);
    console.log(`T5: Experience header — textTransform=${expStyles.textTransform}, letterSpacing=${expStyles.letterSpacing}, fontSize=${expStyles.fontSize}`);

    // Check education section header too
    const scrollArea = profile.locator(".overflow-y-auto");
    if ((await scrollArea.count()) > 0) {
      await scrollArea.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }

    const eduHeader = profile.locator('[data-testid="education-section"] h2.table-header');
    if ((await eduHeader.count()) > 0) {
      const eduStyles = await eduHeader.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { textTransform: cs.textTransform, letterSpacing: cs.letterSpacing };
      });
      expect(eduStyles.textTransform).toBe("uppercase");
      console.log(`T5: Education header — textTransform=${eduStyles.textTransform}, letterSpacing=${eduStyles.letterSpacing}`);
    }

    // Check certifications section header
    const certHeader = profile.locator('[data-testid="certifications-section"] h2.table-header');
    if ((await certHeader.count()) > 0) {
      const certStyles = await certHeader.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { textTransform: cs.textTransform, letterSpacing: cs.letterSpacing };
      });
      expect(certStyles.textTransform).toBe("uppercase");
      console.log(`T5: Certifications header — textTransform=${certStyles.textTransform}, letterSpacing=${certStyles.letterSpacing}`);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t5-section-headers.png`,
      fullPage: false,
    });

    console.log("T5 PASS: Section headers use uppercase and letter-spacing.");
  });

  // ── T6: Full page screenshot for design review ──

  test("T6: full page screenshot for design review", async ({ page }) => {
    const profile = await loadProfile(page);

    // Top of the page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t6-design-review-top.png`,
      fullPage: false,
    });

    // Scroll to middle
    const scrollArea = profile.locator(".overflow-y-auto");
    if ((await scrollArea.count()) > 0) {
      await scrollArea.evaluate((el) => el.scrollTo(0, el.scrollHeight / 2));
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t6-design-review-mid.png`,
      fullPage: false,
    });

    // Scroll to bottom
    if ((await scrollArea.count()) > 0) {
      await scrollArea.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t6-design-review-bottom.png`,
      fullPage: false,
    });

    // Also take a full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/t6-design-review-fullpage.png`,
      fullPage: true,
    });

    console.log("T6: Screenshots captured for design review.");
  });
});
