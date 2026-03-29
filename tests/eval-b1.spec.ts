import { test, expect } from "@playwright/test";

/**
 * B-1 Evaluation: Job Card Grid/List View
 *
 * Validates the dashboard's dual-view layout (grid vs list),
 * view toggle functionality, card link navigation, and pipeline routing.
 */

test.describe("B-1: Job Card Grid / List View", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("grid view renders job cards, toggles to list, navigates to pipeline", async ({
    page,
  }) => {
    // ── Step 1: Navigate to dashboard ────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // ── Step 2: Verify grid view is the default ──────────────────────
    const gridContainer = page.locator('[data-testid="job-grid-view"]');
    await expect(gridContainer).toBeVisible();

    // ── Step 3: Verify at least 3 job cards exist ────────────────────
    const jobCards = gridContainer.locator("[data-testid^='job-card-']");
    const cardCount = await jobCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Verify each visible card contains essential content (title text)
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = jobCards.nth(i);
      await expect(card).toBeVisible();
      // Each card should have non-empty text content
      const text = await card.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }

    // ── Step 4: Screenshot — grid view ───────────────────────────────
    await page.screenshot({
      path: "screenshots/b1-grid.png",
      fullPage: true,
    });

    // ── Step 5: Locate the view toggle buttons ───────────────────────
    const viewToggle = page.locator('[data-testid="view-toggle"]');
    await expect(viewToggle).toBeVisible();

    const listButton = page.locator('[data-testid="view-toggle-list"]');
    const gridButton = page.locator('[data-testid="view-toggle-grid"]');
    await expect(listButton).toBeVisible();
    await expect(gridButton).toBeVisible();

    // Verify grid button is currently pressed (active state)
    await expect(gridButton).toHaveAttribute("aria-pressed", "true");
    await expect(listButton).toHaveAttribute("aria-pressed", "false");

    // ── Step 6: Switch to list view ──────────────────────────────────
    await listButton.click();

    // Verify list view container appears
    const listContainer = page.locator('[data-testid="job-list-view"]');
    await expect(listContainer).toBeVisible();

    // Verify grid view container is gone
    await expect(gridContainer).not.toBeVisible();

    // Verify list button is now pressed
    await expect(listButton).toHaveAttribute("aria-pressed", "true");
    await expect(gridButton).toHaveAttribute("aria-pressed", "false");

    // Verify table rows exist in list view (one per job)
    const jobRows = listContainer.locator("[data-testid^='job-row-']");
    const rowCount = await jobRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(3);

    // Verify the row count matches the card count (same data source)
    expect(rowCount).toBe(cardCount);

    // Verify list view has a table header row
    const tableHeader = listContainer.locator(".table-header");
    const headerCount = await tableHeader.count();
    expect(headerCount).toBeGreaterThanOrEqual(3);

    // ── Step 7: Screenshot — list view ───────────────────────────────
    await page.screenshot({
      path: "screenshots/b1-list.png",
      fullPage: true,
    });

    // ── Step 8: Switch back to grid view ─────────────────────────────
    await gridButton.click();

    // Verify grid view is restored
    await expect(gridContainer).toBeVisible();
    await expect(listContainer).not.toBeVisible();

    // Verify grid button is pressed again
    await expect(gridButton).toHaveAttribute("aria-pressed", "true");
    await expect(listButton).toHaveAttribute("aria-pressed", "false");

    // Verify same number of cards are present after toggle round-trip
    const restoredCards = gridContainer.locator("[data-testid^='job-card-']");
    expect(await restoredCards.count()).toBe(cardCount);

    // ── Step 9: Verify job cards contain links to /job/*/pipeline ────
    const firstCard = jobCards.first();
    const href = await firstCard.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\/job\/\d+\/pipeline$/);

    // Verify all cards have proper pipeline links
    for (let i = 0; i < cardCount; i++) {
      const cardHref = await jobCards.nth(i).getAttribute("href");
      expect(cardHref).toMatch(/^\/job\/\d+\/pipeline$/);
    }

    // ── Step 10: Click first job card and verify navigation ──────────
    await firstCard.click();
    await page.waitForURL(/\/job\/\d+\/pipeline/, { timeout: 10000 });

    // Verify URL matches /job/*/pipeline pattern
    const url = page.url();
    expect(url).toMatch(/\/job\/\d+\/pipeline/);

    // ── Step 11: Screenshot — pipeline page ──────────────────────────
    await page.screenshot({
      path: "screenshots/b1-pipeline.png",
      fullPage: true,
    });
  });
});
