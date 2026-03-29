import { test, expect } from "@playwright/test";
import path from "path";

const SCREENSHOT_DIR = path.resolve(__dirname, "../screenshots");

test.describe("ARCH-1: Layout flip — AI conversation center, data panels as right sidebar", () => {
  test("Desktop: AI chat left/center, data panel right sidebar with tab flow", async ({
    browser,
  }) => {
    // ── Desktop viewport 1280x800 ──
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // ── 1. Verify AI conversation area is in left/center position ──
    const chatMainArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatMainArea).toBeVisible({ timeout: 10000 });

    const chatBox = await chatMainArea.boundingBox();
    expect(chatBox).not.toBeNull();
    // Chat area should start at or near x=0 (left side)
    expect(chatBox!.x).toBeLessThanOrEqual(10);
    console.log(
      `  [chat-main-area] x=${chatBox!.x}, width=${chatBox!.width}`
    );

    // ── 2. Verify data panel is on the right side ──
    const dataPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(dataPanel).toBeVisible({ timeout: 10000 });

    const dataPanelBox = await dataPanel.boundingBox();
    expect(dataPanelBox).not.toBeNull();
    // Data panel x position should be to the right of chat area
    expect(dataPanelBox!.x).toBeGreaterThan(chatBox!.width - 20);
    console.log(
      `  [data-panel] x=${dataPanelBox!.x}, width=${dataPanelBox!.width}`
    );

    // Verify chat area occupies the majority of the space (>55%)
    const chatRatio = chatBox!.width / 1280;
    expect(chatRatio).toBeGreaterThan(0.55);
    console.log(`  [layout ratio] chat=${(chatRatio * 100).toFixed(1)}%`);

    // ── 3. Verify data panel has tab switching ──
    const tabBar = page.locator('[data-testid="data-panel-tabs"]');
    await expect(tabBar).toBeVisible();

    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    const profileTab = page.locator('[data-testid="data-panel-tab-profile"]');

    await expect(jobsTab).toBeVisible();
    await expect(pipelineTab).toBeVisible();
    await expect(profileTab).toBeVisible();

    // ── 4. Verify Jobs tab is default and shows job cards ──
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible();

    // Verify at least one job card exists
    const firstJobCard = page.locator('[data-testid^="job-card-"]').first();
    await expect(firstJobCard).toBeVisible({ timeout: 5000 });
    console.log("  [jobs-tab] Job cards visible in default view");

    // ── 5. Screenshot: desktop default state ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "arch1-desktop-default.png"),
      fullPage: false,
    });

    // ── 6. Click a job card ──
    await firstJobCard.click();

    // Wait for tab transition
    await page.waitForTimeout(300);

    // ── 7. Verify Pipeline tab is activated with candidate list ──
    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    await expect(pipelinePanel).toBeVisible({ timeout: 5000 });

    // Pipeline tab should have active styling (accent-primary color)
    const pipelineTabColor = await pipelineTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [pipeline-tab] active color: ${pipelineTabColor}`);

    // Verify candidate list is present
    const candidateList = page.locator(
      '[data-testid="pipeline-candidate-list"]'
    );
    await expect(candidateList).toBeVisible();

    // Verify at least one candidate row
    const firstCandidate = page
      .locator('[data-testid^="candidate-row-"]')
      .first();
    await expect(firstCandidate).toBeVisible({ timeout: 5000 });
    console.log("  [pipeline-tab] Candidate list visible");

    // ── 8. Screenshot: pipeline panel ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "arch1-pipeline-panel.png"),
      fullPage: false,
    });

    // ── 9. Click a candidate ──
    await firstCandidate.click();

    // Wait for tab transition
    await page.waitForTimeout(300);

    // ── 10. Verify Profile tab is activated with candidate details ──
    const profilePanel = page.locator('[data-testid="profile-panel"]');
    await expect(profilePanel).toBeVisible({ timeout: 5000 });

    // Profile tab should be active
    const profileTabColor = await profileTab.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    console.log(`  [profile-tab] active color: ${profileTabColor}`);

    // Verify candidate header (name + score) is visible
    const candidateHeader = page.locator('[data-testid="candidate-header"]');
    await expect(candidateHeader).toBeVisible();

    const candidateScore = page.locator('[data-testid="candidate-score"]');
    await expect(candidateScore).toBeVisible();
    console.log("  [profile-tab] Candidate detail visible");

    // ── 11. Screenshot: profile panel ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "arch1-profile-panel.png"),
      fullPage: false,
    });

    // ── 12. Test data panel collapse ──
    const collapseBtn = page.locator('[data-testid="data-panel-toggle"]');
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();

    // Wait for transition
    await page.waitForTimeout(400);

    // Verify collapsed state
    const collapsedPanel = page.locator(
      '[data-testid="data-panel-collapsed"]'
    );
    await expect(collapsedPanel).toBeVisible({ timeout: 5000 });

    // ── 13. Verify chat area width increased after collapse ──
    const chatBoxAfterCollapse = await chatMainArea.boundingBox();
    expect(chatBoxAfterCollapse).not.toBeNull();
    expect(chatBoxAfterCollapse!.width).toBeGreaterThan(chatBox!.width);
    console.log(
      `  [collapsed] chat width: ${chatBox!.width} -> ${chatBoxAfterCollapse!.width} (+${(chatBoxAfterCollapse!.width - chatBox!.width).toFixed(0)}px)`
    );

    // ── 14. Screenshot: collapsed state ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "arch1-collapsed.png"),
      fullPage: false,
    });

    // Re-expand the panel before chat test
    const expandBtn = page.locator('[data-testid="data-panel-toggle"]');
    await expandBtn.click();
    await page.waitForTimeout(400);

    // ── 15. Test chat input — type and send a message ──
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible();

    await chatInput.fill("Find senior Go engineers");

    const sendBtn = page.locator('[data-testid="chat-send"]');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // Wait for message to appear
    await page.waitForTimeout(500);

    // ── 16. Verify the message appears in the conversation area ──
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toBeVisible();

    // Look for the user message text in the messages area
    const userMessage = chatMessages.locator("text=Find senior Go engineers");
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    console.log("  [chat] User message appeared in main area");

    // ── 17. Screenshot: chat active with message ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "arch1-chat-active.png"),
      fullPage: false,
    });

    await context.close();
  });

  test("Mobile: full-screen chat with bottom tab navigation", async ({
    browser,
  }) => {
    // ── Mobile viewport 375x812 ──
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await mobileContext.newPage();

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // ── 1. Verify AI chat is full-screen on mobile ──
    const mobileChatView = page.locator('[data-testid="mobile-chat-view"]');
    await expect(mobileChatView).toBeVisible({ timeout: 10000 });

    const mobileChatBox = await mobileChatView.boundingBox();
    expect(mobileChatBox).not.toBeNull();
    // Chat view should span full width (375px viewport)
    expect(mobileChatBox!.width).toBeGreaterThanOrEqual(370);
    console.log(
      `  [mobile-chat] width=${mobileChatBox!.width}, height=${mobileChatBox!.height}`
    );

    // ── 2. Verify desktop data panel is NOT visible on mobile ──
    const desktopDataPanel = page.locator(
      '[data-testid="data-panel-expanded"]'
    );
    await expect(desktopDataPanel).toHaveCount(0);

    // ── 3. Verify bottom tab navigation ──
    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
    await expect(bottomNav).toBeVisible();

    const chatTab = page.locator('[data-testid="mobile-tab-chat"]');
    const jobsTab = page.locator('[data-testid="mobile-tab-dashboard"]');
    const pipelineTab = page.locator('[data-testid="mobile-tab-pipeline"]');

    await expect(chatTab).toBeVisible();
    await expect(jobsTab).toBeVisible();
    await expect(pipelineTab).toBeVisible();
    console.log("  [mobile] Bottom nav tabs: Chat, Jobs, Pipeline visible");

    // ── 4. Screenshot: mobile view ──
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "arch1-mobile.png"),
      fullPage: false,
    });

    await mobileContext.close();
  });
});
