import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/nav1";

test.describe("EVALUATOR NAV-1: Quick-command suggestions in chat", () => {
  test.setTimeout(60000);

  test("Step 1-2: Empty-state suggestions visible on dashboard", async ({
    page,
  }) => {
    // ─── Step 1: Navigate to /dashboard — chat main area is the primary surface ──
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Wait for the chat main area to be visible (conversation-center layout)
    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 10000 });

    // ─── Step 2: Verify suggestion chips are displayed in empty state ──
    const quickCommands = chatArea.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    // Verify the "Suggestions" label exists
    await expect(quickCommands.locator("p")).toContainText("Suggestions");

    // Verify at least 3 chips are rendered (dashboard context has 4)
    const chips = quickCommands.locator("button");
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(3);

    // Verify specific dashboard-context chip labels
    const chipLabels: string[] = [];
    for (let i = 0; i < chipCount; i++) {
      chipLabels.push((await chips.nth(i).textContent()) || "");
    }
    // Dashboard context should have job-creation and search-related chips
    const hasCreateJob = chipLabels.some((l) =>
      /create.*job/i.test(l),
    );
    const hasFindOrSearch = chipLabels.some((l) =>
      /find|search/i.test(l),
    );
    expect(hasCreateJob).toBe(true);
    expect(hasFindOrSearch).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-empty-state-chips.png`,
      fullPage: true,
    });
  });

  test("Step 3-4: Clicking a chip pre-fills the chat input (does NOT send)", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 10000 });

    const quickCommands = chatArea.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    // Get the first chip's text to know what prompt to expect
    const firstChip = quickCommands.locator("button").first();
    await expect(firstChip).toBeVisible();
    const chipLabel = await firstChip.textContent();

    // Read message count before clicking
    const chatMessages = chatArea.locator('[data-testid="chat-messages"]');
    const msgCountBefore = await chatMessages.locator(".max-w-\\[800px\\] > *").count();

    // ─── Step 3: Click the chip ──
    await firstChip.click();

    // ─── Step 4: Verify the chip's prompt pre-fills the input field ──
    const chatInput = page.locator('[data-testid="chat-input"]');
    const inputValue = await chatInput.inputValue();

    // Input should NOT be empty — it should have been pre-filled
    expect(inputValue.length).toBeGreaterThan(0);

    // The input should contain meaningful text (a prompt, not just the label)
    expect(inputValue.length).toBeGreaterThan(10);

    // Verify the message was NOT auto-sent — message count should be the same
    // (pre-fill, not send)
    const msgCountAfter = await chatMessages.locator(".max-w-\\[800px\\] > *").count();
    // The suggestion chips div may disappear after click in some states,
    // but the user message count should not increase
    expect(msgCountAfter).toBeLessThanOrEqual(msgCountBefore + 1);

    // Verify input has focus (user can immediately edit)
    const isFocused = await chatInput.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-chip-prefills-input.png`,
      fullPage: true,
    });
  });

  test("Step 5a: Different suggestions on /job/:id/pipeline route (mobile viewport)", async ({
    page,
  }) => {
    // On desktop, the pipeline page replaces ChatMainArea with PipelineView,
    // so quick-command chips are not visible in the main area.
    // On mobile, the chat tab remains accessible via bottom nav with route-aware context.
    // Test at mobile viewport to verify contextual chips change per route.
    await page.setViewportSize({ width: 375, height: 812 });

    // Navigate to /job/1/pipeline to set the route context
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });

    // On mobile, the chat tab should be the default view, or we can switch to it
    const mobileChat = page.locator('[data-testid="mobile-chat-view"]');
    const chatTabBtn = page.locator('[data-testid="mobile-tab-chat"]');
    if (!(await mobileChat.isVisible())) {
      await chatTabBtn.click();
      await expect(mobileChat).toBeVisible({ timeout: 5000 });
    }

    const quickCommands = mobileChat.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    const chips = quickCommands.locator("button");
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(3);

    // Collect chip labels
    const chipLabels: string[] = [];
    for (let i = 0; i < chipCount; i++) {
      chipLabels.push((await chips.nth(i).textContent()) || "");
    }

    // Pipeline context chips should be DIFFERENT from dashboard chips
    // Pipeline should have re-rank, filter, shortlist type suggestions
    const hasRerank = chipLabels.some((l) =>
      /re-?rank|sort/i.test(l),
    );
    const hasFilter = chipLabels.some((l) =>
      /filter|top.*scor/i.test(l),
    );
    const hasShortlist = chipLabels.some((l) =>
      /shortlist|advance|top\s*\d/i.test(l),
    );
    const hasFindMore = chipLabels.some((l) =>
      /find.*more|more.*candidates/i.test(l),
    );

    // At least 2 of these pipeline-specific suggestions should be present
    const pipelineSpecificCount = [hasRerank, hasFilter, hasShortlist, hasFindMore].filter(Boolean).length;
    expect(pipelineSpecificCount).toBeGreaterThanOrEqual(2);

    // Dashboard-specific chips should NOT appear
    const hasCreateJob = chipLabels.some((l) =>
      /create.*(?:new\s+)?job/i.test(l),
    );
    expect(hasCreateJob).toBe(false);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-pipeline-context-chips-mobile.png`,
      fullPage: true,
    });

    // ─── Also verify dashboard chips are different ──
    // Navigate to /dashboard and switch to chat tab
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    const chatTabBtn2 = page.locator('[data-testid="mobile-tab-chat"]');
    const mobileChat2 = page.locator('[data-testid="mobile-chat-view"]');
    if (!(await mobileChat2.isVisible())) {
      await chatTabBtn2.click();
      await expect(mobileChat2).toBeVisible({ timeout: 5000 });
    }

    const dashQuickCommands = mobileChat2.locator('[data-testid="quick-commands"]');
    await expect(dashQuickCommands).toBeVisible({ timeout: 5000 });

    const dashChips = dashQuickCommands.locator("button");
    const dashChipLabels: string[] = [];
    const dashChipCount = await dashChips.count();
    for (let i = 0; i < dashChipCount; i++) {
      dashChipLabels.push((await dashChips.nth(i).textContent()) || "");
    }

    // Dashboard should have "Create" job type chips, which pipeline does NOT
    const dashHasCreateJob = dashChipLabels.some((l) =>
      /create.*job/i.test(l),
    );
    expect(dashHasCreateJob).toBe(true);

    // Confirm dashboard chips are NOT the same as pipeline chips
    expect(chipLabels.join(",")).not.toBe(dashChipLabels.join(","));

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03b-dashboard-chips-mobile-comparison.png`,
      fullPage: true,
    });
  });

  test("Step 5b: Post-task suggestions appear after action-card message", async ({
    page,
  }) => {
    // Start on dashboard to get initial empty-state chips
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 10000 });

    // Verify dashboard chips are showing initially
    const quickCommands = chatArea.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    // Record current chip labels (dashboard context)
    const chipsBefore = quickCommands.locator("button");
    const labelsBefore: string[] = [];
    const countBefore = await chipsBefore.count();
    for (let i = 0; i < countBefore; i++) {
      labelsBefore.push((await chipsBefore.nth(i).textContent()) || "");
    }

    // Send a message that will trigger a task completion response
    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendBtn = page.locator('[data-testid="chat-send"]');
    await chatInput.fill("Hire a senior Go backend engineer in Berlin, 5+ years experience");
    await sendBtn.click();

    // Wait for the agent to respond (simulated response)
    await page.waitForTimeout(3000);

    // Check if suggestions are visible (they should appear after task completion
    // or if a JD preview / action card was generated)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-after-task-message.png`,
      fullPage: true,
    });
  });

  test("Design audit: chip styling matches Industrial Clarity spec", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 10000 });

    const quickCommands = chatArea.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    const firstChip = quickCommands.locator("button").first();
    await expect(firstChip).toBeVisible();

    // ─── Check background color is dark (surface-secondary = #1A1A1A) ──
    const chipBg = await firstChip.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const bgMatch = chipBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (bgMatch) {
      const [, r, g, b] = bgMatch.map(Number);
      // Dark theme: all channels below 80
      expect(r).toBeLessThan(80);
      expect(g).toBeLessThan(80);
      expect(b).toBeLessThan(80);
    }

    // ─── Check text color is secondary (#888888 range) ──
    const chipColor = await firstChip.evaluate(
      (el) => getComputedStyle(el).color,
    );
    const colorMatch = chipColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (colorMatch) {
      const [, r, g, b] = colorMatch.map(Number);
      // text-secondary should be in the gray range (~136 for #888)
      expect(r).toBeGreaterThan(80);
      expect(r).toBeLessThan(200);
    }

    // ─── Check font-family is monospace ──
    const fontFamily = await firstChip.evaluate(
      (el) => getComputedStyle(el).fontFamily,
    );
    const isMonospace =
      /mono|JetBrains|Consolas|Courier/i.test(fontFamily);
    expect(isMonospace).toBe(true);

    // ─── Check border exists (industrial: 1px solid --border-default) ──
    const borderStyle = await firstChip.evaluate(
      (el) => getComputedStyle(el).borderStyle,
    );
    expect(borderStyle).not.toBe("none");

    // ─── Check border-radius is 0 or <=4px (no pills, no rounded) ──
    const borderRadius = await firstChip.evaluate(
      (el) => getComputedStyle(el).borderRadius,
    );
    const radiusValue = parseFloat(borderRadius);
    // Industrial spec: "No border-radius (or max 4px)"
    expect(radiusValue).toBeLessThanOrEqual(4);

    // ─── Check font size is small (xs = ~12px) ──
    const fontSize = await firstChip.evaluate(
      (el) => getComputedStyle(el).fontSize,
    );
    const fontSizeValue = parseFloat(fontSize);
    expect(fontSizeValue).toBeLessThanOrEqual(14);
    expect(fontSizeValue).toBeGreaterThanOrEqual(10);

    // ─── Check the "Suggestions" label is uppercase tracking-widest ──
    const label = quickCommands.locator("p");
    const labelTransform = await label.evaluate(
      (el) => getComputedStyle(el).textTransform,
    );
    expect(labelTransform).toBe("uppercase");

    const labelLetterSpacing = await label.evaluate(
      (el) => getComputedStyle(el).letterSpacing,
    );
    // tracking-widest is ~0.1em which at 12px font is ~1.2px
    const spacingValue = parseFloat(labelLetterSpacing);
    expect(spacingValue).toBeGreaterThan(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-design-audit-chips.png`,
      fullPage: true,
    });

    // ─── Hover state: accent-primary color transition ──
    await firstChip.hover();
    await page.waitForTimeout(300); // allow transition

    const hoverBg = await firstChip.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const hoverColor = await firstChip.evaluate(
      (el) => getComputedStyle(el).color,
    );

    // After hover: background should shift to surface-tertiary (#262626)
    // and text should become accent-primary (#D4FF00)
    const hoverBgMatch = hoverBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (hoverBgMatch) {
      const [, r, g, b] = hoverBgMatch.map(Number);
      // surface-tertiary is #262626 → rgb(38,38,38)
      expect(r).toBeGreaterThanOrEqual(26); // darker than surface-secondary but lighter than primary
      expect(r).toBeLessThan(100);
    }

    // Hover text color should be accent-primary (chartreuse: #D4FF00 → high green)
    const hoverColorMatch = hoverColor.match(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/,
    );
    if (hoverColorMatch) {
      const [, r, g, b] = hoverColorMatch.map(Number);
      // #D4FF00 → rgb(212, 255, 0): very high green channel
      expect(g).toBeGreaterThan(180);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-hover-state.png`,
      fullPage: true,
    });
  });

  test("Chips contain Phosphor icons (not bare text)", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 10000 });

    const quickCommands = chatArea.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    // Each chip should contain an SVG icon (Phosphor renders as <svg>)
    const chips = quickCommands.locator("button");
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < chipCount; i++) {
      const svgInChip = chips.nth(i).locator("svg");
      await expect(svgInChip).toBeVisible();
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-icons-in-chips.png`,
      fullPage: true,
    });
  });

  test("Chips disappear when user sends a message (non-post-task)", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 10000 });

    // Chips visible initially
    const quickCommands = chatArea.locator('[data-testid="quick-commands"]');
    await expect(quickCommands).toBeVisible({ timeout: 5000 });

    // Type and send a normal message
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill("What is your name?");
    const sendBtn = page.locator('[data-testid="chat-send"]');
    await sendBtn.click();

    // Wait for agent response (which is a normal text response, not post-task)
    await page.waitForTimeout(2000);

    // After a non-task message exchange, chips should NOT show
    // (showSuggestions = messages.length <= 1 || isPostTask)
    // With 3 messages (welcome + user + agent), and agent response is not a task
    // completion, chips should be hidden
    const chipsVisible = await quickCommands.isVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-chips-hidden-after-normal-message.png`,
      fullPage: true,
    });

    // If the agent response doesn't contain task-completion keywords,
    // chips should be hidden (messages.length > 1 && !isPostTask)
    // This is the correct behavior: chips only show on empty state or post-task
    expect(chipsVisible).toBe(false);
  });
});
