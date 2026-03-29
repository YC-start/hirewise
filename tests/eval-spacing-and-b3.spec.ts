import { test, expect } from "@playwright/test";

/**
 * Spacing Fix Verification + B-3 Quick-Create Job Modal + Visual Audit
 *
 * Part 1: Tailwind v4 spacing fix verification
 *   - Dashboard: main content padding, job card padding, stat card padding
 *   - Pipeline: candidate row padding, JD rail padding
 *   - Candidate profile: content area padding, section margin
 *
 * Part 2: B-3 Quick-create job modal functional test
 *   - Open modal, verify padding/spacing inside modal + inputs
 *   - Fill form, submit, verify new job appears
 *
 * Part 3: Screenshots for visual audit (read externally)
 */

test.use({ viewport: { width: 1280, height: 800 } });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 1 — Spacing Fix Verification
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Part 1 — Spacing Fix Verification", () => {
  test("Dashboard: main content, job card, and stat card padding are all > 0", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    // ── 1a. Main content area padding ──────────────────────────────────────
    // The dashboard content wrapper is the parent div.p-6 of job-grid-view
    const mainContentPadding = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="job-grid-view"]');
      if (!grid || !grid.parentElement) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const style = window.getComputedStyle(grid.parentElement);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[Dashboard] Main content padding:", JSON.stringify(mainContentPadding));

    const mainPaddingLeft = parseFloat(mainContentPadding.left);
    const mainPaddingTop = parseFloat(mainContentPadding.top);

    expect(mainPaddingLeft, "Main content padding-left must be > 0").toBeGreaterThan(0);
    expect(mainPaddingTop, "Main content padding-top must be > 0").toBeGreaterThan(0);

    // ── 1b. Job card internal padding ──────────────────────────────────────
    const jobCardPadding = await page.evaluate(() => {
      const card = document.querySelector('[data-testid^="job-card-"]');
      if (!card) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const style = window.getComputedStyle(card);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[Dashboard] Job card padding:", JSON.stringify(jobCardPadding));

    const jobCardPL = parseFloat(jobCardPadding.left);
    const jobCardPT = parseFloat(jobCardPadding.top);

    expect(jobCardPL, "Job card padding-left must be > 0").toBeGreaterThan(0);
    expect(jobCardPT, "Job card padding-top must be > 0").toBeGreaterThan(0);

    // ── 1c. Stat card internal padding ─────────────────────────────────────
    const statCardPadding = await page.evaluate(() => {
      // Stat cards are .border.border-border-default.bg-surface-secondary.p-3 elements
      // within the stats grid (grid-cols-2 md:grid-cols-4)
      const statsGrid = document.querySelector('[data-testid="job-grid-view"]')
        ?.parentElement?.querySelector(".grid.grid-cols-2");
      if (!statsGrid) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const firstCard = statsGrid.querySelector(".border");
      if (!firstCard) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const style = window.getComputedStyle(firstCard);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[Dashboard] Stat card padding:", JSON.stringify(statCardPadding));

    const statPL = parseFloat(statCardPadding.left);
    const statPT = parseFloat(statCardPadding.top);

    expect(statPL, "Stat card padding-left must be > 0").toBeGreaterThan(0);
    expect(statPT, "Stat card padding-top must be > 0").toBeGreaterThan(0);

    // ── Screenshot ─────────────────────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/spacing-fix-dashboard.png",
      fullPage: true,
    });
  });

  test("Pipeline: candidate row padding and JD rail padding are > 0", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // ── 2a. Candidate row padding ──────────────────────────────────────────
    const candidateRowPadding = await page.evaluate(() => {
      const row = document.querySelector('[data-testid^="candidate-row-"]');
      if (!row) return { left: "0px", top: "0px", right: "0px", bottom: "0px", height: "0px" };
      const style = window.getComputedStyle(row);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
        height: style.height,
      };
    });

    console.log("[Pipeline] Candidate row padding:", JSON.stringify(candidateRowPadding));

    // Candidate rows use px-4 (paddingLeft/Right) and h-[42px] so at least horizontal padding must exist
    const rowPL = parseFloat(candidateRowPadding.left);
    const rowPR = parseFloat(candidateRowPadding.right);

    expect(rowPL, "Candidate row padding-left must be > 0").toBeGreaterThan(0);
    expect(rowPR, "Candidate row padding-right must be > 0").toBeGreaterThan(0);

    // ── 2b. JD rail internal padding ───────────────────────────────────────
    const jdRailPadding = await page.evaluate(() => {
      const rail = document.querySelector('[data-testid="jd-context-rail"]');
      if (!rail) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      // The rail has a scrollable inner div with p-4
      const innerDiv = rail.querySelector(".overflow-y-auto");
      if (!innerDiv) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const style = window.getComputedStyle(innerDiv);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[Pipeline] JD rail inner padding:", JSON.stringify(jdRailPadding));

    const railPL = parseFloat(jdRailPadding.left);
    const railPT = parseFloat(jdRailPadding.top);

    expect(railPL, "JD rail padding-left must be > 0").toBeGreaterThan(0);
    expect(railPT, "JD rail padding-top must be > 0").toBeGreaterThan(0);

    // ── Screenshot ─────────────────────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/spacing-fix-pipeline.png",
      fullPage: true,
    });
  });

  test("Candidate profile: content area padding and section margins are > 0", async ({
    page,
  }) => {
    await page.goto("/job/1/candidate/c1-01");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // ── 3a. Profile content area padding ───────────────────────────────────
    // The scrollable content area has max-w-[960px] mx-auto px-4 py-6
    const profilePadding = await page.evaluate(() => {
      const profile = document.querySelector('[data-testid="candidate-profile"]');
      if (!profile) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      // The main content wrapper is inside .overflow-y-auto > div.max-w-[960px]
      const scrollArea = profile.querySelector(".overflow-y-auto");
      if (!scrollArea) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const contentWrapper = scrollArea.querySelector(".mx-auto");
      if (!contentWrapper) return { left: "0px", top: "0px", right: "0px", bottom: "0px" };
      const style = window.getComputedStyle(contentWrapper);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[Profile] Content area padding:", JSON.stringify(profilePadding));

    const profilePL = parseFloat(profilePadding.left);
    const profilePT = parseFloat(profilePadding.top);

    expect(profilePL, "Profile content padding-left must be > 0").toBeGreaterThan(0);
    expect(profilePT, "Profile content padding-top must be > 0").toBeGreaterThan(0);

    // ── 3b. Section-to-section margin ──────────────────────────────────────
    // Sections use mb-8 (margin-bottom: 32px typically)
    const sectionMargin = await page.evaluate(() => {
      const headerSection = document.querySelector('[data-testid="candidate-header"]');
      if (!headerSection) return { marginBottom: "0px" };
      const style = window.getComputedStyle(headerSection);
      return { marginBottom: style.marginBottom };
    });

    console.log("[Profile] Candidate header section margin-bottom:", sectionMargin.marginBottom);

    const sectionMB = parseFloat(sectionMargin.marginBottom);
    expect(sectionMB, "Section margin-bottom must be > 0").toBeGreaterThan(0);

    // ── Screenshot ─────────────────────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/spacing-fix-profile.png",
      fullPage: true,
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 2 — B-3 Quick-Create Job Modal
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Part 2 — B-3 Quick-Create Job Modal", () => {
  test("Full flow: open modal, verify spacing, fill form, submit, verify new job", async ({
    page,
  }) => {
    // ── Step 1: Navigate to dashboard ────────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    // ── Step 2: Click "+ New Job" ────────────────────────────────────────
    const newJobBtn = page.locator('[data-testid="new-job-btn"]');
    await expect(newJobBtn).toBeVisible();
    await newJobBtn.click();

    // ── Step 3: Validate modal appeared ──────────────────────────────────
    const modal = page.locator('[data-testid="quick-create-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // ── Step 4: Check modal internal padding ─────────────────────────────
    const modalPadding = await modal.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[B-3] Modal padding:", JSON.stringify(modalPadding));

    const modalPL = parseFloat(modalPadding.left);
    const modalPT = parseFloat(modalPadding.top);

    expect(modalPL, "Modal padding-left must be > 0").toBeGreaterThan(0);
    expect(modalPT, "Modal padding-top must be > 0").toBeGreaterThan(0);

    // ── Step 5: Check input internal padding ─────────────────────────────
    const titleInput = page.locator('[data-testid="input-job-title"]');
    await expect(titleInput).toBeVisible();

    const inputPadding = await titleInput.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        left: style.paddingLeft,
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log("[B-3] Input padding:", JSON.stringify(inputPadding));

    const inputPL = parseFloat(inputPadding.left);
    expect(inputPL, "Input padding-left must be > 0").toBeGreaterThan(0);

    // ── Screenshot: modal spacing ────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/b3-modal-spacing.png",
      fullPage: false,
    });

    // ── Step 6: Fill form fields ─────────────────────────────────────────
    await titleInput.fill("AI Research Engineer");
    await expect(titleInput).toHaveValue("AI Research Engineer");

    // Department: Engineering
    const deptSelect = page.locator('[data-testid="select-department"]');
    await deptSelect.selectOption("Engineering");
    await expect(deptSelect).toHaveValue("Engineering");

    // Seniority: Senior
    const senioritySelect = page.locator('[data-testid="select-seniority"]');
    await senioritySelect.selectOption("Senior");
    await expect(senioritySelect).toHaveValue("Senior");

    // ── Step 7: Submit ───────────────────────────────────────────────────
    const submitBtn = page.locator('[data-testid="modal-submit-btn"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // ── Step 8: Verify modal closed ──────────────────────────────────────
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // ── Step 9: Verify new job appears on dashboard ──────────────────────
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 5000,
    });

    const newJobCard = page.locator("text=AI Research Engineer");
    await expect(newJobCard).toBeVisible({ timeout: 5000 });

    // ── Screenshot: after create ─────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/b3-after-create.png",
      fullPage: false,
    });
  });
});
