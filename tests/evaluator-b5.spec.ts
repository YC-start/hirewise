import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/b5";

test.describe("EVALUATOR B-5: Dashboard filtering by owner/department", () => {
  test.setTimeout(60000);

  test("Step 1-6: Full filter lifecycle — department filter, owner filter, clear all", async ({
    page,
  }) => {
    // ─── Step 1: Navigate to /dashboard with multiple jobs ─────────────
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Verify multiple jobs are present (mock data has 6 jobs across departments)
    const allJobCards = page.locator('[data-testid^="job-card-"]');
    const initialCardCount = await allJobCards.count();
    expect(initialCardCount).toBeGreaterThanOrEqual(5); // We expect at least 5 non-hidden jobs

    // Verify the filter bar exists
    const filterBar = page.locator('[data-testid="filter-bar"]');
    await expect(filterBar).toBeVisible({ timeout: 5000 });

    // Verify department filter button exists
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await expect(deptFilter).toBeVisible();

    // Verify "My Jobs" filter button exists
    const myJobsFilter = page.locator('[data-testid="my-jobs-filter"]');
    await expect(myJobsFilter).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-initial-unfiltered.png`,
      fullPage: true,
    });

    // ─── Step 2: Click department filter and select "Engineering" ──────
    await deptFilter.click();

    // Verify dropdown appears
    const deptDropdown = page.locator('[data-testid="department-filter-dropdown"]');
    await expect(deptDropdown).toBeVisible({ timeout: 3000 });

    // Verify "All Departments" option exists
    const allDeptOption = page.locator('[data-testid="department-option-all"]');
    await expect(allDeptOption).toBeVisible();

    // Verify specific department options exist
    const engineeringOption = page.locator('[data-testid="department-option-engineering"]');
    await expect(engineeringOption).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-department-dropdown-open.png`,
      fullPage: true,
    });

    // Select "Engineering"
    await engineeringOption.click();

    // Dropdown should close after selection
    await expect(deptDropdown).not.toBeVisible({ timeout: 3000 });

    // ─── Step 3: Verify only Engineering jobs are displayed ────────────
    // Engineering jobs: id=1 (Senior Backend Engineer) and id=4 (Frontend Engineer)
    const filteredCards = page.locator('[data-testid^="job-card-"]');
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBe(2); // Only 2 Engineering jobs

    const card1 = page.locator('[data-testid="job-card-1"]');
    const card4 = page.locator('[data-testid="job-card-4"]');
    await expect(card1).toBeVisible();
    await expect(card4).toBeVisible();

    // Non-Engineering jobs should NOT be visible
    const card2 = page.locator('[data-testid="job-card-2"]'); // Design
    const card3 = page.locator('[data-testid="job-card-3"]'); // Infrastructure
    const card5 = page.locator('[data-testid="job-card-5"]'); // AI/ML
    await expect(card2).not.toBeVisible();
    await expect(card3).not.toBeVisible();
    await expect(card5).not.toBeVisible();

    // Verify the department filter button shows active state (has "Engineering" text)
    await expect(deptFilter).toContainText("Engineering");

    // Verify filter summary is shown
    const filterSummary = page.locator('[data-testid="filter-summary"]');
    await expect(filterSummary).toBeVisible();
    await expect(filterSummary).toContainText(/Showing 2 of/);

    // Verify active department chip appears
    const deptChip = page.locator('[data-testid="active-filter-department"]');
    await expect(deptChip).toBeVisible();
    await expect(deptChip).toContainText("Engineering");

    // Verify "Clear" button appears when filter is active
    const clearBtn = page.locator('[data-testid="clear-filters"]');
    await expect(clearBtn).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-filtered-by-engineering.png`,
      fullPage: true,
    });

    // ─── Clear department filter before testing owner ──────────────────
    // Click the X on the department chip to remove it
    await deptChip.locator("button").click();

    // All jobs should be back
    const restoredCards = page.locator('[data-testid^="job-card-"]');
    await expect(restoredCards).toHaveCount(initialCardCount, { timeout: 3000 });

    // ─── Step 4: Select "My Jobs" / owner filter ──────────────────────
    await myJobsFilter.click();

    // My Jobs filter should show active state (pressed)
    await expect(myJobsFilter).toHaveAttribute("aria-pressed", "true");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-my-jobs-filter-active.png`,
      fullPage: true,
    });

    // ─── Step 5: Verify only jobs owned by current user (Alex Chen) ───
    // Alex Chen owns: id=1 (Senior Backend Engineer), id=3 (DevOps Lead), id=5 (Data Scientist)
    const myJobCards = page.locator('[data-testid^="job-card-"]');
    const myJobCount = await myJobCards.count();
    expect(myJobCount).toBe(3); // Alex Chen owns 3 jobs

    const myCard1 = page.locator('[data-testid="job-card-1"]');
    const myCard3 = page.locator('[data-testid="job-card-3"]');
    const myCard5 = page.locator('[data-testid="job-card-5"]');
    await expect(myCard1).toBeVisible();
    await expect(myCard3).toBeVisible();
    await expect(myCard5).toBeVisible();

    // Non-owned jobs should NOT be visible
    const nonOwned2 = page.locator('[data-testid="job-card-2"]'); // Sarah Kim
    const nonOwned4 = page.locator('[data-testid="job-card-4"]'); // Maria Lopez
    await expect(nonOwned2).not.toBeVisible();
    await expect(nonOwned4).not.toBeVisible();

    // Verify filter summary shows correct count
    const myJobsSummary = page.locator('[data-testid="filter-summary"]');
    await expect(myJobsSummary).toBeVisible();
    await expect(myJobsSummary).toContainText(/Showing 3 of/);

    // Verify My Jobs chip appears
    const myJobsChip = page.locator('[data-testid="active-filter-my-jobs"]');
    await expect(myJobsChip).toBeVisible();
    await expect(myJobsChip).toContainText("Alex Chen");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-filtered-by-my-jobs.png`,
      fullPage: true,
    });

    // ─── Step 6: Clear all filters — verify full job list restored ────
    const clearAllBtn = page.locator('[data-testid="clear-filters"]');
    await expect(clearAllBtn).toBeVisible();
    await clearAllBtn.click();

    // All original jobs should be restored
    const allRestoredCards = page.locator('[data-testid^="job-card-"]');
    await expect(allRestoredCards).toHaveCount(initialCardCount, { timeout: 3000 });

    // Filter summary should be hidden
    await expect(filterSummary).not.toBeVisible();

    // Clear button should be hidden
    await expect(clearAllBtn).not.toBeVisible();

    // My Jobs filter should be inactive
    await expect(myJobsFilter).toHaveAttribute("aria-pressed", "false");

    // Department filter should show default label
    await expect(deptFilter).toContainText("Department");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-filters-cleared-full-list.png`,
      fullPage: true,
    });
  });

  test("Combined filters: department + My Jobs narrows results correctly", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Apply department filter: Engineering
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.click();
    const engOption = page.locator('[data-testid="department-option-engineering"]');
    await expect(engOption).toBeVisible({ timeout: 3000 });
    await engOption.click();

    // Also apply My Jobs filter
    const myJobsFilter = page.locator('[data-testid="my-jobs-filter"]');
    await myJobsFilter.click();

    // Engineering + Alex Chen: only id=1 (Senior Backend Engineer)
    // id=4 (Frontend Engineer) is Engineering but owned by Maria Lopez
    const combinedCards = page.locator('[data-testid^="job-card-"]');
    const combinedCount = await combinedCards.count();
    expect(combinedCount).toBe(1);

    const card1 = page.locator('[data-testid="job-card-1"]');
    await expect(card1).toBeVisible();

    // Both chips should be visible
    const deptChip = page.locator('[data-testid="active-filter-department"]');
    const myJobsChip = page.locator('[data-testid="active-filter-my-jobs"]');
    await expect(deptChip).toBeVisible();
    await expect(myJobsChip).toBeVisible();

    // Summary shows 1 of total
    const filterSummary = page.locator('[data-testid="filter-summary"]');
    await expect(filterSummary).toContainText(/Showing 1 of/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-combined-filters.png`,
      fullPage: true,
    });

    // Clear all with clear button
    const clearBtn = page.locator('[data-testid="clear-filters"]');
    await clearBtn.click();

    // Full list restored
    const allCards = page.locator('[data-testid^="job-card-"]');
    await expect(allCards).toHaveCount(6, { timeout: 3000 });
  });

  test("Empty state: filter combination that yields zero results", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Apply department "Design" + My Jobs (Alex Chen doesn't own any Design jobs)
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.click();
    const designOption = page.locator('[data-testid="department-option-design"]');
    await expect(designOption).toBeVisible({ timeout: 3000 });
    await designOption.click();

    const myJobsFilter = page.locator('[data-testid="my-jobs-filter"]');
    await myJobsFilter.click();

    // Should have zero jobs
    const cards = page.locator('[data-testid^="job-card-"]');
    await expect(cards).toHaveCount(0, { timeout: 3000 });

    // Empty state message should be visible
    const noResults = page.locator('[data-testid="no-results-message"]');
    await expect(noResults).toBeVisible({ timeout: 3000 });

    // Summary should say "Showing 0 of"
    const filterSummary = page.locator('[data-testid="filter-summary"]');
    await expect(filterSummary).toContainText(/Showing 0 of/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-empty-state.png`,
      fullPage: true,
    });

    // Clear filters from the empty state message link
    const clearLink = noResults.locator("button");
    await clearLink.click();

    // Full list restored
    const allCards = page.locator('[data-testid^="job-card-"]');
    await expect(allCards).toHaveCount(6, { timeout: 3000 });
  });

  test("Stats recalculate correctly when filters are applied", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Record unfiltered stat values
    const candidatesStat = jobsPanel.locator("text=Candidates").locator("..");
    const highScoreStat = jobsPanel.locator("text=High Score").locator("..");

    // Get initial values
    const initialCandidatesText = await candidatesStat.textContent();
    const initialHighScoreText = await highScoreStat.textContent();

    // Apply AI/ML department filter (only job id=5: 203 resumes, 18 high score)
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.click();
    const aimlOption = page.locator('[data-testid="department-option-ai-ml"]');
    await expect(aimlOption).toBeVisible({ timeout: 3000 });
    await aimlOption.click();

    // After filtering to AI/ML only, stats should update
    // Wait a beat for re-render
    await page.waitForTimeout(300);

    const filteredCandidatesText = await candidatesStat.textContent();
    const filteredHighScoreText = await highScoreStat.textContent();

    // The AI/ML department has 203 candidates vs the total 535 (142+89+0+67+203+34)
    // Verify the numbers changed
    expect(filteredCandidatesText).not.toBe(initialCandidatesText);

    // Verify the stats contain expected AI/ML-only values
    expect(filteredCandidatesText).toContain("203");
    expect(filteredHighScoreText).toContain("18");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-stats-recalculated.png`,
      fullPage: true,
    });
  });

  test("Department filter dropdown styling and interaction quality", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Open department dropdown
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.click();

    const dropdown = page.locator('[data-testid="department-filter-dropdown"]');
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // Verify dropdown has a dark background (matches design system)
    const dropdownBg = await dropdown.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    // Should NOT be white/light — dark theme
    // Parse RGB: light backgrounds have high R/G/B values
    const rgbMatch = dropdownBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // All channels should be below 80 for the dark theme
      expect(r).toBeLessThan(80);
      expect(g).toBeLessThan(80);
      expect(b).toBeLessThan(80);
    }

    // Verify dropdown has border (design spec: 1px --border-default)
    const dropdownBorder = await dropdown.evaluate(
      (el) => getComputedStyle(el).borderStyle,
    );
    expect(dropdownBorder).not.toBe("none");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-dropdown-styling.png`,
      fullPage: true,
    });

    // Close dropdown by clicking outside
    await page.locator('[data-testid="jobs-panel"]').click({ position: { x: 10, y: 300 } });
    await expect(dropdown).not.toBeVisible({ timeout: 3000 });

    // Verify dropdown closed properly on outside click
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-dropdown-closed-outside-click.png`,
      fullPage: true,
    });
  });

  test("Filter persists across view mode switch (grid → list)", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // Apply Engineering department filter
    const deptFilter = page.locator('[data-testid="department-filter"]');
    await deptFilter.click();
    const engOption = page.locator('[data-testid="department-option-engineering"]');
    await expect(engOption).toBeVisible({ timeout: 3000 });
    await engOption.click();

    // Verify 2 cards in grid view
    let filteredCards = page.locator('[data-testid^="job-card-"]');
    await expect(filteredCards).toHaveCount(2, { timeout: 3000 });

    // Switch to list view
    const listToggle = page.locator('[data-testid="view-toggle-list"]');
    await listToggle.click();

    // Verify list view is active
    const listView = page.locator('[data-testid="job-list-view"]');
    await expect(listView).toBeVisible({ timeout: 3000 });

    // Verify filter still applied — only 2 Engineering jobs in list
    const listRows = page.locator('[data-testid^="job-row-"]');
    await expect(listRows).toHaveCount(2, { timeout: 3000 });

    // Filter summary should still show
    const filterSummary = page.locator('[data-testid="filter-summary"]');
    await expect(filterSummary).toBeVisible();
    await expect(filterSummary).toContainText(/Showing 2 of/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-filter-persists-list-view.png`,
      fullPage: true,
    });

    // Switch back to grid and verify filter is still active
    const gridToggle = page.locator('[data-testid="view-toggle-grid"]');
    await gridToggle.click();

    filteredCards = page.locator('[data-testid^="job-card-"]');
    await expect(filteredCards).toHaveCount(2, { timeout: 3000 });
  });
});
