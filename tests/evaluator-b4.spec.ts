import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/b4";

test.describe("EVALUATOR B-4: Archive/close job — comprehensive evaluation", () => {
  test.setTimeout(45000);

  test("full close-job lifecycle: menu → close → visual demotion → frozen pipeline → disabled profile", async ({
    page,
  }) => {
    // ─── Step 1: Navigate to dashboard, verify jobs panel ───────────────
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-initial.png`,
      fullPage: true,
    });

    // ─── Step 2: Verify active job (id=1) has Active badge ──────────────
    const jobCard1 = page.locator('[data-testid="job-card-1"]');
    await expect(jobCard1).toBeVisible({ timeout: 5000 });

    const activeBadge = jobCard1.locator('[data-testid="status-badge-active"]');
    await expect(activeBadge).toBeVisible();
    await expect(activeBadge).toHaveText("Active");

    // Verify the three-dot menu button exists for this active job
    const contextMenuBtn = page.locator('[data-testid="job-context-menu-1"]');
    await expect(contextMenuBtn).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-active-job-with-menu-btn.png`,
      fullPage: false,
    });

    // ─── Step 3: Click three-dot menu → verify dropdown ─────────────────
    await contextMenuBtn.click();

    const dropdown = page.locator('[data-testid="job-context-dropdown-1"]');
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // Verify both Close and Archive options are present
    const closeBtn = page.locator('[data-testid="job-close-btn-1"]');
    const archiveBtn = page.locator('[data-testid="job-archive-btn-1"]');
    await expect(closeBtn).toBeVisible();
    await expect(archiveBtn).toBeVisible();
    await expect(closeBtn).toHaveText(/Close Job/);
    await expect(archiveBtn).toHaveText(/Archive Job/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-context-menu-open.png`,
      fullPage: false,
    });

    // ─── Step 4: Click "Close Job" and verify badge changes ─────────────
    await closeBtn.click();

    // Dropdown should disappear
    await expect(dropdown).not.toBeVisible({ timeout: 3000 });

    // Status badge should now say "Closed"
    const closedBadge = jobCard1.locator('[data-testid="status-badge-closed"]');
    await expect(closedBadge).toBeVisible({ timeout: 3000 });
    await expect(closedBadge).toHaveText("Closed");

    // Verify the three-dot menu is now GONE (closed jobs should not have it)
    const contextMenuAfterClose = page.locator('[data-testid="job-context-menu-1"]');
    await expect(contextMenuAfterClose).not.toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-job-now-closed.png`,
      fullPage: false,
    });

    // ─── Step 5: Verify visual demotion — reduced opacity ───────────────
    const opacity = await jobCard1.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    const opacityNum = parseFloat(opacity);
    expect(opacityNum).toBeLessThanOrEqual(0.6);
    expect(opacityNum).toBeGreaterThan(0);

    // ─── Step 6: Verify closed job sorted to bottom ─────────────────────
    const allCards = page.locator('[data-testid^="job-card-"]');
    const cardCount = await allCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Closed jobs should be at the bottom. Job 1 is now closed, and job 6 was already closed.
    // Get the last two cards — both should be closed.
    const lastCard = allCards.nth(cardCount - 1);
    const secondLastCard = allCards.nth(cardCount - 2);
    const lastStatus = await lastCard.getAttribute("data-job-status");
    const secondLastStatus = await secondLastCard.getAttribute("data-job-status");
    // At least the last card must be Closed
    expect(lastStatus).toBe("Closed");
    // Second-to-last should also be Closed (we now have 2 closed jobs)
    expect(secondLastStatus).toBe("Closed");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-closed-sorted-bottom.png`,
      fullPage: false,
    });

    // ─── Step 7: Click the closed job to view pipeline ──────────────────
    // Click the inner button of the now-closed job card 1
    await jobCard1.locator("button").first().click();

    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    await expect(pipelinePanel).toBeVisible({ timeout: 5000 });

    // Verify frozen banner
    const frozenBanner = page.locator('[data-testid="pipeline-frozen-banner"]');
    await expect(frozenBanner).toBeVisible({ timeout: 3000 });
    const bannerText = await frozenBanner.textContent();
    expect(bannerText?.toLowerCase()).toContain("frozen");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-pipeline-frozen-banner.png`,
      fullPage: false,
    });

    // ─── Step 8: Verify candidate rows are disabled/non-clickable ───────
    const candidateRows = page.locator('[data-testid^="candidate-row-"]');
    const rowCount = await candidateRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Check that candidate rows are disabled (have disabled attribute)
    const firstRow = candidateRows.first();
    await expect(firstRow).toBeDisabled();

    // Check opacity is reduced on frozen rows
    const rowOpacity = await firstRow.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    expect(parseFloat(rowOpacity)).toBeLessThan(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-candidates-disabled.png`,
      fullPage: false,
    });

    // ─── Step 9: Click candidate row → should NOT navigate (frozen) ─────
    // Try clicking the first candidate row — it's disabled, but let's also
    // force-click and check the profile panel behavior
    await firstRow.click({ force: true });

    // Wait briefly for any navigation
    await page.waitForTimeout(500);

    // Profile panel should NOT appear (frozen job prevents selection)
    const profilePanel = page.locator('[data-testid="profile-panel"]');
    const profileVisible = await profilePanel.isVisible();

    // If the profile panel somehow appeared (implementation allows force-click
    // to still fire the handler), verify that actions are disabled
    if (profileVisible) {
      const actionsLabel = page.locator('[data-testid="actions-frozen-label"]');
      await expect(actionsLabel).toBeVisible({ timeout: 3000 });
      const labelText = await actionsLabel.textContent();
      expect(labelText?.toLowerCase()).toContain("disabled");
      expect(labelText?.toLowerCase()).toContain("closed");

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-profile-actions-disabled.png`,
        fullPage: false,
      });
    } else {
      // Good — frozen pipeline correctly prevents navigation to profile
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-profile-not-navigated.png`,
        fullPage: false,
      });
    }
  });

  test("pre-existing closed job (id=6) is correctly demoted and frozen", async ({
    page,
  }) => {
    // Navigate to dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Verify job 6 (Technical Writer) is present and has Closed badge
    const closedCard = page.locator('[data-testid="job-card-6"]');
    await expect(closedCard).toBeVisible({ timeout: 5000 });

    const closedBadge = closedCard.locator('[data-testid="status-badge-closed"]');
    await expect(closedBadge).toBeVisible();
    await expect(closedBadge).toHaveText("Closed");

    // Verify reduced opacity
    const opacity = await closedCard.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    expect(parseFloat(opacity)).toBeLessThanOrEqual(0.6);

    // Verify no context menu for closed jobs
    const contextMenu = page.locator('[data-testid="job-context-menu-6"]');
    await expect(contextMenu).not.toBeVisible();

    // Verify it's sorted to bottom
    const allCards = page.locator('[data-testid^="job-card-"]');
    const count = await allCards.count();
    const lastCardTestId = await allCards.nth(count - 1).getAttribute("data-testid");
    expect(lastCardTestId).toBe("job-card-6");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-preexisting-closed-job.png`,
      fullPage: false,
    });

    // Click into the closed job's pipeline
    await closedCard.locator("button").first().click();

    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    await expect(pipelinePanel).toBeVisible({ timeout: 5000 });

    // Frozen banner visible
    const frozenBanner = page.locator('[data-testid="pipeline-frozen-banner"]');
    await expect(frozenBanner).toBeVisible({ timeout: 3000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-preexisting-pipeline-frozen.png`,
      fullPage: false,
    });

    // Candidate rows disabled
    const rows = page.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      await expect(rows.nth(i)).toBeDisabled();
    }
  });

  test("active jobs still have working context menus and clickable pipelines", async ({
    page,
  }) => {
    // Verify that non-closed jobs are NOT affected by the close feature
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Job 2 (Product Designer, Active) should have a visible context menu
    const jobCard2 = page.locator('[data-testid="job-card-2"]');
    await expect(jobCard2).toBeVisible({ timeout: 5000 });

    // Should NOT have reduced opacity
    const opacity2 = await jobCard2.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    expect(parseFloat(opacity2)).toBeGreaterThanOrEqual(0.9);

    // Context menu should exist
    const ctx2 = page.locator('[data-testid="job-context-menu-2"]');
    await expect(ctx2).toBeVisible();

    // Click into the active job's pipeline
    await jobCard2.locator("button").first().click();

    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    await expect(pipelinePanel).toBeVisible({ timeout: 5000 });

    // Frozen banner should NOT exist for active jobs
    const frozenBanner = page.locator('[data-testid="pipeline-frozen-banner"]');
    await expect(frozenBanner).not.toBeVisible();

    // Candidate rows should NOT be disabled
    const rows = page.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      await expect(rows.first()).not.toBeDisabled();
    }

    // Click a candidate — should navigate to profile with action buttons
    if (rowCount > 0) {
      await rows.first().click();

      const profilePanel = page.locator('[data-testid="profile-panel"]');
      await expect(profilePanel).toBeVisible({ timeout: 5000 });

      // Action buttons should be visible (not the frozen label)
      const actionsBar = page.locator('[data-testid="action-buttons-bar"]');
      await expect(actionsBar).toBeVisible();

      const frozenLabel = page.locator('[data-testid="actions-frozen-label"]');
      await expect(frozenLabel).not.toBeVisible();

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/11-active-job-profile-has-actions.png`,
        fullPage: false,
      });
    }
  });
});
