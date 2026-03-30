import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "/home/administrator/playground/hirewise/screenshots";

test.describe("A-4: Conversational Follow-up and Refinement", () => {
  test("refinement flow: search → follow-up filter → updated results", async ({
    page,
  }) => {
    test.setTimeout(45000);

    // 1. Navigate to dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // 2. Locate chat input
    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });

    // 3. Perform an initial search using a mock job query
    await chatInput
      .first()
      .fill(
        "Find me senior backend engineers with Go and Kubernetes experience",
      );
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]',
    );
    await sendBtn.first().click();

    // 4. Wait for the initial search to complete — Action Card should appear
    const firstActionCard = page.locator('[data-testid="action-card"]').first();
    await expect(firstActionCard).toBeVisible({ timeout: 12000 });

    // Verify it says "Search Complete"
    await expect(
      page
        .locator('[data-testid="action-card-title"]')
        .first(),
    ).toHaveText("Search Complete");

    // 5. Screenshot: initial search results
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/a4-initial-search.png`,
      fullPage: false,
    });

    // 6. Type a refinement follow-up: filter by score threshold
    await chatInput.first().fill("Show only candidates with score above 80");
    await sendBtn.first().click();

    // 7. Wait for agent to acknowledge the refinement
    const refineAck = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("Refining results")',
    );
    await expect(refineAck).toBeVisible({ timeout: 5000 });

    // 8. Wait for the refinement summary message
    const refineSummary = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("Refined results")',
    );
    await expect(refineSummary).toBeVisible({ timeout: 5000 });

    // 9. Wait for the "Refined Results" action card to appear
    const refinedActionCard = page.locator(
      '[data-testid="action-card-title"]:has-text("Refined Results")',
    );
    await expect(refinedActionCard).toBeVisible({ timeout: 5000 });

    // 10. Verify the PREVIOUS "Search Complete" action card is still visible
    const allActionCards = page.locator('[data-testid="action-card"]');
    const cardCount = await allActionCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Verify first action card still has "Search Complete"
    const firstTitle = await page
      .locator('[data-testid="action-card-title"]')
      .first()
      .textContent();
    expect(firstTitle).toBe("Search Complete");

    // 11. Verify the refined action card shows "Showing" metric (filtered count)
    const refinedCard = allActionCards.last();
    const refinedMetrics = await refinedCard
      .locator('[data-testid="action-card-metrics"]')
      .textContent();
    expect(refinedMetrics).toContain("Showing");
    expect(refinedMetrics).toContain("Original");

    // 12. Screenshot: after refinement
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/a4-refined-results.png`,
      fullPage: false,
    });
  });

  test("reset refinement: show all restores original results", async ({
    page,
  }) => {
    test.setTimeout(45000);

    // 1. Navigate and perform initial search
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });

    await chatInput.first().fill("Find senior frontend engineers with React");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]',
    );
    await sendBtn.first().click();

    // Wait for initial search action card
    const firstActionCard = page.locator('[data-testid="action-card"]').first();
    await expect(firstActionCard).toBeVisible({ timeout: 12000 });

    // 2. Apply a filter
    await chatInput.first().fill("Show only top 3 candidates");
    await sendBtn.first().click();

    // Wait for refinement
    const refinedCard = page.locator(
      '[data-testid="action-card-title"]:has-text("Refined Results")',
    );
    await expect(refinedCard).toBeVisible({ timeout: 5000 });

    // 3. Reset filters
    await chatInput.first().fill("Show all");
    await sendBtn.first().click();

    // Wait for reset confirmation
    const resetMsg = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("Filters cleared")',
    );
    await expect(resetMsg).toBeVisible({ timeout: 5000 });

    // 4. Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/a4-reset-filters.png`,
      fullPage: false,
    });
  });

  test("sort-by refinement: re-rank by sub-score", async ({ page }) => {
    test.setTimeout(45000);

    // 1. Navigate and perform initial search
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]',
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 10000 });

    await chatInput
      .first()
      .fill("Find me backend engineers with Go experience");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]',
    );
    await sendBtn.first().click();

    // Wait for initial search action card
    const firstActionCard = page.locator('[data-testid="action-card"]').first();
    await expect(firstActionCard).toBeVisible({ timeout: 12000 });

    // 2. Request re-ranking
    await chatInput.first().fill("Re-rank by technical fit");
    await sendBtn.first().click();

    // Wait for refinement acknowledgement
    const refineAck = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("Refining results")',
    );
    await expect(refineAck).toBeVisible({ timeout: 5000 });

    // Wait for the refined results card
    const refinedCard = page.locator(
      '[data-testid="action-card-title"]:has-text("Refined Results")',
    );
    await expect(refinedCard).toBeVisible({ timeout: 5000 });

    // 3. Verify the summary mentions "sorted by"
    const summaryMsg = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("sorted by Technical Fit")',
    );
    await expect(summaryMsg).toBeVisible({ timeout: 3000 });

    // 4. Screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/a4-rerank-techfit.png`,
      fullPage: false,
    });
  });
});
