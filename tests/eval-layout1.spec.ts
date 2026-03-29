import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.resolve(__dirname, "../screenshots");

test.describe("LAYOUT-1: Persistent chat sidebar with collapse", () => {
  test("Desktop sidebar expand/collapse and mobile bottom nav", async ({
    browser,
  }) => {
    // ── Desktop viewport 1280x800 ──
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // 1. Verify chat sidebar exists (expanded state by default at 1280px)
    const sidebarExpanded = page.locator(
      '[data-testid="chat-sidebar-expanded"]'
    );
    await expect(sidebarExpanded).toBeVisible({ timeout: 10000 });

    // Verify "HIREWISE" text is present inside the sidebar header
    const hirewiseText = sidebarExpanded.locator(
      "span.font-heading", { hasText: "HireWise" }
    );
    await expect(hirewiseText).toBeVisible();

    // 2. Get sidebar width and verify it is close to 380px (expanded)
    const expandedBox = await sidebarExpanded.boundingBox();
    expect(expandedBox).not.toBeNull();
    expect(expandedBox!.width).toBeGreaterThanOrEqual(360);
    expect(expandedBox!.width).toBeLessThanOrEqual(400);
    console.log(`  [expanded] sidebar width = ${expandedBox!.width}px`);

    // 3. Click the sidebar collapse toggle button
    const toggleBtn = page.locator('[data-testid="sidebar-toggle"]');
    await toggleBtn.click();

    // 4. Wait for transition
    await page.waitForTimeout(300);

    // 5. Verify sidebar is now collapsed (~56px)
    const sidebarCollapsed = page.locator(
      '[data-testid="chat-sidebar-collapsed"]'
    );
    await expect(sidebarCollapsed).toBeVisible({ timeout: 5000 });

    const collapsedBox = await sidebarCollapsed.boundingBox();
    expect(collapsedBox).not.toBeNull();
    expect(collapsedBox!.width).toBeGreaterThanOrEqual(46);
    expect(collapsedBox!.width).toBeLessThanOrEqual(66);
    console.log(`  [collapsed] sidebar width = ${collapsedBox!.width}px`);

    // 6. Screenshot collapsed state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "layout1-collapsed.png"),
      fullPage: false,
    });

    // 7. Click toggle again to re-expand
    const toggleBtnCollapsed = sidebarCollapsed.locator(
      '[data-testid="sidebar-toggle"]'
    );
    await toggleBtnCollapsed.click();

    // 8. Wait for transition
    await page.waitForTimeout(300);

    // 9. Verify sidebar is expanded again
    const sidebarReExpanded = page.locator(
      '[data-testid="chat-sidebar-expanded"]'
    );
    await expect(sidebarReExpanded).toBeVisible({ timeout: 5000 });

    const reExpandedBox = await sidebarReExpanded.boundingBox();
    expect(reExpandedBox).not.toBeNull();
    expect(reExpandedBox!.width).toBeGreaterThanOrEqual(360);
    expect(reExpandedBox!.width).toBeLessThanOrEqual(400);
    console.log(`  [re-expanded] sidebar width = ${reExpandedBox!.width}px`);

    // 10. Screenshot expanded state
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "layout1-expanded.png"),
      fullPage: false,
    });

    await context.close();

    // ── Mobile viewport 375x812 ──
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto("/dashboard", { waitUntil: "networkidle" });

    // 11. Verify bottom tab navigation exists
    const bottomNav = mobilePage.locator('[data-testid="mobile-bottom-nav"]');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    // Verify nav has tab buttons
    await expect(
      mobilePage.locator('[data-testid="mobile-tab-chat"]')
    ).toBeVisible();
    await expect(
      mobilePage.locator('[data-testid="mobile-tab-dashboard"]')
    ).toBeVisible();
    await expect(
      mobilePage.locator('[data-testid="mobile-tab-pipeline"]')
    ).toBeVisible();

    // 12. Verify desktop sidebar is NOT visible on mobile
    const desktopSidebarExpanded = mobilePage.locator(
      '[data-testid="chat-sidebar-expanded"]'
    );
    const desktopSidebarCollapsed = mobilePage.locator(
      '[data-testid="chat-sidebar-collapsed"]'
    );
    await expect(desktopSidebarExpanded).toHaveCount(0);
    await expect(desktopSidebarCollapsed).toHaveCount(0);

    // 13. Screenshot mobile view
    await mobilePage.screenshot({
      path: path.join(SCREENSHOT_DIR, "layout1-mobile.png"),
      fullPage: false,
    });

    await mobileContext.close();
  });
});
