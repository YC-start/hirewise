import { test, expect } from "@playwright/test";

/**
 * B-2 Eval: Job card data display
 *
 * Validates:
 *   - Status badge exists with visible background color
 *   - Resume count label + number present
 *   - High-score (>80%) label + number present
 *   - Interview label + number present
 *   - Different statuses have different badge colors (Active vs Draft)
 *   - Metric numbers use monospace font (JetBrains Mono / monospace)
 *   - Screenshot captured
 */

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("B-2 — Job Card Data Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for the grid to render
    await page.waitForSelector('[data-testid="job-grid-view"]', {
      timeout: 10000,
    });
  });

  test("Status badge exists on first job card and has a visible background color", async ({
    page,
  }) => {
    // First card is job-card-1 (Senior Backend Engineer, Active)
    const card = page.locator('[data-testid="job-card-1"]');
    await expect(card).toBeVisible();

    const badge = card.locator('[data-testid^="status-badge-"]');
    await expect(badge).toBeVisible();

    // Badge text should be one of Active/Draft/Paused/Closed
    const badgeText = await badge.textContent();
    expect(["Active", "Draft", "Paused", "Closed"]).toContain(badgeText?.trim());

    // Background color should NOT be transparent
    const bgColor = await badge.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe("transparent");
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test('Card displays "Resumes" label with a number', async ({ page }) => {
    const card = page.locator('[data-testid="job-card-1"]');
    const resumeLabel = card.locator("text=Resumes");
    await expect(resumeLabel).toBeVisible();

    // The metric value sibling should contain the number 142 (from mock data)
    const metricContainer = resumeLabel.locator("..");
    const valueSpan = metricContainer.locator("span.font-mono");
    await expect(valueSpan).toBeVisible();
    const valueText = await valueSpan.textContent();
    expect(Number(valueText?.trim())).not.toBeNaN();
    expect(Number(valueText?.trim())).toBe(142);
  });

  test('Card displays ">80%" high-score label with a number', async ({
    page,
  }) => {
    const card = page.locator('[data-testid="job-card-1"]');
    const highLabel = card.locator("text=>80%");
    await expect(highLabel).toBeVisible();

    const metricContainer = highLabel.locator("..");
    const valueSpan = metricContainer.locator("span.font-mono");
    await expect(valueSpan).toBeVisible();
    const valueText = await valueSpan.textContent();
    expect(Number(valueText?.trim())).not.toBeNaN();
    expect(Number(valueText?.trim())).toBe(12);
  });

  test('Card displays "Interviews" label with a number', async ({ page }) => {
    const card = page.locator('[data-testid="job-card-1"]');
    const interviewLabel = card.locator("text=Interviews");
    await expect(interviewLabel).toBeVisible();

    const metricContainer = interviewLabel.locator("..");
    const valueSpan = metricContainer.locator("span.font-mono");
    await expect(valueSpan).toBeVisible();
    const valueText = await valueSpan.textContent();
    expect(Number(valueText?.trim())).not.toBeNaN();
    expect(Number(valueText?.trim())).toBe(4);
  });

  test("Active and Draft badges have different background colors", async ({
    page,
  }) => {
    // Active badge (job-card-1 is Active)
    const activeBadge = page.locator('[data-testid="status-badge-active"]').first();
    await expect(activeBadge).toBeVisible();
    const activeBg = await activeBadge.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Draft badge (job-card-3 is Draft)
    const draftBadge = page.locator('[data-testid="status-badge-draft"]').first();
    await expect(draftBadge).toBeVisible();
    const draftBg = await draftBadge.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Both should be visible (not transparent) and different from each other
    expect(activeBg).not.toBe("transparent");
    expect(activeBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(draftBg).not.toBe("transparent");
    expect(draftBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(activeBg).not.toBe(draftBg);
  });

  test("Metric numbers use monospace font (JetBrains Mono / monospace)", async ({
    page,
  }) => {
    const card = page.locator('[data-testid="job-card-1"]');
    const monoSpans = card.locator("span.font-mono");
    const count = await monoSpans.count();
    expect(count).toBeGreaterThanOrEqual(3); // resumes, >80%, interviews

    // Check computed font-family of the first mono span
    const fontFamily = await monoSpans.first().evaluate(
      (el) => window.getComputedStyle(el).fontFamily.toLowerCase()
    );
    const hasMonospace =
      fontFamily.includes("jetbrains") || fontFamily.includes("monospace");
    expect(hasMonospace).toBe(true);
  });

  test("Screenshot — b2-card-detail.png", async ({ page }) => {
    // Ensure first card is visible before screenshot
    const card = page.locator('[data-testid="job-card-1"]');
    await expect(card).toBeVisible();

    await page.screenshot({
      path: "screenshots/b2-card-detail.png",
      fullPage: false,
    });

    // Verify the file was created by checking no error was thrown
    expect(true).toBe(true);
  });
});
