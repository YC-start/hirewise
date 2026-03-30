import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "/home/administrator/playground/hirewise/screenshots";

test.describe("A-6: Chat message styling and distinction", () => {
  test("user and agent messages have correct distinct styling", async ({
    page,
  }) => {
    test.setTimeout(30000);

    // 1. Navigate to dashboard where the chat main area is visible
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // 2. The welcome message (agent) should already be visible
    const agentBubble = page
      .locator('[data-testid="chat-bubble-agent"]')
      .first();
    await expect(agentBubble).toBeVisible({ timeout: 10000 });

    // 3. Send a user message
    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });
    await chatInput.first().fill("Hello, I need to hire a backend engineer");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]',
    );
    await sendBtn.first().click();

    // 4. Wait for user message bubble to appear
    const userBubble = page
      .locator('[data-testid="chat-bubble-user"]')
      .first();
    await expect(userBubble).toBeVisible({ timeout: 5000 });

    // 5. Verify user message bubble styling
    // The message bubble is the second child div (after the avatar)
    const userMsgDiv = userBubble.locator("div").nth(1);
    const userBg = await userMsgDiv.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const userColor = await userMsgDiv.evaluate(
      (el) => getComputedStyle(el).color,
    );
    const userRadius = await userMsgDiv.evaluate(
      (el) => getComputedStyle(el).borderRadius,
    );

    // User bubble: #D4FF00 background = rgb(212, 255, 0)
    expect(userBg).toBe("rgb(212, 255, 0)");
    // User text: #0D0D0D = rgb(13, 13, 13)
    expect(userColor).toBe("rgb(13, 13, 13)");
    // Border radius must not exceed 4px
    const userRadiusPx = parseFloat(userRadius);
    expect(userRadiusPx).toBeLessThanOrEqual(4);

    // 6. Verify agent message bubble styling
    const agentMsgDiv = agentBubble.locator("div").nth(1);
    const agentBg = await agentMsgDiv.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const agentColor = await agentMsgDiv.evaluate(
      (el) => getComputedStyle(el).color,
    );
    const agentRadius = await agentMsgDiv.evaluate(
      (el) => getComputedStyle(el).borderRadius,
    );

    // Agent bubble: #1A1A1A background = rgb(26, 26, 26)
    expect(agentBg).toBe("rgb(26, 26, 26)");
    // Agent text: #E8E8E8 = rgb(232, 232, 232)
    expect(agentColor).toBe("rgb(232, 232, 232)");
    // Border radius must not exceed 4px
    const agentRadiusPx = parseFloat(agentRadius);
    expect(agentRadiusPx).toBeLessThanOrEqual(4);

    // 7. Verify rectangular shape (no speech-bubble tails / pseudo-elements)
    // Check that there are no ::before or ::after pseudo-elements with content
    const userHasTail = await userMsgDiv.evaluate((el) => {
      const before = getComputedStyle(el, "::before").content;
      const after = getComputedStyle(el, "::after").content;
      return (
        (before !== "none" && before !== "" && before !== '""') ||
        (after !== "none" && after !== "" && after !== '""')
      );
    });
    expect(userHasTail).toBe(false);

    const agentHasTail = await agentMsgDiv.evaluate((el) => {
      const before = getComputedStyle(el, "::before").content;
      const after = getComputedStyle(el, "::after").content;
      return (
        (before !== "none" && before !== "" && before !== '""') ||
        (after !== "none" && after !== "" && after !== '""')
      );
    });
    expect(agentHasTail).toBe(false);

    // 8. Screenshot for visual verification
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/a6-chat-message-styling.png`,
      fullPage: false,
    });
  });

  test("user message background is NOT transparent", async ({ page }) => {
    test.setTimeout(30000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });
    await chatInput.first().fill("Test message for styling");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]',
    );
    await sendBtn.first().click();

    const userBubble = page
      .locator('[data-testid="chat-bubble-user"]')
      .first();
    await expect(userBubble).toBeVisible({ timeout: 5000 });

    // Verify background is NOT transparent (the previous bug)
    const userMsgDiv = userBubble.locator("div").nth(1);
    const bgColor = await userMsgDiv.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );

    // Must NOT be transparent
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(bgColor).not.toBe("transparent");

    // Must be the accent-primary color (#D4FF00)
    expect(bgColor).toBe("rgb(212, 255, 0)");
  });

  test("both bubble types have consistent rectangular shape across messages", async ({
    page,
  }) => {
    test.setTimeout(30000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });

    // Send multiple messages to verify consistency
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]',
    );

    await chatInput.first().fill("First test message");
    await sendBtn.first().click();

    // Wait for agent response
    await page.waitForTimeout(2000);

    await chatInput.first().fill("Second test message");
    await sendBtn.first().click();

    // Wait for messages to render
    await page.waitForTimeout(2000);

    // Check all user bubbles
    const userBubbles = page.locator('[data-testid="chat-bubble-user"]');
    const userCount = await userBubbles.count();
    expect(userCount).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < userCount; i++) {
      const msgDiv = userBubbles.nth(i).locator("div").nth(1);
      const radius = await msgDiv.evaluate(
        (el) => getComputedStyle(el).borderRadius,
      );
      const radiusPx = parseFloat(radius);
      expect(radiusPx).toBeLessThanOrEqual(4);

      const bg = await msgDiv.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      expect(bg).toBe("rgb(212, 255, 0)");
    }

    // Check all agent bubbles
    const agentBubbles = page.locator('[data-testid="chat-bubble-agent"]');
    const agentCount = await agentBubbles.count();
    expect(agentCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < agentCount; i++) {
      const msgDiv = agentBubbles.nth(i).locator("div").nth(1);
      const radius = await msgDiv.evaluate(
        (el) => getComputedStyle(el).borderRadius,
      );
      const radiusPx = parseFloat(radius);
      expect(radiusPx).toBeLessThanOrEqual(4);

      const bg = await msgDiv.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      expect(bg).toBe("rgb(26, 26, 26)");
    }

    // Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/a6-multiple-messages.png`,
      fullPage: false,
    });
  });
});
