import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/c3";

/**
 * Evaluator C-3: Bulk actions on candidates
 *
 * Tests multi-select, bulk Advance to Interview, bulk Reject, Export to CSV,
 * select-all/indeterminate, shift-click range, clear selection, and design audit.
 *
 * All locators are scoped to [data-testid="candidate-list-panel"] to avoid
 * strict-mode collisions with the sidebar pipeline-panel duplicate testids.
 */
test.describe("Evaluator C-3: Bulk actions on candidates", () => {
  test.setTimeout(60000);

  /** Helper: navigate to pipeline page and return the scoped main panel locator. */
  async function setup(page: import("@playwright/test").Page) {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    const panel = page.locator('[data-testid="candidate-list-panel"]');
    await expect(panel).toBeVisible({ timeout: 10000 });
    return panel;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Navigate and verify structure
  // ──────────────────────────────────────────────────────────────────────────
  test("01 — pipeline loads with multiple candidates and no toolbar", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Verify multiple candidate rows exist (job 1 has 12 candidates)
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    // Header with select-all checkbox is present
    const header = panel.locator('[data-testid="candidate-list-header"]');
    await expect(header).toBeVisible();

    const selectAll = panel.locator('[data-testid="select-all-checkbox"]');
    await expect(selectAll).toBeVisible();

    // Bulk toolbar is NOT visible when nothing is selected
    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).not.toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-pipeline-loaded.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Multi-select via individual checkboxes
  // ──────────────────────────────────────────────────────────────────────────
  test("02 — selecting multiple candidates shows toolbar with correct count", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Click first checkbox
    const cb1 = panel.locator('[data-testid="select-checkbox-c1-01"]');
    await expect(cb1).toBeVisible({ timeout: 5000 });
    await cb1.click();

    // Toolbar appears
    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 3000 });

    // Count = 1
    const count = panel.locator('[data-testid="selection-count"]');
    await expect(count).toHaveText("1");

    // Select second
    const cb2 = panel.locator('[data-testid="select-checkbox-c1-02"]');
    await cb2.click();
    await expect(count).toHaveText("2");

    // Select third
    const cb3 = panel.locator('[data-testid="select-checkbox-c1-03"]');
    await cb3.click();
    await expect(count).toHaveText("3");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-multiple-selected.png`,
      fullPage: true,
    });

    // All three action buttons visible
    await expect(panel.locator('[data-testid="bulk-advance-interview"]')).toBeVisible();
    await expect(panel.locator('[data-testid="bulk-reject"]')).toBeVisible();
    await expect(panel.locator('[data-testid="bulk-export-csv"]')).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2b: Shift-click range selection
  // ──────────────────────────────────────────────────────────────────────────
  test("03 — shift-click range selects consecutive candidates", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Normal-click first checkbox
    const cb1 = panel.locator('[data-testid="select-checkbox-c1-01"]');
    await cb1.click();

    // Shift-click the 4th candidate to range-select 1-4
    const cb4 = panel.locator('[data-testid="select-checkbox-c1-04"]');
    await cb4.click({ modifiers: ["Shift"] });

    // Count should be 4
    const count = panel.locator('[data-testid="selection-count"]');
    await expect(count).toHaveText("4");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-shift-click-range.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2c: Select-all checkbox and indeterminate state
  // ──────────────────────────────────────────────────────────────────────────
  test("04 — select-all checkbox: indeterminate, all, and deselect-all", async ({
    page,
  }) => {
    const panel = await setup(page);
    const selectAll = panel.locator('[data-testid="select-all-checkbox"]');

    // Partial selection: click one checkbox
    const cb1 = panel.locator('[data-testid="select-checkbox-c1-01"]');
    await cb1.click();

    // Indeterminate indicator (horizontal bar) should be visible
    const indeterminateBar = selectAll.locator("div.bg-accent-primary");
    await expect(indeterminateBar).toBeVisible({ timeout: 3000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-indeterminate-state.png`,
      fullPage: true,
    });

    // Click select-all to select everything
    await selectAll.click();

    // Count should equal total candidates (>= 10)
    const count = panel.locator('[data-testid="selection-count"]');
    const countText = await count.textContent();
    expect(parseInt(countText || "0")).toBeGreaterThanOrEqual(10);

    // Filled square should be visible (allSelected)
    const filledSquare = selectAll.locator("div.bg-accent-primary");
    await expect(filledSquare).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-all-selected.png`,
      fullPage: true,
    });

    // Click select-all again => deselect all => toolbar disappears
    await selectAll.click();
    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).not.toBeVisible({ timeout: 3000 });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3-4: Advance to Interview — bulk status update
  // ──────────────────────────────────────────────────────────────────────────
  test("05 — Advance to Interview updates statuses and shows feedback toast", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Select candidates c1-04 (Yuki Tanaka) and c1-06 (Jordan Blake)
    await panel.locator('[data-testid="select-checkbox-c1-04"]').click();
    await panel.locator('[data-testid="select-checkbox-c1-06"]').click();

    const count = panel.locator('[data-testid="selection-count"]');
    await expect(count).toHaveText("2");

    // Click Advance to Interview
    await panel.locator('[data-testid="bulk-advance-interview"]').click();

    // Verify feedback toast
    const feedback = panel.locator('[data-testid="bulk-feedback"]');
    await expect(feedback).toBeVisible({ timeout: 3000 });
    await expect(feedback).toContainText("advanced to Interview");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-advance-feedback.png`,
      fullPage: true,
    });

    // Wait for feedback to dismiss and selection to reset
    await expect(feedback).not.toBeVisible({ timeout: 5000 });

    // Status badges should now show "Interview"
    const badge4 = panel.locator('[data-testid="status-badge-c1-04"]');
    const badge6 = panel.locator('[data-testid="status-badge-c1-06"]');
    await expect(badge4).toBeVisible({ timeout: 3000 });
    await expect(badge4).toHaveText("Interview");
    await expect(badge6).toBeVisible();
    await expect(badge6).toHaveText("Interview");

    // Toolbar gone (selection cleared)
    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).not.toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-status-updated-interview.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: Reject bulk action
  // ──────────────────────────────────────────────────────────────────────────
  test("06 — Reject bulk action updates statuses for all selected", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Select c1-07 (Elena Vasquez) and c1-08 (Samuel Osei)
    await panel.locator('[data-testid="select-checkbox-c1-07"]').click();
    await panel.locator('[data-testid="select-checkbox-c1-08"]').click();

    const count = panel.locator('[data-testid="selection-count"]');
    await expect(count).toHaveText("2");

    // Click Reject
    await panel.locator('[data-testid="bulk-reject"]').click();

    // Feedback toast
    const feedback = panel.locator('[data-testid="bulk-feedback"]');
    await expect(feedback).toBeVisible({ timeout: 3000 });
    await expect(feedback).toContainText("rejected");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-reject-feedback.png`,
      fullPage: true,
    });

    // Wait for feedback to clear
    await expect(feedback).not.toBeVisible({ timeout: 5000 });

    // Status badges should show "Rejected"
    const badge7 = panel.locator('[data-testid="status-badge-c1-07"]');
    const badge8 = panel.locator('[data-testid="status-badge-c1-08"]');
    await expect(badge7).toBeVisible({ timeout: 3000 });
    await expect(badge7).toHaveText("Rejected");
    await expect(badge8).toBeVisible();
    await expect(badge8).toHaveText("Rejected");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-status-updated-rejected.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 6: Export to CSV — verify download
  // ──────────────────────────────────────────────────────────────────────────
  test("07 — Export to CSV triggers download with correct filename", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Select 3 candidates
    await panel.locator('[data-testid="select-checkbox-c1-01"]').click();
    await panel.locator('[data-testid="select-checkbox-c1-02"]').click();
    await panel.locator('[data-testid="select-checkbox-c1-03"]').click();

    const count = panel.locator('[data-testid="selection-count"]');
    await expect(count).toHaveText("3");

    // Listen for download
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });

    // Click Export CSV
    await panel.locator('[data-testid="bulk-export-csv"]').click();

    // Verify download triggered with correct filename pattern
    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^candidates-1-\d+\.csv$/);

    // Verify download path exists
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Feedback toast
    const feedback = panel.locator('[data-testid="bulk-feedback"]');
    await expect(feedback).toBeVisible({ timeout: 3000 });
    await expect(feedback).toContainText("Exported 3 candidate");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-export-csv-feedback.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 7: Clear selection
  // ──────────────────────────────────────────────────────────────────────────
  test("08 — clear selection button dismisses toolbar", async ({ page }) => {
    const panel = await setup(page);

    // Select two candidates
    await panel.locator('[data-testid="select-checkbox-c1-01"]').click();
    await panel.locator('[data-testid="select-checkbox-c1-02"]').click();

    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).toBeVisible();

    // Click clear
    await panel.locator('[data-testid="clear-selection"]').click();

    // Toolbar disappears
    await expect(toolbar).not.toBeVisible({ timeout: 3000 });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 8: Design audit — toolbar, checkbox, and button styling
  // ──────────────────────────────────────────────────────────────────────────
  test("09 — design audit: Industrial Clarity styling", async ({ page }) => {
    const panel = await setup(page);

    // Select 2 candidates to reveal the toolbar
    await panel.locator('[data-testid="select-checkbox-c1-01"]').click();
    await panel.locator('[data-testid="select-checkbox-c1-02"]').click();

    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).toBeVisible();

    // ── Toolbar background: dark surface-secondary (#1A1A1A) ──────────────
    const toolbarBg = await toolbar.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const bgMatch = toolbarBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (bgMatch) {
      const [, r, g, b] = bgMatch.map(Number);
      expect(r).toBeLessThan(50);
      expect(g).toBeLessThan(50);
      expect(b).toBeLessThan(50);
    }

    // ── Advance button: accent-primary (#D4FF00) pill, NOT white ──────────
    const advanceBtn = panel.locator('[data-testid="bulk-advance-interview"]');
    const advanceBg = await advanceBtn.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(advanceBg).not.toBe("rgb(255, 255, 255)");

    // ── Reject button: signal-danger (#FF4444), distinctly red ────────────
    const rejectBtn = panel.locator('[data-testid="bulk-reject"]');
    const rejectBg = await rejectBtn.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const rejectMatch = rejectBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rejectMatch) {
      const [, r] = rejectMatch.map(Number);
      expect(r).toBeGreaterThan(200);
    }

    // ── Export CSV button: ghost style (transparent/dark bg) ──────────────
    const exportBtn = panel.locator('[data-testid="bulk-export-csv"]');
    const exportBg = await exportBtn.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const exportMatch = exportBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (exportMatch) {
      const [, r, g, b] = exportMatch.map(Number);
      expect(r + g + b).toBeLessThan(150);
    }

    // ── Selected checkbox: accent-primary bg, NOT white/browser default ───
    const selectedCheckbox = panel.locator('[data-testid="select-checkbox-c1-01"]');
    const checkboxBg = await selectedCheckbox.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(checkboxBg).not.toBe("rgb(255, 255, 255)");

    // ── Selection count badge: accent-primary bg ──────────────────────────
    const countBadge = panel.locator('[data-testid="selection-count"]');
    const badgeBg = await countBadge.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(badgeBg).not.toBe("rgb(255, 255, 255)");

    // ── Monospace font on action buttons ──────────────────────────────────
    const advanceFont = await advanceBtn.evaluate((el) =>
      getComputedStyle(el).fontFamily
    );
    expect(advanceFont.toLowerCase()).toMatch(/mono|jetbrains/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-design-audit.png`,
      fullPage: true,
    });

    // Toolbar close-up
    const toolbarBox = await toolbar.boundingBox();
    if (toolbarBox) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/12-toolbar-closeup.png`,
        clip: {
          x: toolbarBox.x,
          y: Math.max(0, toolbarBox.y - 10),
          width: toolbarBox.width,
          height: toolbarBox.height + 20,
        },
      });
    }

    // ── Selected row highlight: left accent border ────────────────────────
    const selectedRow = panel.locator('[data-testid="candidate-row-c1-01"]');
    const rowBorderLeft = await selectedRow.evaluate((el) =>
      getComputedStyle(el).borderLeftColor
    );
    expect(rowBorderLeft).toBeTruthy();
  });
});
