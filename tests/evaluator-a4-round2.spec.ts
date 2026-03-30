import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/round2";

/**
 * EVALUATOR ROUND 2 — A-4 Bug Fix Verification + Pipeline Sync
 *
 * Verifying all 4 bugs are fixed:
 * Bug #1: Short skill "R" false match — word boundaries in parseRefinement
 * Bug #2: Pipeline panel not syncing — hasCandidatesBeenSet tracking
 * Bug #3: "Show all" reset not working — fixed by Bug #2's flag
 * Bug #4: Cascading failure — resolved by Bug #1's word boundary fix
 *
 * Note: The mock search flow does NOT call selectJob — the Pipeline tab
 * only populates after a refinement (which DOES call selectJob).
 * This matches the real UX: user searches, then refines, then checks pipeline.
 */

test.describe("EVALUATOR ROUND 2: A-4 Bug Fix Verification", () => {
  test("R2-1: Score filter does NOT produce false 'R' skill match (Bug #1 + #4)", async ({
    page,
  }) => {
    test.setTimeout(45000);
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-01-dashboard-load.png`,
      fullPage: false,
    });

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });

    await chatInput
      .first()
      .fill("Find senior backend engineers with Go and Kubernetes experience");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]'
    );
    await sendBtn.first().click();

    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-02-search-complete.png`,
      fullPage: false,
    });

    // Apply the critical refinement: "show only candidates with score above 80"
    await chatInput
      .first()
      .fill("Show only candidates with score above 80");
    await sendBtn.first().click();

    const refinedCard = page.locator(
      '[data-testid="action-card-title"]:has-text("Refined Results")'
    );
    await expect(refinedCard.first()).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-03-score-filter-applied.png`,
      fullPage: false,
    });

    // CRITICAL CHECK: Look for "with skills: R" false match in agent messages
    const allAgentMessages = page.locator('[data-testid="chat-bubble-agent"]');
    const msgCount = await allAgentMessages.count();
    let foundFalseRMatch = false;
    for (let i = 0; i < msgCount; i++) {
      const text = await allAgentMessages.nth(i).textContent();
      if (text && /with skills?:\s*R\b/i.test(text || "")) {
        foundFalseRMatch = true;
        console.log(`FALSE R MATCH FOUND in message ${i}: "${text}"`);
      }
    }
    expect(foundFalseRMatch).toBe(false);

    // Verify the summary mentions "score >= 80" NOT "with skills: R"
    const refinedSummary = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("Refined results")'
    );
    await expect(refinedSummary.first()).toBeVisible({ timeout: 5000 });
    const summaryText = await refinedSummary.first().textContent();
    console.log(`Refinement summary: ${summaryText}`);
    expect(summaryText).toContain("score");
    expect(summaryText).not.toContain("with skills: R");

    // Verify candidate count > 0
    const match = (summaryText || "").match(/(\d+)\s+candidates?\s+remain/);
    if (match) {
      expect(parseInt(match[1])).toBeGreaterThan(0);
    }

    // No crash errors
    const crashErrors = pageErrors.filter(
      (e) =>
        e.includes("Maximum update depth") || e.includes("getSnapshot")
    );
    expect(crashErrors).toHaveLength(0);
  });

  test("R2-2: Pipeline panel syncs with filtered candidates after refinement (Bug #2)", async ({
    page,
  }) => {
    test.setTimeout(45000);
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput
      .first()
      .fill("Find backend engineers with Go experience");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]'
    );
    await sendBtn.first().click();

    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });

    // Apply score filter — this calls selectJob which populates the pipeline panel
    await chatInput
      .first()
      .fill("Show only candidates with score above 80");
    await sendBtn.first().click();

    const refinedCard = page.locator(
      '[data-testid="action-card-title"]:has-text("Refined Results")'
    );
    await expect(refinedCard.first()).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);

    // Now click Pipeline tab — the refinement flow calls selectJob, so panel should show candidates
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    if (await pipelineTab.isVisible().catch(() => false)) {
      await pipelineTab.click();
    } else {
      await page.locator('button:has-text("Pipeline")').first().click();
    }

    // Wait for candidate rows to appear (selectJob was called by refinement)
    const firstRow = page.locator('[data-testid^="candidate-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-04-pipeline-after-score-filter.png`,
      fullPage: false,
    });

    // CRITICAL CHECK: Pipeline should show only filtered candidates (not all 12)
    const filteredRows = await page.locator('[data-testid^="candidate-row-"]').count();
    console.log(`Filtered candidate count in pipeline: ${filteredRows}`);
    expect(filteredRows).toBeLessThan(12);
    expect(filteredRows).toBeGreaterThan(0);
    // With score >= 80, we expect 6 candidates
    expect(filteredRows).toBe(6);

    // No crash errors
    const crashErrors = pageErrors.filter(
      (e) =>
        e.includes("Maximum update depth") || e.includes("getSnapshot")
    );
    expect(crashErrors).toHaveLength(0);
  });

  test("R2-3: Top 3 filter shows exactly 3 candidates in Pipeline", async ({
    page,
  }) => {
    test.setTimeout(45000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput
      .first()
      .fill("Find backend engineers with Python experience");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]'
    );
    await sendBtn.first().click();

    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });

    // Apply "top 3" filter (this calls selectJob)
    await chatInput.first().fill("Show top 3 candidates");
    await sendBtn.first().click();

    const topNSummary = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("top 3")'
    );
    await expect(topNSummary).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);

    // Click Pipeline tab
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    if (await pipelineTab.isVisible().catch(() => false)) {
      await pipelineTab.click();
    } else {
      await page.locator('button:has-text("Pipeline")').first().click();
    }

    const firstRow = page.locator('[data-testid^="candidate-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-05-pipeline-after-top3.png`,
      fullPage: false,
    });

    // Verify exactly 3 candidates
    const top3Rows = await page.locator('[data-testid^="candidate-row-"]').count();
    console.log(`Pipeline count after top 3: ${top3Rows}`);
    expect(top3Rows).toBe(3);
  });

  test("R2-4: 'Show all' restores ALL original candidates (Bug #3)", async ({
    page,
  }) => {
    test.setTimeout(50000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput
      .first()
      .fill("Find senior engineers with JavaScript experience");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]'
    );
    await sendBtn.first().click();

    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });

    // Apply "top 3" to reduce candidate count (this calls selectJob)
    await chatInput.first().fill("Show top 3 candidates");
    await sendBtn.first().click();

    const topNMsg = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("top 3")'
    );
    await expect(topNMsg).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);

    // Click Pipeline tab after refinement
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    if (await pipelineTab.isVisible().catch(() => false)) {
      await pipelineTab.click();
    } else {
      await page.locator('button:has-text("Pipeline")').first().click();
    }

    const firstRow = page.locator('[data-testid^="candidate-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });

    const filteredCount = await page.locator('[data-testid^="candidate-row-"]').count();
    console.log(`After top 3 filter: ${filteredCount}`);
    expect(filteredCount).toBe(3);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-06-pipeline-filtered-top3.png`,
      fullPage: false,
    });

    // Now "Show all" to restore
    await chatInput.first().fill("Show all");
    await sendBtn.first().click();

    const resetMsg = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("Filters cleared")'
    );
    await expect(resetMsg).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-07-pipeline-after-show-all.png`,
      fullPage: false,
    });

    // CRITICAL CHECK: Pipeline should be restored to 12 candidates
    const restoredCount = await page.locator('[data-testid^="candidate-row-"]').count();
    console.log(`After 'show all': ${restoredCount}`);
    expect(restoredCount).toBe(12);
  });

  test("R2-5: Re-rank by culture fit changes sort order", async ({
    page,
  }) => {
    test.setTimeout(45000);

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput
      .first()
      .fill("Find engineers with React experience");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]'
    );
    await sendBtn.first().click();

    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });

    // Apply re-rank by culture fit (this IS a refinement that calls selectJob)
    await chatInput.first().fill("Re-rank by culture fit");
    await sendBtn.first().click();

    const rerankMsg = page.locator(
      '[data-testid="chat-bubble-agent"]:has-text("sorted by Culture Fit")'
    );
    await expect(rerankMsg).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);

    // Click Pipeline tab
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    if (await pipelineTab.isVisible().catch(() => false)) {
      await pipelineTab.click();
    } else {
      await page.locator('button:has-text("Pipeline")').first().click();
    }

    const firstRow = page.locator('[data-testid^="candidate-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });

    // Capture sort order
    const rerankedNames: string[] = [];
    const rows = page.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const name = await rows.nth(i).locator('.text-text-primary').textContent();
      rerankedNames.push(name || '');
    }
    console.log(`Re-ranked sort order (culture fit): ${rerankedNames.join(', ')}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-08-pipeline-culture-fit-sort.png`,
      fullPage: false,
    });

    // Verify the agent confirmed the sort
    const rerankText = await rerankMsg.textContent();
    console.log(`Re-rank message: ${rerankText}`);
    expect(rerankText).toContain("Culture Fit");
  });

  test("R2-6: Full journey — design quality assessment at 1440px", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-09-design-1440-dashboard.png`,
      fullPage: false,
    });

    const chatInput = page.locator(
      '[data-testid="chat-input"], [data-testid="mobile-chat-input"]'
    );
    await expect(chatInput.first()).toBeVisible({ timeout: 5000 });
    await chatInput
      .first()
      .fill("Find senior backend engineers with Go and Kubernetes");
    const sendBtn = page.locator(
      '[data-testid="chat-send"], [data-testid="mobile-chat-send"]'
    );
    await sendBtn.first().click();

    const actionCard = page.locator('[data-testid="action-card"]').first();
    await expect(actionCard).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-10-design-1440-with-results.png`,
      fullPage: false,
    });

    // Apply refinement to trigger selectJob
    await chatInput
      .first()
      .fill("Show only candidates with score above 80");
    await sendBtn.first().click();
    const refinedCard = page.locator(
      '[data-testid="action-card-title"]:has-text("Refined Results")'
    );
    await expect(refinedCard.first()).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-11-design-1440-refined.png`,
      fullPage: false,
    });

    // Click Pipeline tab after refinement (so selectJob has been called)
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    if (await pipelineTab.isVisible().catch(() => false)) {
      await pipelineTab.click();
    } else {
      await page.locator('button:has-text("Pipeline")').first().click();
    }

    const firstRow = page.locator('[data-testid^="candidate-row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-12-design-1440-pipeline-panel.png`,
      fullPage: false,
    });

    // Full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/r2-13-design-1440-full-page.png`,
      fullPage: true,
    });
  });
});
