import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "/home/administrator/playground/hirewise/screenshots";

test.describe("B-4: Archive/close job", () => {
  test("context menu appears and allows closing an active job", async ({
    page,
  }) => {
    test.setTimeout(30000);

    // 1. Navigate to /dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // 2. The jobs panel should be visible in the right sidebar
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // 3. Find an active job card (job id "1" = Senior Backend Engineer, Active)
    const jobCard = page.locator('[data-testid="job-card-1"]');
    await expect(jobCard).toBeVisible({ timeout: 5000 });

    // 4. Verify the job currently has Active status badge
    const activeBadge = jobCard.locator('[data-testid="status-badge-active"]');
    await expect(activeBadge).toBeVisible();

    // 5. Click the context menu (three-dot) button
    const contextMenuBtn = page.locator('[data-testid="job-context-menu-1"]');
    await expect(contextMenuBtn).toBeVisible();
    await contextMenuBtn.click();

    // 6. Context dropdown should appear with Close and Archive options
    const dropdown = page.locator('[data-testid="job-context-dropdown-1"]');
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    const closeBtn = page.locator('[data-testid="job-close-btn-1"]');
    const archiveBtn = page.locator('[data-testid="job-archive-btn-1"]');
    await expect(closeBtn).toBeVisible();
    await expect(archiveBtn).toBeVisible();

    // 7. Click "Close Job"
    await closeBtn.click();

    // 8. Verify the status badge updates to "Closed"
    const closedBadge = jobCard.locator('[data-testid="status-badge-closed"]');
    await expect(closedBadge).toBeVisible({ timeout: 3000 });

    // 9. Verify the context menu disappears (no longer needed for closed jobs)
    const contextMenuAfter = page.locator('[data-testid="job-context-menu-1"]');
    await expect(contextMenuAfter).not.toBeVisible();

    // Screenshot for verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/b4-job-closed.png`,
      fullPage: false,
    });
  });

  test("closed job card is visually demoted with lower opacity", async ({
    page,
  }) => {
    test.setTimeout(30000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Job id "6" (Technical Writer) is already Closed in mock data
    const closedJobCard = page.locator('[data-testid="job-card-6"]');
    await expect(closedJobCard).toBeVisible({ timeout: 5000 });

    // Verify it has reduced opacity (opacity-50 = 0.5)
    const opacity = await closedJobCard.evaluate(
      (el) => getComputedStyle(el).opacity,
    );
    const opacityNum = parseFloat(opacity);
    expect(opacityNum).toBeLessThanOrEqual(0.6);
    expect(opacityNum).toBeGreaterThan(0);

    // Verify the job has the Closed status badge
    const closedBadge = closedJobCard.locator(
      '[data-testid="status-badge-closed"]',
    );
    await expect(closedBadge).toBeVisible();

    // Verify closed jobs are sorted to the bottom:
    // Get all job cards and check that card-6 (Closed) appears after active ones
    const allCards = page.locator('[data-testid^="job-card-"]');
    const cardCount = await allCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // The last card should be the closed one (id 6)
    const lastCard = allCards.nth(cardCount - 1);
    const lastCardTestId = await lastCard.getAttribute("data-testid");
    expect(lastCardTestId).toBe("job-card-6");

    // Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/b4-closed-demoted.png`,
      fullPage: false,
    });
  });

  test("pipeline shows frozen banner for closed job", async ({ page }) => {
    test.setTimeout(30000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Click on the closed job (id 6 - Technical Writer) to go to pipeline
    const closedJobCard = page.locator('[data-testid="job-card-6"]');
    await expect(closedJobCard).toBeVisible({ timeout: 5000 });
    // Click the inner button to navigate
    await closedJobCard.locator("button").first().click();

    // Pipeline panel should appear
    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    await expect(pipelinePanel).toBeVisible({ timeout: 5000 });

    // Verify the frozen banner is displayed
    const frozenBanner = page.locator(
      '[data-testid="pipeline-frozen-banner"]',
    );
    await expect(frozenBanner).toBeVisible({ timeout: 3000 });

    // Verify banner text mentions frozen/closed
    const bannerText = await frozenBanner.textContent();
    expect(bannerText?.toLowerCase()).toContain("frozen");

    // Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/b4-pipeline-frozen.png`,
      fullPage: false,
    });
  });
});
