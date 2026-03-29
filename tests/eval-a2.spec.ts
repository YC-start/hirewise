import { test, expect } from "@playwright/test";

test.describe("A-2: Live progress ticker during Agent execution", () => {
  test.setTimeout(30_000);

  test("shows segmented progress bar with real-time status text", async ({
    page,
  }) => {
    // Viewport 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to dashboard
    await page.goto("/dashboard");

    // Wait for the chat sidebar to load (expanded state)
    const sidebar = page.locator('[data-testid="chat-sidebar-expanded"]');
    await sidebar.waitFor({ state: "visible", timeout: 10_000 });

    // Type the search query into chat input
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.waitFor({ state: "visible" });
    await chatInput.fill(
      "Find me 50 senior backend engineers with Go experience"
    );

    // Click the Send button
    const sendButton = page.locator('[data-testid="chat-send"]');
    await sendButton.click();

    // Wait 2 seconds for progress bar to appear
    await page.waitForTimeout(2_000);

    // ------------------------------------------------------------------
    // Verify progress indicator component appeared
    // ------------------------------------------------------------------
    const progressIndicator = page.locator(
      '[data-testid="progress-indicator"]'
    );
    await expect(progressIndicator).toBeVisible();

    // ------------------------------------------------------------------
    // Verify progress bar has multiple segments (at least 3, actually 4)
    // ------------------------------------------------------------------
    const segments = page.locator('[data-testid^="progress-segment-"]');
    const segmentCount = await segments.count();
    expect(segmentCount).toBeGreaterThanOrEqual(3);

    // ------------------------------------------------------------------
    // Verify status text exists with expected keywords
    // ------------------------------------------------------------------
    const statusText = page.locator('[data-testid="progress-status-text"]');
    await expect(statusText).toBeVisible();
    const statusContent = await statusText.textContent();
    expect(statusContent).toBeTruthy();

    const hasKeyword = /searching|retrieved|scoring|complete/i.test(
      statusContent!
    );
    expect(hasKeyword).toBe(true);

    // ------------------------------------------------------------------
    // Verify status text uses monospace font (via CSS var or computed)
    // ------------------------------------------------------------------
    const fontFamily = await statusText.evaluate(
      (el) => window.getComputedStyle(el).fontFamily
    );
    const isMonospace =
      /mono|jetbrains|courier|consolas|menlo/i.test(fontFamily) ||
      fontFamily.includes("var(--font-mono)");
    expect(isMonospace).toBe(true);

    // ------------------------------------------------------------------
    // Screenshot: progress in-flight
    // ------------------------------------------------------------------
    await page.screenshot({
      path: "screenshots/a2-progress-searching.png",
      fullPage: false,
    });

    // ------------------------------------------------------------------
    // Wait 6 seconds for progress to complete (steps at 1.5s, 3s, 4.5s)
    // ------------------------------------------------------------------
    await page.waitForTimeout(6_000);

    // ------------------------------------------------------------------
    // Verify all segments are filled (complete state) by checking bg color
    // ------------------------------------------------------------------
    const allSegments = await segments.all();
    for (const segment of allSegments) {
      const bgColor = await segment.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );
      // Accent-primary (#D4FF00) should not be the unfilled color (#262626)
      // #262626 = rgb(38, 38, 38)
      expect(bgColor).not.toBe("rgb(38, 38, 38)");
    }

    // Also verify status text shows "Complete" keyword
    const finalStatusContent = await statusText.textContent();
    expect(finalStatusContent).toMatch(/complete/i);

    // Verify the progressbar aria-valuenow is 100
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toHaveAttribute("aria-valuenow", "100");

    // ------------------------------------------------------------------
    // Screenshot: progress complete
    // ------------------------------------------------------------------
    await page.screenshot({
      path: "screenshots/a2-progress-complete.png",
      fullPage: false,
    });
  });
});
