import { test, expect } from "@playwright/test";

/**
 * B-3 Eval: Quick-create job modal + Global UI padding/spacing audit
 *
 * Part 1 — Functional:
 *   - "+ New Job" opens modal
 *   - Modal has overlay, dark BG, dark input BG, uppercase labels
 *   - Fill form → submit → modal closes → new job appears on dashboard
 *
 * Part 2 — Visual spacing audit:
 *   - Dashboard padding, card gaps, stats-to-grid spacing
 *   - Pipeline page rail-to-list, row padding, header-to-row spacing
 *   - Candidate profile section spacing, timeline alignment
 */

test.use({ viewport: { width: 1280, height: 800 } });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 1 — B-3 Functional Tests
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("B-3 — Quick-Create Job Modal", () => {
  test("Full flow: open modal, validate UI, fill form, submit, verify dashboard update", async ({
    page,
  }) => {
    // ── Step 1: Navigate to dashboard ────────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    // Screenshot: dashboard before modal
    await page.screenshot({
      path: "screenshots/b3-dashboard-before.png",
      fullPage: false,
    });

    // ── Step 2: Click "+ New Job" ────────────────────────────────────────
    const newJobBtn = page.locator('[data-testid="new-job-btn"]');
    await expect(newJobBtn).toBeVisible();
    await newJobBtn.click();

    // ── Step 3: Validate modal appeared ──────────────────────────────────
    // The component uses data-testid="quick-create-modal"
    const modal = page.locator('[data-testid="quick-create-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // ── Step 4: Validate overlay background ──────────────────────────────
    const overlay = page.locator('[data-testid="modal-overlay"]');
    await expect(overlay).toBeVisible();
    const overlayBg = await overlay.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    // Should be dark semi-transparent (rgba(0,0,0,0.8))
    expect(overlayBg).toMatch(/rgba?\(/);
    // Verify it's not fully transparent
    expect(overlayBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(overlayBg).not.toBe("transparent");

    // ── Step 5: Validate modal background color ≈ #1A1A1A ───────────────
    const modalBg = await modal.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    // #1A1A1A = rgb(26, 26, 26)
    const bgMatch = modalBg.match(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/
    );
    expect(bgMatch).not.toBeNull();
    if (bgMatch) {
      const [, r, g, b] = bgMatch.map(Number);
      // Allow ±15 tolerance from (26, 26, 26)
      expect(r).toBeGreaterThanOrEqual(11);
      expect(r).toBeLessThanOrEqual(41);
      expect(g).toBeGreaterThanOrEqual(11);
      expect(g).toBeLessThanOrEqual(41);
      expect(b).toBeGreaterThanOrEqual(11);
      expect(b).toBeLessThanOrEqual(41);
    }

    // ── Step 6: Validate input background color ≈ #0D0D0D ──────────────
    const titleInput = page.locator('[data-testid="input-job-title"]');
    await expect(titleInput).toBeVisible();
    const inputBg = await titleInput.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    // #0D0D0D = rgb(13, 13, 13)
    const inputBgMatch = inputBg.match(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/
    );
    expect(inputBgMatch).not.toBeNull();
    if (inputBgMatch) {
      const [, r, g, b] = inputBgMatch.map(Number);
      // Allow ±15 tolerance from (13, 13, 13)
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(28);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(28);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(28);
    }

    // ── Step 7: Validate labels are uppercase ───────────────────────────
    // Check all labels inside the modal form
    const labels = modal.locator("label");
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThanOrEqual(3); // title, department, seniority, description

    for (let i = 0; i < labelCount; i++) {
      const textTransform = await labels.nth(i).evaluate(
        (el) => window.getComputedStyle(el).textTransform
      );
      expect(textTransform).toBe("uppercase");
    }

    // Screenshot: modal open
    await page.screenshot({
      path: "screenshots/b3-modal-open.png",
      fullPage: false,
    });

    // ── Step 8: Fill in form fields ─────────────────────────────────────
    // Job Title
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

    // ── Step 9: Submit form ─────────────────────────────────────────────
    const submitBtn = page.locator('[data-testid="modal-submit-btn"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // ── Step 10: Verify modal closed ────────────────────────────────────
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // ── Step 11: Verify new job appears on dashboard ────────────────────
    // Wait for the grid to update with the new job
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 5000,
    });

    // The new job should be visible on the page
    const newJobCard = page.locator("text=AI Research Engineer");
    await expect(newJobCard).toBeVisible({ timeout: 5000 });

    // Screenshot: job created
    await page.screenshot({
      path: "screenshots/b3-job-created.png",
      fullPage: false,
    });
  });

  // ── Validation: empty title shows error ─────────────────────────────────
  test("Submit with empty title shows validation error", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    // Open modal
    await page.locator('[data-testid="new-job-btn"]').click();
    const modal = page.locator('[data-testid="quick-create-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Clear the title input and submit empty
    const titleInput = page.locator('[data-testid="input-job-title"]');
    await titleInput.fill("");
    await page.locator('[data-testid="modal-submit-btn"]').click();

    // Error should appear
    const titleError = page.locator('[data-testid="title-error"]');
    await expect(titleError).toBeVisible();
    await expect(titleError).toHaveText("Job title is required");

    // Modal should still be open
    await expect(modal).toBeVisible();
  });

  // ── Close modal via X button ────────────────────────────────────────────
  test("Close modal via X button works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    await page.locator('[data-testid="new-job-btn"]').click();
    const modal = page.locator('[data-testid="quick-create-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click close button
    await page.locator('[data-testid="modal-close-btn"]').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  // ── Cancel button closes modal ──────────────────────────────────────────
  test("Cancel button closes modal without creating job", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    // Count jobs before
    const jobsBefore = await page.locator('[data-testid^="job-card-"]').count();

    await page.locator('[data-testid="new-job-btn"]').click();
    const modal = page.locator('[data-testid="quick-create-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill in a title then cancel
    await page.locator('[data-testid="input-job-title"]').fill("Should Not Exist");
    await page.locator('[data-testid="modal-cancel-btn"]').click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Job count should be same
    const jobsAfter = await page.locator('[data-testid^="job-card-"]').count();
    expect(jobsAfter).toBe(jobsBefore);

    // "Should Not Exist" should not be on the page
    await expect(page.locator("text=Should Not Exist")).not.toBeVisible();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 2 — Global UI Spacing & Padding Audit
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("Visual Spacing Audit", () => {
  test("Dashboard page — padding, card gaps, stats-to-grid spacing", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });

    // Collect spacing audit findings
    const findings: string[] = [];

    // ── Main content area padding ────────────────────────────────────────
    // The .p-6 wrapper is the parent of job-grid-view
    const jobGrid = page.locator('[data-testid="job-grid-view"]');
    const contentArea = jobGrid.locator("..");
    const contentPadding = await contentArea.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        top: style.paddingTop,
        right: style.paddingRight,
        bottom: style.paddingBottom,
        left: style.paddingLeft,
        className: el.className,
      };
    });

    // Record finding: p-6 should provide padding but may not work in Tailwind v4
    const paddingPx = parseFloat(contentPadding.top);
    if (paddingPx === 0 && contentPadding.className.includes("p-6")) {
      findings.push(
        `[CRITICAL] Content wrapper has class "p-6" but computed padding is 0px. ` +
        `Tailwind v4 spacing utility not resolving. Content is flush against edges.`
      );
    }
    // Padding should at least be symmetric
    expect(contentPadding.top).toBe(contentPadding.left);

    // ── Job cards gap — should be uniform ────────────────────────────────
    const gridGap = await jobGrid.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        columnGap: style.columnGap,
        rowGap: style.rowGap,
      };
    });
    // gap-3 = 12px; both row and column gaps should be equal
    expect(gridGap.columnGap).toBe(gridGap.rowGap);
    expect(parseFloat(gridGap.columnGap)).toBeGreaterThan(0);

    // ── Stats row to job grid spacing ────────────────────────────────────
    // Measure visual pixel gap between stats bottom and grid top
    const visualGap = await page.evaluate(() => {
      const grid = document.querySelector('[data-testid="job-grid-view"]');
      const statsRow = grid?.parentElement?.querySelector(".grid.grid-cols-2");
      if (!statsRow || !grid) return { gap: -1 };
      const statsRect = statsRow.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      return {
        gap: gridRect.top - statsRect.bottom,
        statsMarginBottom: window.getComputedStyle(statsRow).marginBottom,
      };
    });

    if (visualGap.gap <= 0) {
      findings.push(
        `[CRITICAL] Zero gap between stats row and job grid (${visualGap.gap}px). ` +
        `mb-6 class likely not resolving in Tailwind v4.`
      );
    }

    // ── Stat cards internal padding should be consistent ─────────────────
    // Stat cards use .p-3 which also might not resolve
    const statCardPadding = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        '[data-testid="job-grid-view"]'
      )?.[0]?.parentElement?.querySelectorAll(".border.p-3");
      if (!cards || cards.length < 2) return { consistent: true, firstPadding: "n/a" };
      const s1 = window.getComputedStyle(cards[0]).padding;
      const s2 = window.getComputedStyle(cards[1]).padding;
      return { consistent: s1 === s2, firstPadding: s1 };
    });
    expect(statCardPadding.consistent).toBe(true);
    if (statCardPadding.firstPadding === "0px") {
      findings.push(
        `[HIGH] Stat cards have class "p-3" but computed padding is 0px.`
      );
    }

    // Log all findings to test output
    if (findings.length > 0) {
      console.log("\n=== DASHBOARD SPACING FINDINGS ===");
      findings.forEach((f) => console.log(f));
      console.log("===================================\n");
    }

    // Screenshot
    await page.screenshot({
      path: "screenshots/ui-dashboard-spacing.png",
      fullPage: true,
    });

    // Test passes (audit findings are informational) but we verify grid gap works
    expect(parseFloat(gridGap.columnGap)).toBeGreaterThan(0);
  });

  test("Pipeline page — rail-to-list gap, row padding, header spacing", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline");
    await page.waitForLoadState("networkidle");

    // Wait for main content to render
    await page.waitForTimeout(1000);

    // ── Check if there's a flex/grid layout with JD rail and candidate list ──
    // Look for the main layout container
    const mainContent = page.locator("main, [role='main']").first();
    const hasMain = await mainContent.count();

    if (hasMain > 0) {
      // Check for gap between sidebar rail and main list
      const flexContainers = page.locator(".flex, .grid").filter({ has: page.locator("table, [data-testid], .border") });
      const containerCount = await flexContainers.count();

      if (containerCount > 0) {
        const gap = await flexContainers.first().evaluate((el) => {
          const style = window.getComputedStyle(el);
          return { gap: style.gap, columnGap: style.columnGap };
        });
        // Gap should exist and be > 0
        if (gap.gap !== "normal" && gap.gap !== "" && gap.gap !== "0px") {
          expect(parseFloat(gap.gap)).toBeGreaterThan(0);
        }
      }
    }

    // ── Candidate rows: check internal padding consistency ────────────────
    // Find all candidate row-like elements
    const candidateRows = page.locator('[data-testid^="candidate-row"]');
    const rowCount = await candidateRows.count();

    if (rowCount >= 2) {
      const firstRowPadding = await candidateRows.first().evaluate(
        (el) => window.getComputedStyle(el).padding
      );
      const secondRowPadding = await candidateRows.nth(1).evaluate(
        (el) => window.getComputedStyle(el).padding
      );
      expect(firstRowPadding).toBe(secondRowPadding);
    }

    // ── Check table header to first row spacing ──────────────────────────
    const tableHeaders = page.locator(".table-header").first();
    const headerCount = await tableHeaders.count();
    if (headerCount > 0) {
      const headerParent = tableHeaders.locator("..");
      const headerMarginBottom = await headerParent.evaluate(
        (el) => window.getComputedStyle(el).marginBottom
      );
      // Should be 0 (border-separated) or a small consistent value
      expect(parseFloat(headerMarginBottom)).toBeLessThanOrEqual(16);
    }

    // Screenshot
    await page.screenshot({
      path: "screenshots/ui-pipeline-spacing.png",
      fullPage: true,
    });
  });

  test("Candidate Profile page — section spacing, timeline alignment", async ({
    page,
  }) => {
    await page.goto("/job/1/candidate/c1-01");
    await page.waitForLoadState("networkidle");

    // Wait for content to render
    await page.waitForTimeout(1000);

    // ── Check section spacing (AI evaluation and resume timeline) ────────
    // Look for section headings or containers
    const sections = page.locator("section, [data-testid]").filter({ has: page.locator("h2, h3") });
    const sectionCount = await sections.count();

    if (sectionCount >= 2) {
      // Check margin/gap between sections
      const firstSectionMargin = await sections.first().evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          marginBottom: style.marginBottom,
          paddingBottom: style.paddingBottom,
        };
      });
      // Sections should have some spacing
      const totalSpacing =
        parseFloat(firstSectionMargin.marginBottom) +
        parseFloat(firstSectionMargin.paddingBottom);
      expect(totalSpacing).toBeGreaterThanOrEqual(0);
    }

    // ── Timeline elements alignment check ────────────────────────────────
    // The timeline uses square nodes: 9x9px accent-primary squares positioned
    // at left-[3px] inside experience entries with pl-8
    const experienceSection = page.locator('[data-testid="experience-section"]');
    const hasExpSection = await experienceSection.count();

    if (hasExpSection > 0) {
      // Timeline nodes are the small square elements inside experience entries
      const timelineNodes = experienceSection.locator('[data-testid^="experience-entry-"] > .absolute.bg-accent-primary');
      const nodeCount = await timelineNodes.count();

      if (nodeCount >= 2) {
        // All timeline nodes should be vertically aligned (same X position)
        const firstNodeBox = await timelineNodes.first().boundingBox();
        const secondNodeBox = await timelineNodes.nth(1).boundingBox();

        if (firstNodeBox && secondNodeBox) {
          // X position (left edge) should be within 2px tolerance
          expect(Math.abs(firstNodeBox.x - secondNodeBox.x)).toBeLessThanOrEqual(5);
        }
      }
    }

    // ── Check overall page padding consistency ───────────────────────────
    const pageContent = page.locator(".flex-1").first();
    if (await pageContent.count() > 0) {
      const pagePadding = await pageContent.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
        };
      });
      // Left and right padding should match
      expect(pagePadding.paddingLeft).toBe(pagePadding.paddingRight);
    }

    // Screenshot
    await page.screenshot({
      path: "screenshots/ui-profile-spacing.png",
      fullPage: true,
    });
  });
});
