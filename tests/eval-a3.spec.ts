import { test, expect } from "@playwright/test";

test.describe("A-3 · Structured Action Card Output", () => {
  test("renders action card after search query and validates visual spec", async ({
    page,
  }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Type search query into chat input
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.waitFor({ state: "visible", timeout: 5000 });
    await chatInput.fill(
      "Find me senior backend engineers with Go experience"
    );

    // Press Enter to send
    await chatInput.press("Enter");

    // Wait 8 seconds for progress sequence (1.5s + 3s + 4.5s + 0.6s action card)
    await page.waitForTimeout(8000);

    // ── Verify Action Card appears ──
    const actionCard = page.locator('[data-testid="action-card"]');
    await expect(actionCard).toBeVisible({ timeout: 5000 });

    // ── Verify left border (4px solid accent-secondary ~#00D4AA) ──
    const borderLeft = await actionCard.evaluate(
      (el) => getComputedStyle(el).borderLeft
    );
    // borderLeft is something like "4px solid rgb(0, 212, 170)"
    expect(borderLeft).toContain("4px");
    expect(borderLeft).toContain("solid");
    // Extract rgb and check it's close to #00D4AA = rgb(0, 212, 170)
    const borderColorMatch = borderLeft.match(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/
    );
    expect(borderColorMatch).not.toBeNull();
    if (borderColorMatch) {
      const [, r, g, b] = borderColorMatch.map(Number);
      expect(r).toBeLessThan(20); // ~0
      expect(g).toBeGreaterThan(190); // ~212
      expect(b).toBeGreaterThan(150); // ~170
    }

    // ── Verify background is surface-tertiary (#262626) ──
    const bgColor = await actionCard.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // #262626 = rgb(38, 38, 38)
    const bgMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(bgMatch).not.toBeNull();
    if (bgMatch) {
      const [, r, g, b] = bgMatch.map(Number);
      expect(r).toBeGreaterThan(30);
      expect(r).toBeLessThan(50);
      expect(g).toBeGreaterThan(30);
      expect(g).toBeLessThan(50);
      expect(b).toBeGreaterThan(30);
      expect(b).toBeLessThan(50);
    }

    // ── Verify title exists (e.g., "Search Complete") ──
    const title = page.locator('[data-testid="action-card-title"]');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText!.length).toBeGreaterThan(0);
    expect(titleText).toContain("Search Complete");

    // ── Verify summary text exists (non-empty) ──
    const summary = page.locator('[data-testid="action-card-summary"]');
    await expect(summary).toBeVisible();
    const summaryText = await summary.textContent();
    expect(summaryText).toBeTruthy();
    expect(summaryText!.length).toBeGreaterThan(0);

    // ── Verify key data/metrics exist (numbers present) ──
    const metrics = page.locator('[data-testid="action-card-metrics"]');
    await expect(metrics).toBeVisible();
    const metricsText = await metrics.textContent();
    expect(metricsText).toBeTruthy();
    // Should contain numeric values
    expect(metricsText).toMatch(/\d+/);

    // ── Verify "View Ranking" button exists and is pill-shaped ──
    const ctaButton = page.locator('[data-testid="action-card-cta"]');
    await expect(ctaButton).toBeVisible();
    const ctaText = await ctaButton.textContent();
    expect(ctaText).toContain("View Ranking");

    // Check pill shape: border-radius >= 9999px
    const borderRadius = await ctaButton.evaluate(
      (el) => getComputedStyle(el).borderRadius
    );
    const radiusValue = parseFloat(borderRadius);
    expect(radiusValue).toBeGreaterThanOrEqual(9999);

    // ── Verify CTA button has accent-primary background (#D4FF00) ──
    const ctaBg = await ctaButton.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // #D4FF00 = rgb(212, 255, 0)
    const ctaBgMatch = ctaBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(ctaBgMatch).not.toBeNull();
    if (ctaBgMatch) {
      const [, r, g, b] = ctaBgMatch.map(Number);
      expect(r).toBeGreaterThan(190); // ~212
      expect(g).toBeGreaterThan(230); // ~255
      expect(b).toBeLessThan(30); // ~0
    }

    // ── Take screenshot BEFORE clicking ──
    await page.screenshot({
      path: "screenshots/a3-action-card.png",
      fullPage: false,
    });

    // ── Click "View Ranking" button ──
    await ctaButton.click();

    // ── Verify navigation to /job/*/pipeline ──
    await page.waitForURL(/\/job\/.*\/pipeline/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/job\/.*\/pipeline/);
  });
});
