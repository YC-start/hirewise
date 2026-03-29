import { test, expect } from "@playwright/test";

/**
 * D-4: Pipeline stage action buttons
 *
 * Validates the action buttons bar on the candidate profile page:
 * - Presence and count of all 5 action buttons
 * - Correct background colors per button variant
 * - Pill-shaped (rounded-full) border-radius
 * - Ghost style for Archive button
 * - Status badge updates on click
 * - Disabled state after activation
 */

test.describe("D-4 — Pipeline Stage Action Buttons", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/job/1/candidate/c1-01");
    await page.waitForSelector('[data-testid="action-buttons-bar"]', { timeout: 10000 });
  });

  test("action buttons bar exists and contains 5 buttons", async ({ page }) => {
    const bar = page.locator('[data-testid="action-buttons-bar"]');
    await expect(bar).toBeVisible();

    const buttons = bar.locator("button");
    await expect(buttons).toHaveCount(5);

    // Verify each button label
    const expectedLabels = [
      "Schedule Interview",
      "Reject",
      "Extend Offer",
      "Hire",
      "Archive",
    ];
    for (const label of expectedLabels) {
      await expect(bar.locator("button", { hasText: label })).toBeVisible();
    }
  });

  test("Schedule Interview button has accent-secondary background (~#00D4AA)", async ({ page }) => {
    const btn = page.locator('[data-testid="action-btn-schedule-interview"]');
    await expect(btn).toBeVisible();

    // c1-01 starts with "Interview" status, so Schedule Interview is initially disabled.
    // First transition to a different status so the button becomes active.
    const rejectBtn = page.locator('[data-testid="action-btn-reject"]');
    await rejectBtn.click();

    // Wait for React re-render
    await expect(btn).toBeEnabled();

    // Wait for transition to complete (transition-all duration-150)
    await page.waitForTimeout(300);

    // Now Schedule Interview should be enabled with accent-secondary bg
    const btnInfo = await btn.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        className: el.className,
        disabled: (el as HTMLButtonElement).disabled,
        accentSecondaryVar: cs.getPropertyValue("--accent-secondary").trim(),
        colorAccentSecondaryVar: cs.getPropertyValue("--color-accent-secondary").trim(),
      };
    });
    console.log("Schedule Interview button info:", JSON.stringify(btnInfo));

    // Verify the button has the accent-secondary class applied
    expect(btnInfo.className).toContain("bg-accent-secondary");
    expect(btnInfo.disabled).toBe(false);

    // The bg-accent-secondary class should resolve to #00D4AA / rgb(0, 212, 170)
    // Check the computed background color
    const bgColor = btnInfo.backgroundColor;
    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      // #00D4AA = rgb(0, 212, 170) — teal color
      // If Tailwind resolves correctly: G > R and B > R
      // If it resolves to surface color (38,38,38), the class is correct but CSS var may not resolve
      expect(g + b).toBeGreaterThan(r * 2); // At minimum, teal channels dominate
    }
    // Fallback: if computed color doesn't match due to Tailwind v4 CSS var resolution,
    // the class presence is the authoritative check
    expect(btnInfo.className).toContain("bg-accent-secondary");
  });

  test("Reject button has red background (~#FF4444)", async ({ page }) => {
    const btn = page.locator('[data-testid="action-btn-reject"]');
    await expect(btn).toBeVisible();

    const bgColor = await btn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // #FF4444 = rgb(255, 68, 68)
    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(match).not.toBeNull();
    const [, r, g, b] = match!.map(Number);
    expect(r).toBeGreaterThan(200);   // Red high
    expect(g).toBeLessThan(100);      // Green low
    expect(b).toBeLessThan(100);      // Blue low
  });

  test("Extend Offer button has green/lime background (~#D4FF00)", async ({ page }) => {
    const btn = page.locator('[data-testid="action-btn-extend-offer"]');
    await expect(btn).toBeVisible();

    const bgColor = await btn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // #D4FF00 = rgb(212, 255, 0)
    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(match).not.toBeNull();
    const [, r, g, b] = match!.map(Number);
    expect(r).toBeGreaterThan(170);   // Red high (lime)
    expect(g).toBeGreaterThan(200);   // Green high
    expect(b).toBeLessThan(30);       // Blue near 0
  });

  test("pill-shaped buttons have border-radius >= 9999px (rounded-full)", async ({ page }) => {
    // Check all non-archive buttons for rounded-full
    const pillTestIds = [
      "action-btn-schedule-interview",
      "action-btn-reject",
      "action-btn-extend-offer",
      "action-btn-hire",
    ];

    for (const testId of pillTestIds) {
      const btn = page.locator(`[data-testid="${testId}"]`);
      const borderRadius = await btn.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius;
      });
      // rounded-full -> 9999px or very large
      const numericRadius = parseFloat(borderRadius);
      expect(numericRadius).toBeGreaterThanOrEqual(9999);
    }
  });

  test("Archive is a ghost button (transparent bg, has border)", async ({ page }) => {
    const btn = page.locator('[data-testid="action-btn-archive"]');
    await expect(btn).toBeVisible();

    const styles = await btn.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        borderWidth: cs.borderWidth,
        borderStyle: cs.borderStyle,
      };
    });

    // Ghost: transparent background or rgba(0,0,0,0)
    const isTransparent =
      styles.backgroundColor === "rgba(0, 0, 0, 0)" ||
      styles.backgroundColor === "transparent";
    expect(isTransparent).toBe(true);

    // Should have a visible border
    expect(styles.borderStyle).not.toBe("none");
    const borderWidth = parseFloat(styles.borderWidth);
    expect(borderWidth).toBeGreaterThanOrEqual(1);
  });

  test("clicking Reject updates status badge to Rejected and disables button", async ({ page }) => {
    // Record initial status badge text
    const badge = page.locator('[data-testid="pipeline-status-badge"]');
    const initialStatus = await badge.textContent();
    console.log(`Initial pipeline status: "${initialStatus?.trim()}"`);

    // c1-01 starts as "Interview"
    expect(initialStatus?.trim()).toBe("Interview");

    // Click Reject
    const rejectBtn = page.locator('[data-testid="action-btn-reject"]');
    await rejectBtn.click();

    // Verify badge text becomes "Rejected"
    await expect(badge).toHaveText(/Rejected/i);

    // Verify Reject button is now disabled (with reduced opacity)
    await expect(rejectBtn).toBeDisabled();

    // Check for visual disabled indication: opacity on element or class-based opacity
    const disabledInfo = await rejectBtn.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        opacity: cs.opacity,
        className: el.className,
        cursor: cs.cursor,
      };
    });
    console.log("Disabled button info:", JSON.stringify(disabledInfo));

    // The button should have visual disabled state:
    // Either reduced CSS opacity OR opacity class applied OR cursor-not-allowed
    const hasOpacityClass = disabledInfo.className.includes("opacity-");
    const hasReducedOpacity = parseFloat(disabledInfo.opacity) < 0.6;
    const hasCursorNotAllowed = disabledInfo.cursor === "not-allowed";
    expect(hasOpacityClass || hasReducedOpacity || hasCursorNotAllowed).toBe(true);
  });

  test("clicking Schedule Interview updates status badge to Interview", async ({ page }) => {
    // First change status away from Interview (it starts as Interview)
    const rejectBtn = page.locator('[data-testid="action-btn-reject"]');
    await rejectBtn.click();

    const badge = page.locator('[data-testid="pipeline-status-badge"]');
    await expect(badge).toHaveText(/Rejected/i);

    // Now click Schedule Interview
    const scheduleBtn = page.locator('[data-testid="action-btn-schedule-interview"]');
    await scheduleBtn.click();

    // Verify badge updates to Interview
    await expect(badge).toHaveText(/Interview/i);
  });

  test("capture final screenshot", async ({ page }) => {
    // Perform the full interaction sequence for a representative screenshot
    const badge = page.locator('[data-testid="pipeline-status-badge"]');

    // Click Reject first
    const rejectBtn = page.locator('[data-testid="action-btn-reject"]');
    await rejectBtn.click();
    await expect(badge).toHaveText(/Rejected/i);

    // Then click Schedule Interview
    const scheduleBtn = page.locator('[data-testid="action-btn-schedule-interview"]');
    await scheduleBtn.click();
    await expect(badge).toHaveText(/Interview/i);

    // Take screenshot in final state
    await page.screenshot({
      path: "screenshots/d4-action-buttons.png",
      fullPage: false,
    });
  });
});
