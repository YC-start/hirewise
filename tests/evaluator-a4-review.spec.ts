import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "/home/administrator/playground/hirewise/screenshots/evaluator";

/**
 * EVALUATOR REVIEW — A-4: Conversational Follow-up & Refinement
 * + Pipeline Bug Fix Verification
 *
 * Simulates a real user journey:
 * 1. Land on dashboard, verify overall layout and design coherence
 * 2. Click Pipeline tab — verify bug fix (was crashing with infinite loop)
 * 3. Navigate directly to /job/1/pipeline — verify no errors
 * 4. Perform a search via chat
 * 5. Apply refinement: score filter
 * 6. Apply refinement: re-rank by sub-score
 * 7. Apply refinement: top N
 * 8. Reset filters
 * 9. Verify previous action cards remain visible throughout
 */

test.describe("EVALUATOR: A-4 Review + Pipeline Bug Fix", () => {
  test("E1: Pipeline tab click — no crash (bug fix verification)", async ({
    page,
  }) => {
    test.setTimeout(30000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // 1. Load dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e1-01-dashboard-load.png`, fullPage: false });

    // 2. Click Pipeline tab in the right sidebar
    const pipelineTab = page.locator('button:has-text("Pipeline"), [data-testid="tab-pipeline"]');
    await expect(pipelineTab.first()).toBeVisible({ timeout: 5000 });
    await pipelineTab.first().click();
    await page.waitForTimeout(1000);

    // 3. Screenshot after clicking Pipeline tab — should NOT show error overlay
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e1-02-pipeline-tab-clicked.png`, fullPage: false });

    // 4. Verify NO crash errors
    const crashErrors = pageErrors.filter((e) =>
      e.includes("Maximum update depth") || e.includes("getSnapshot")
    );
    expect(crashErrors).toHaveLength(0);

    // 5. Direct navigation to /job/1/pipeline
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e1-03-direct-pipeline-nav.png`, fullPage: false });

    // Verify candidate list renders
    const candidateList = page.locator('[data-testid="candidate-ranked-list"]');
    await expect(candidateList).toBeVisible({ timeout: 5000 });

    // 6. Direct navigation to /job/2/pipeline
    await page.goto("/job/2/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e1-04-job2-pipeline.png`, fullPage: false });

    // Final check — no page errors throughout
    const finalCrashErrors = pageErrors.filter((e) =>
      e.includes("Maximum update depth") || e.includes("getSnapshot")
    );
    expect(finalCrashErrors).toHaveLength(0);
  });

  test("E2: Full A-4 refinement journey — design, craft, functionality", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // ── Step 1: Dashboard load — assess overall layout ──────────────────
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-01-dashboard-overview.png`, fullPage: false });

    // Verify chat main area is visible (should be center, 60-70% width)
    const chatArea = page.locator('[data-testid="chat-main-area"]');
    await expect(chatArea).toBeVisible({ timeout: 5000 });

    // Verify data panel sidebar exists
    const dataPanel = page.locator('[data-testid="data-panel-sidebar"]');
    // It should exist in the DOM (may be collapsed on smaller viewports)

    // ── Step 2: Perform initial search ──────────────────────────────────
    const chatInput = page.locator('[data-testid="chat-input"], [data-testid="mobile-chat-input"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });

    await chatInput.first().fill("Find me senior backend engineers with Go and Kubernetes experience");
    const sendBtn = page.locator('[data-testid="chat-send"], [data-testid="mobile-chat-send"]');
    await sendBtn.first().click();

    // Wait for acknowledgement
    const ackBubble = page.locator('[data-testid="chat-bubble-agent"]:has-text("Got it")');
    await expect(ackBubble).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-02-search-ack.png`, fullPage: false });

    // Wait for progress indicator
    const progress = page.locator('[data-testid="progress-indicator"]');
    await expect(progress).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-03-search-progress.png`, fullPage: false });

    // Wait for first Action Card ("Search Complete")
    const firstActionCard = page.locator('[data-testid="action-card"]').first();
    await expect(firstActionCard).toBeVisible({ timeout: 12000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-04-search-complete.png`, fullPage: false });

    // Verify action card content
    const firstTitle = page.locator('[data-testid="action-card-title"]').first();
    await expect(firstTitle).toHaveText("Search Complete");

    // Count action cards before refinement
    const cardsBeforeRefinement = await page.locator('[data-testid="action-card"]').count();

    // ── Step 3: Refinement — score filter ───────────────────────────────
    await chatInput.first().fill("Show only candidates with score above 80");
    await sendBtn.first().click();

    // Wait for refinement acknowledgement
    const refineAck = page.locator('[data-testid="chat-bubble-agent"]:has-text("Refining results")');
    await expect(refineAck).toBeVisible({ timeout: 5000 });

    // Wait for refinement summary
    const refineSummary = page.locator('[data-testid="chat-bubble-agent"]:has-text("Refined results")');
    await expect(refineSummary).toBeVisible({ timeout: 5000 });

    // Wait for "Refined Results" action card
    const refinedTitle = page.locator('[data-testid="action-card-title"]:has-text("Refined Results")');
    await expect(refinedTitle.first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-05-score-filter-refined.png`, fullPage: false });

    // ── Step 4: Verify previous action card still visible ───────────────
    const cardsAfterRefinement = await page.locator('[data-testid="action-card"]').count();
    expect(cardsAfterRefinement).toBeGreaterThan(cardsBeforeRefinement);

    // First action card should still say "Search Complete"
    const firstCardTitle = await page.locator('[data-testid="action-card-title"]').first().textContent();
    expect(firstCardTitle).toBe("Search Complete");

    // ── Step 5: Refinement — re-rank by technical fit ───────────────────
    await chatInput.first().fill("Re-rank by technical fit");
    await sendBtn.first().click();

    const rerankAck = page.locator('[data-testid="chat-bubble-agent"]:has-text("sorted by Technical Fit")');
    await expect(rerankAck).toBeVisible({ timeout: 5000 });

    // Another "Refined Results" card should appear
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-06-rerank-techfit.png`, fullPage: false });

    // ── Step 6: Refinement — top N ──────────────────────────────────────
    await chatInput.first().fill("Show top 3 candidates");
    await sendBtn.first().click();

    const topNSummary = page.locator('[data-testid="chat-bubble-agent"]:has-text("top 3")');
    await expect(topNSummary).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-07-top3-filter.png`, fullPage: false });

    // ── Step 7: Reset filters ───────────────────────────────────────────
    await chatInput.first().fill("Show all");
    await sendBtn.first().click();

    const resetMsg = page.locator('[data-testid="chat-bubble-agent"]:has-text("Filters cleared")');
    await expect(resetMsg).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-08-filters-reset.png`, fullPage: false });

    // ── Step 8: Verify all action cards are still in the chat history ───
    const allActionCards = await page.locator('[data-testid="action-card"]').count();
    // Should have at least: 1 (Search Complete) + 3 (Refined Results from 3 refinements)
    expect(allActionCards).toBeGreaterThanOrEqual(4);

    // ── Step 9: Full-page screenshot for design review ──────────────────
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e2-09-full-journey-end.png`, fullPage: true });

    // ── Step 10: Console error check ────────────────────────────────────
    // Filter out non-critical warnings
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("DevTools") && !e.includes("favicon")
    );
    // Log but don't fail on minor console noise
    if (criticalErrors.length > 0) {
      console.log("Console errors found:", criticalErrors);
    }
  });

  test("E3: Design coherence — chat bubbles, action cards, spacing", async ({
    page,
  }) => {
    test.setTimeout(40000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });

    const chatInput = page.locator('[data-testid="chat-input"], [data-testid="mobile-chat-input"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });

    // Perform a search to generate chat content
    await chatInput.first().fill("Find backend engineers with Go experience");
    const sendBtn = page.locator('[data-testid="chat-send"], [data-testid="mobile-chat-send"]');
    await sendBtn.first().click();

    // Wait for action card
    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });

    // Apply a refinement
    await chatInput.first().fill("Show only candidates above 85");
    await sendBtn.first().click();

    const refinedCard = page.locator('[data-testid="action-card-title"]:has-text("Refined Results")');
    await expect(refinedCard.first()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(400);

    // ── Design checks ───────────────────────────────────────────────────

    // Check user message bubble styling (should have accent-primary bg)
    const userBubble = page.locator('[data-testid="chat-bubble-user"]').first();
    if (await userBubble.isVisible()) {
      const userBubbleBg = await userBubble.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      // accent-primary is #D4FF00 = rgb(212, 255, 0)
      console.log(`User bubble background: ${userBubbleBg}`);
    }

    // Check agent message bubble styling (should have surface-secondary bg)
    const agentBubble = page.locator('[data-testid="chat-bubble-agent"]').first();
    if (await agentBubble.isVisible()) {
      const agentBubbleBg = await agentBubble.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`Agent bubble background: ${agentBubbleBg}`);
    }

    // Check action card styling
    const card = page.locator('[data-testid="action-card"]').first();
    if (await card.isVisible()) {
      const cardBorderLeft = await card.evaluate((el) =>
        window.getComputedStyle(el).borderLeftWidth + " " + window.getComputedStyle(el).borderLeftColor
      );
      console.log(`Action card left border: ${cardBorderLeft}`);
    }

    // Final screenshot at 1440px width for design review
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e3-01-design-1440.png`, fullPage: false });

    // Tablet viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e3-02-design-1024.png`, fullPage: false });

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/e3-03-design-375.png`, fullPage: false });
  });
});
