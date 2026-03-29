import { test, expect } from "@playwright/test";

/**
 * FLOW-2 Eval: Apollo.io External API Integration
 *
 * Tests the complete FLOW-2 pipeline:
 * 1. Create a job via FLOW-1 (NL input → JD preview → confirm)
 * 2. Agent asks "Want me to search for candidates?"
 * 3. User confirms "yes"
 * 4. Progress indicator appears with segmented bar
 * 5. Search completes (real API result or error fallback)
 * 6. Action Card appears with results
 *
 * NOTE: This test does NOT mock the Apollo API — it exercises the real
 * code path.  If APOLLO_API_KEY is missing or quota is exhausted the
 * route returns a 500 with an error message, and the chat shows an
 * error-fallback message.  Both paths (success + error) are accepted
 * by this test since the goal is to verify the UI flow, not the API.
 */

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("FLOW-2 — Apollo.io Candidate Search", () => {
  test("Full flow: create job → confirm search → progress bar → results or error", async ({
    page,
  }) => {
    // ── Step 1: Navigate to dashboard ──────────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', {
      timeout: 10000,
    });

    // ── Step 2: Create a job via FLOW-1 ────────────────────────────────────
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "Hire a frontend React developer in San Francisco"
    );
    await chatInput.press("Enter");

    // ── Step 3: Wait for JD Preview Card ───────────────────────────────────
    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    // Quick sanity — card should mention React or Frontend
    const fieldsText = await page
      .locator('[data-testid="jd-preview-fields"]')
      .textContent();
    expect(
      fieldsText?.includes("Frontend") || fieldsText?.includes("React")
    ).toBeTruthy();

    // ── Step 4: Confirm & Create the job ───────────────────────────────────
    const confirmBtn = page.locator('[data-testid="jd-confirm-btn"]');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Confirmed state card should appear
    const confirmedCard = page.locator(
      '[data-testid="jd-preview-card-confirmed"]'
    );
    await expect(confirmedCard).toBeVisible({ timeout: 5000 });

    // ── Step 5: Wait for agent to ask about candidate search ───────────────
    // After job creation, the agent sends a follow-up ~800ms later:
    // "Want me to start searching for candidates for this ... role?"
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText("search", {
      timeout: 8000,
      ignoreCase: true,
    });

    // ── Step 6: User confirms "yes" ────────────────────────────────────────
    await chatInput.fill("yes");
    await chatInput.press("Enter");

    // ── Step 7: Verify progress indicator appears ──────────────────────────
    const progressIndicator = page.locator(
      '[data-testid="progress-indicator"]'
    );
    await expect(progressIndicator).toBeVisible({ timeout: 10000 });

    // Verify the segmented progress bar exists inside
    const progressBar = page.locator('[data-testid="progress-bar"]');
    await expect(progressBar).toBeVisible({ timeout: 5000 });

    // Verify status text is displayed
    const statusText = page.locator('[data-testid="progress-status-text"]');
    await expect(statusText).toBeVisible({ timeout: 5000 });

    // ── Step 8: Wait for search to complete (success or error) ─────────────
    // The search flow will either:
    //   a) Succeed → show action card with "Search Complete"
    //   b) Fail → show error message with "error" text
    // We wait for EITHER outcome within 30 seconds.

    const actionCard = page.locator('[data-testid="action-card"]');
    const errorText = chatMessages.locator("text=/error/i");

    // Wait up to 30s for either action card or error message
    await expect(
      actionCard.or(errorText)
    ).toBeVisible({ timeout: 30000 });

    // Determine which outcome we got
    const actionCardVisible = await actionCard.isVisible();

    if (actionCardVisible) {
      // ── SUCCESS PATH: Validate Action Card structure ─────────────────
      const cardTitle = page.locator('[data-testid="action-card-title"]');
      await expect(cardTitle).toBeVisible();
      const titleText = await cardTitle.textContent();
      expect(titleText?.toLowerCase()).toContain("complete");

      const cardSummary = page.locator('[data-testid="action-card-summary"]');
      await expect(cardSummary).toBeVisible();

      const cardMetrics = page.locator('[data-testid="action-card-metrics"]');
      await expect(cardMetrics).toBeVisible();

      const ctaButton = page.locator('[data-testid="action-card-cta"]');
      await expect(ctaButton).toBeVisible();
      const ctaText = await ctaButton.textContent();
      expect(ctaText?.toLowerCase()).toContain("pipeline");
    } else {
      // ── ERROR PATH: Error message is acceptable ──────────────────────
      // Verify the error message is actually displayed in chat
      await expect(chatMessages).toContainText("error", {
        timeout: 5000,
        ignoreCase: true,
      });
    }

    // ── Step 9: Screenshot ─────────────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/flow2-search-triggered.png",
      fullPage: false,
    });
  });
});
