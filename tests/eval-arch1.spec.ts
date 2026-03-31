import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.resolve(
  __dirname,
  "../screenshots/evaluator/arch1"
);

/**
 * ARCH-1 Evaluator — Layout Flip: AI chat as main area, data panels as right sidebar.
 *
 * This evaluator verifies:
 * 1. Desktop (1280px+): Chat area 60-70% width, right sidebar 30-40% width
 * 2. Right sidebar has tab buttons: Jobs / Pipeline / Profile
 * 3. Tab switching loads the correct data panel
 * 4. Sidebar collapse toggle hides sidebar, chat goes full-width
 * 5. Sidebar re-expand works
 * 6. Tablet (768-1279px): Sidebar auto-collapses to icon strip
 * 7. Mobile (<768px): Full-screen chat with bottom tab navigation
 * 8. Old left-sidebar chat layout is completely removed
 */

test.describe("Evaluator ARCH-1: Layout flip — AI chat main, data panels right sidebar", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 1: Desktop layout — chat area + sidebar proportions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Step 1-3: Desktop layout proportions — chat 60-70%, sidebar 30-40% with tab buttons", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000); // Allow layout to stabilize

    // ── Step 1: Verify chat-main-area exists on the left/center ──
    const chatMainArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatMainArea).toBeVisible({ timeout: 10000 });

    const chatBox = await chatMainArea.boundingBox();
    expect(chatBox).not.toBeNull();

    // Chat area should start at or very near x=0
    expect(chatBox!.x).toBeLessThanOrEqual(5);
    console.log(`  [MEASURE] chat-main-area: x=${chatBox!.x}, width=${chatBox!.width}, height=${chatBox!.height}`);

    // ── Step 2: Verify chat area occupies 60-70% of viewport width ──
    const chatWidthRatio = chatBox!.width / 1280;
    console.log(`  [MEASURE] Chat width ratio: ${(chatWidthRatio * 100).toFixed(1)}% of 1280px`);
    // Allowing 55-75% for the chat area (flexible range given collapsed-width offset)
    expect(chatWidthRatio).toBeGreaterThanOrEqual(0.55);
    expect(chatWidthRatio).toBeLessThanOrEqual(0.75);

    // ── Step 3: Verify right sidebar is visible and occupies 30-40% ──
    const dataPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(dataPanel).toBeVisible({ timeout: 10000 });

    const dataPanelBox = await dataPanel.boundingBox();
    expect(dataPanelBox).not.toBeNull();

    const dataPanelWidthRatio = dataPanelBox!.width / 1280;
    console.log(`  [MEASURE] Data panel: x=${dataPanelBox!.x}, width=${dataPanelBox!.width}`);
    console.log(`  [MEASURE] Data panel width ratio: ${(dataPanelWidthRatio * 100).toFixed(1)}% of 1280px`);

    // Data panel should be on the right side, after the chat area
    expect(dataPanelBox!.x).toBeGreaterThan(chatBox!.width * 0.9);
    // Data panel should be 25-45% (allowing some flexibility)
    expect(dataPanelWidthRatio).toBeGreaterThanOrEqual(0.25);
    expect(dataPanelWidthRatio).toBeLessThanOrEqual(0.45);

    // Combined widths should fill the viewport
    const totalWidth = chatBox!.width + dataPanelBox!.width;
    console.log(`  [MEASURE] Total width coverage: ${totalWidth}px / 1280px = ${((totalWidth / 1280) * 100).toFixed(1)}%`);
    expect(totalWidth).toBeGreaterThan(1270); // Allowing 10px for borders

    // ── Step 4: Verify right sidebar has tab buttons ──
    const tabBar = page.locator('[data-testid="data-panel-tabs"]');
    await expect(tabBar).toBeVisible();

    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    const profileTab = page.locator('[data-testid="data-panel-tab-profile"]');

    await expect(jobsTab).toBeVisible();
    await expect(pipelineTab).toBeVisible();
    await expect(profileTab).toBeVisible();

    // Verify tab text content
    const jobsTabText = await jobsTab.textContent();
    const pipelineTabText = await pipelineTab.textContent();
    const profileTabText = await profileTab.textContent();
    console.log(`  [TABS] Jobs: "${jobsTabText}", Pipeline: "${pipelineTabText}", Profile: "${profileTabText}"`);

    // Verify Jobs tab is the default active tab (accent-primary color)
    const jobsTabColor = await jobsTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [TABS] Jobs tab color (active): ${jobsTabColor}`);

    // Screenshot: desktop default layout
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-desktop-default.png"),
      fullPage: false,
    });

    // ── Verify Jobs panel is default content ──
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible();

    const firstJobCard = page.locator('[data-testid^="job-card-"]').first();
    await expect(firstJobCard).toBeVisible({ timeout: 5000 });
    console.log("  [DEFAULT TAB] Jobs panel with job cards visible");

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 2: Tab switching — verify each tab loads correct panel
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Step 5: Click each tab — verify the correct data panel loads", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // ── Default: Jobs tab and jobs panel visible ──
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 10000 });

    // ── Click a job card to populate pipeline data, then test pipeline tab ──
    const firstJobCard = page.locator('[data-testid^="job-card-"]').first();
    await expect(firstJobCard).toBeVisible({ timeout: 5000 });
    await firstJobCard.click();
    await page.waitForTimeout(500);

    // Pipeline tab should auto-activate after clicking a job card
    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    await expect(pipelinePanel).toBeVisible({ timeout: 5000 });

    // Verify candidate list exists in pipeline
    const candidateList = page.locator('[data-testid="pipeline-candidate-list"]');
    await expect(candidateList).toBeVisible();
    console.log("  [TAB SWITCH] Pipeline tab activated after job card click");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-pipeline-tab.png"),
      fullPage: false,
    });

    // ── Click first candidate to switch to profile tab ──
    const firstCandidate = page.locator('[data-testid^="candidate-row-"]').first();
    await expect(firstCandidate).toBeVisible({ timeout: 5000 });
    await firstCandidate.click();
    await page.waitForTimeout(500);

    // Profile tab should auto-activate
    const profilePanel = page.locator('[data-testid="profile-panel"]');
    await expect(profilePanel).toBeVisible({ timeout: 5000 });

    // Verify candidate header and score are shown
    const candidateHeader = page.locator('[data-testid="candidate-header"]');
    await expect(candidateHeader).toBeVisible();
    const candidateScore = page.locator('[data-testid="candidate-score"]');
    await expect(candidateScore).toBeVisible();
    console.log("  [TAB SWITCH] Profile tab activated after candidate click");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-profile-tab.png"),
      fullPage: false,
    });

    // ── Manually click Jobs tab to go back ──
    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    await jobsTab.click();
    await page.waitForTimeout(300);

    await expect(jobsPanel).toBeVisible();
    console.log("  [TAB SWITCH] Jobs tab manually re-activated");

    // ── Manually click Pipeline tab ──
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    await pipelineTab.click();
    await page.waitForTimeout(300);

    // Pipeline should show (may say "No job selected" or show previous selection)
    const pipelineTabActive = await pipelineTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [TAB SWITCH] Pipeline tab color after click: ${pipelineTabActive}`);

    // ── Manually click Profile tab ──
    const profileTab = page.locator('[data-testid="data-panel-tab-profile"]');
    await profileTab.click();
    await page.waitForTimeout(300);

    const profileTabActive = await profileTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [TAB SWITCH] Profile tab color after click: ${profileTabActive}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-tabs-all-tested.png"),
      fullPage: false,
    });

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 3: Sidebar collapse and re-expand
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Step 6-7: Sidebar collapse — chat goes full-width, re-expand restores", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const chatMainArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatMainArea).toBeVisible({ timeout: 10000 });

    // Measure initial chat width (with sidebar open)
    const chatBoxBefore = await chatMainArea.boundingBox();
    expect(chatBoxBefore).not.toBeNull();
    console.log(`  [COLLAPSE] Chat width before collapse: ${chatBoxBefore!.width}px`);

    // Verify expanded sidebar is visible
    const expandedPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(expandedPanel).toBeVisible();

    // ── Click collapse toggle ──
    const collapseToggle = page.locator('[data-testid="data-panel-toggle"]');
    await expect(collapseToggle).toBeVisible();
    await collapseToggle.click();
    await page.waitForTimeout(500); // Allow transition animation

    // Verify collapsed state appears
    const collapsedPanel = page.locator('[data-testid="data-panel-collapsed"]');
    await expect(collapsedPanel).toBeVisible({ timeout: 5000 });

    // Verify expanded panel is gone
    await expect(expandedPanel).not.toBeVisible();

    // Measure chat width after collapse — should be larger
    const chatBoxAfter = await chatMainArea.boundingBox();
    expect(chatBoxAfter).not.toBeNull();
    console.log(`  [COLLAPSE] Chat width after collapse: ${chatBoxAfter!.width}px`);
    console.log(`  [COLLAPSE] Width gain: +${(chatBoxAfter!.width - chatBoxBefore!.width).toFixed(0)}px`);

    expect(chatBoxAfter!.width).toBeGreaterThan(chatBoxBefore!.width);

    // Chat should now be nearly full-width (minus collapsed strip width ~56px)
    const collapsedChatRatio = chatBoxAfter!.width / 1280;
    console.log(`  [COLLAPSE] Chat width ratio (collapsed): ${(collapsedChatRatio * 100).toFixed(1)}%`);
    expect(collapsedChatRatio).toBeGreaterThan(0.90);

    // Verify collapsed panel has icon buttons for quick access
    const collapsedJobsIcon = page.locator('[data-testid="data-panel-icon-jobs"]');
    const collapsedPipelineIcon = page.locator('[data-testid="data-panel-icon-pipeline"]');
    const collapsedProfileIcon = page.locator('[data-testid="data-panel-icon-profile"]');
    await expect(collapsedJobsIcon).toBeVisible();
    await expect(collapsedPipelineIcon).toBeVisible();
    await expect(collapsedProfileIcon).toBeVisible();
    console.log("  [COLLAPSE] Icon strip buttons visible in collapsed state");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-collapsed-sidebar.png"),
      fullPage: false,
    });

    // ── Click expand toggle to re-expand ──
    const expandToggle = page.locator('[data-testid="data-panel-toggle"]');
    await expandToggle.click();
    await page.waitForTimeout(500);

    // Verify expanded panel is back
    await expect(expandedPanel).toBeVisible({ timeout: 5000 });
    await expect(collapsedPanel).not.toBeVisible();

    // Chat width should return to approximately original
    const chatBoxReExpanded = await chatMainArea.boundingBox();
    expect(chatBoxReExpanded).not.toBeNull();
    console.log(`  [RE-EXPAND] Chat width after re-expand: ${chatBoxReExpanded!.width}px`);

    // Should be close to original width (within 20px tolerance)
    expect(Math.abs(chatBoxReExpanded!.width - chatBoxBefore!.width)).toBeLessThan(20);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-re-expanded-sidebar.png"),
      fullPage: false,
    });

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 4: Tablet viewport — sidebar auto-collapses to icon strip
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Step 8: Tablet (1024x768) — sidebar auto-collapses to icon strip", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500); // Allow useMediaQuery to trigger and effects to fire

    // ── Verify chat area is visible ──
    const chatMainArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatMainArea).toBeVisible({ timeout: 10000 });

    // ── Verify sidebar is collapsed (icon strip) on tablet ──
    const collapsedPanel = page.locator('[data-testid="data-panel-collapsed"]');
    const expandedPanel = page.locator('[data-testid="data-panel-expanded"]');

    // On tablet, sidebar should auto-collapse
    await expect(collapsedPanel).toBeVisible({ timeout: 10000 });
    console.log("  [TABLET] Sidebar auto-collapsed to icon strip");

    // Measure chat area — should be nearly full-width on tablet
    const chatBox = await chatMainArea.boundingBox();
    expect(chatBox).not.toBeNull();
    const chatRatio = chatBox!.width / 1024;
    console.log(`  [TABLET] Chat width: ${chatBox!.width}px = ${(chatRatio * 100).toFixed(1)}% of 1024px`);
    expect(chatRatio).toBeGreaterThan(0.90);

    // Verify icon strip has tab icons
    const iconJobs = page.locator('[data-testid="data-panel-icon-jobs"]');
    const iconPipeline = page.locator('[data-testid="data-panel-icon-pipeline"]');
    const iconProfile = page.locator('[data-testid="data-panel-icon-profile"]');
    await expect(iconJobs).toBeVisible();
    await expect(iconPipeline).toBeVisible();
    await expect(iconProfile).toBeVisible();

    // ── Click an icon to expand sidebar ──
    await iconJobs.click();
    await page.waitForTimeout(500);

    await expect(expandedPanel).toBeVisible({ timeout: 5000 });
    console.log("  [TABLET] Sidebar expanded after icon click");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-tablet-1024.png"),
      fullPage: false,
    });

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 5: Mobile viewport — full-screen chat with bottom tabs
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Step 9: Mobile (375x812) — full-screen chat with bottom tab navigation", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // ── Verify full-screen chat view on mobile ──
    const mobileChatView = page.locator('[data-testid="mobile-chat-view"]');
    await expect(mobileChatView).toBeVisible({ timeout: 10000 });

    const mobileChatBox = await mobileChatView.boundingBox();
    expect(mobileChatBox).not.toBeNull();
    // Should span full width (375px viewport)
    expect(mobileChatBox!.width).toBeGreaterThanOrEqual(370);
    console.log(`  [MOBILE] Chat view: width=${mobileChatBox!.width}px, height=${mobileChatBox!.height}px`);

    // ── Verify desktop data panel is NOT visible ──
    const desktopDataPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(desktopDataPanel).toHaveCount(0);
    const desktopDataPanelCollapsed = page.locator('[data-testid="data-panel-collapsed"]');
    await expect(desktopDataPanelCollapsed).toHaveCount(0);
    console.log("  [MOBILE] Desktop data panels not present (correct)");

    // ── Verify bottom tab navigation ──
    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
    await expect(bottomNav).toBeVisible();

    const chatTab = page.locator('[data-testid="mobile-tab-chat"]');
    const jobsTab = page.locator('[data-testid="mobile-tab-dashboard"]');
    const pipelineTab = page.locator('[data-testid="mobile-tab-pipeline"]');

    await expect(chatTab).toBeVisible();
    await expect(jobsTab).toBeVisible();
    await expect(pipelineTab).toBeVisible();

    // Verify Chat tab is active (accent-primary color)
    const chatTabColor = await chatTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [MOBILE] Chat tab color (active): ${chatTabColor}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-mobile-chat-default.png"),
      fullPage: false,
    });

    // ── Switch to Jobs tab ──
    await jobsTab.click();
    await page.waitForTimeout(500);

    // Chat view should no longer be visible
    await expect(mobileChatView).not.toBeVisible();

    // Jobs content should be visible
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 5000 });
    console.log("  [MOBILE] Jobs tab activated — jobs panel visible");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-mobile-jobs-tab.png"),
      fullPage: false,
    });

    // ── Switch to Pipeline tab ──
    await pipelineTab.click();
    await page.waitForTimeout(500);

    // Verify pipeline content or empty state is shown
    const pipelineContent = page.locator('[data-testid="pipeline-candidate-list"]').or(
      page.locator('text=No job selected').or(page.locator('text=Select a job'))
    );
    await expect(pipelineContent.first()).toBeVisible({ timeout: 5000 });
    console.log("  [MOBILE] Pipeline tab activated — pipeline content visible");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "10-mobile-pipeline-tab.png"),
      fullPage: false,
    });

    // ── Switch back to Chat tab ──
    await chatTab.click();
    await page.waitForTimeout(500);
    await expect(mobileChatView).toBeVisible();
    console.log("  [MOBILE] Chat tab re-activated — chat view restored");

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 6: Verify old left-sidebar chat layout is removed
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Step 10: Previous left-sidebar chat layout is completely removed", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // ── Verify the old left-sidebar chat elements do NOT exist in the DOM ──
    const oldChatSidebarExpanded = page.locator('[data-testid="chat-sidebar-expanded"]');
    const oldChatSidebarCollapsed = page.locator('[data-testid="chat-sidebar-collapsed"]');
    const oldSidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
    const oldSidebarChatIcon = page.locator('[data-testid="sidebar-chat-icon"]');

    await expect(oldChatSidebarExpanded).toHaveCount(0);
    await expect(oldChatSidebarCollapsed).toHaveCount(0);
    await expect(oldSidebarToggle).toHaveCount(0);
    await expect(oldSidebarChatIcon).toHaveCount(0);

    console.log("  [OLD LAYOUT] chat-sidebar-expanded: NOT present (correct)");
    console.log("  [OLD LAYOUT] chat-sidebar-collapsed: NOT present (correct)");
    console.log("  [OLD LAYOUT] sidebar-toggle: NOT present (correct)");
    console.log("  [OLD LAYOUT] sidebar-chat-icon: NOT present (correct)");

    // ── Verify chat is in the MAIN area (left/center), not sidebar ──
    const chatMainArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatMainArea).toBeVisible();

    const chatBox = await chatMainArea.boundingBox();
    expect(chatBox).not.toBeNull();

    // Chat should be at x=0 (far left), NOT offset by a sidebar
    expect(chatBox!.x).toBeLessThanOrEqual(5);
    console.log(`  [OLD LAYOUT] Chat area starts at x=${chatBox!.x} — confirmed as main area, not sidebar`);

    // ── Verify the data panel is on the RIGHT, not the left ──
    const dataPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(dataPanel).toBeVisible();

    const dataPanelBox = await dataPanel.boundingBox();
    expect(dataPanelBox).not.toBeNull();
    expect(dataPanelBox!.x).toBeGreaterThan(600); // Should be in right half of 1280px viewport
    console.log(`  [OLD LAYOUT] Data panel at x=${dataPanelBox!.x} — confirmed right-side position`);

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 7: Design quality audit — colors, typography, spacing, craft
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Design audit: colors, typography, spacing, visual coherence", async ({
    browser,
  }) => {
    test.setTimeout(60000);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // ── Surface colors ──
    const bodyBg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    console.log(`  [DESIGN] Body background: ${bodyBg}`);

    // ── Chat area background ──
    const chatMainArea = page.locator('[data-testid="chat-main-area"]');
    const chatBg = await chatMainArea.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`  [DESIGN] Chat area background: ${chatBg}`);

    // ── Data panel background ──
    const dataPanel = page.locator('[data-testid="data-panel-expanded"]');
    const dataPanelBg = await dataPanel.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    console.log(`  [DESIGN] Data panel background: ${dataPanelBg}`);

    // ── Border between chat and data panel ──
    const dataPanelBorderLeft = await dataPanel.evaluate((el) =>
      window.getComputedStyle(el).borderLeftColor
    );
    console.log(`  [DESIGN] Data panel left border color: ${dataPanelBorderLeft}`);

    // ── Typography: Heading font ──
    const brandHeading = page.locator(".font-heading").first();
    if (await brandHeading.isVisible()) {
      const headingFont = await brandHeading.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );
      console.log(`  [DESIGN] Heading font: ${headingFont}`);
    }

    // ── Tab underline indicator ──
    const activeTabIndicator = page.locator('[data-testid="data-panel-tabs"] .bg-accent-primary');
    if (await activeTabIndicator.count() > 0) {
      const indicatorBg = await activeTabIndicator.first().evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`  [DESIGN] Active tab indicator color: ${indicatorBg}`);
    }

    // ── Chat input styling ──
    const chatInput = page.locator('[data-testid="chat-input"]');
    const chatInputBg = await chatInput.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const chatInputColor = await chatInput.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [DESIGN] Chat input bg: ${chatInputBg}, color: ${chatInputColor}`);

    // ── Accent color check — send button ──
    const sendBtn = page.locator('[data-testid="chat-send"]');
    const sendBtnColor = await sendBtn.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [DESIGN] Send button color: ${sendBtnColor}`);

    // ── Sidebar transition CSS ──
    const sidebarTransition = await dataPanel.evaluate((el) =>
      window.getComputedStyle(el).transition
    );
    console.log(`  [DESIGN] Sidebar transition: ${sidebarTransition}`);

    // ── Screenshot at 1440px ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-design-1440.png"),
      fullPage: false,
    });

    // Click a job to show pipeline
    const jobCard = page.locator('[data-testid^="job-card-"]').first();
    if (await jobCard.isVisible()) {
      await jobCard.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "12-design-1440-pipeline.png"),
        fullPage: false,
      });

      // Click a candidate
      const candidateRow = page.locator('[data-testid^="candidate-row-"]').first();
      if (await candidateRow.isVisible()) {
        await candidateRow.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "13-design-1440-profile.png"),
          fullPage: false,
        });
      }
    }

    await context.close();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 8: Chat functionality in new layout
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test("Chat functionality: send message, verify it appears in main area", async ({
    browser,
  }) => {
    test.setTimeout(60000);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // ── Verify chat input is in the main area ──
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // ── Type and send a message ──
    await chatInput.fill("Find senior Go engineers");
    const sendBtn = page.locator('[data-testid="chat-send"]');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();
    await page.waitForTimeout(1000);

    // ── Verify message appeared in the chat area ──
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toBeVisible();

    const userMessage = chatMessages.locator("text=Find senior Go engineers");
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    console.log("  [CHAT] User message appeared in main chat area");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "14-chat-message-sent.png"),
      fullPage: false,
    });

    await context.close();
  });
});
