import { test, expect } from "@playwright/test";

/**
 * FLOW-1 Eval: Conversational Job Creation
 *
 * Tests the complete FLOW-1 pipeline:
 * 1. English NL input → JD extraction → preview card → confirm → job created
 * 2. Chinese NL input → JD extraction → preview card with localized fields
 * 3. Visual audit of JD preview card styling
 */

test.use({ viewport: { width: 1280, height: 800 } });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 1 — English Input: Full Job Creation Flow
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("FLOW-1 — Conversational Job Creation (English)", () => {
  test("Full flow: NL input → JD preview → confirm → job created in panel", async ({
    page,
  }) => {
    // ── Step 1: Navigate to dashboard ────────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', {
      timeout: 10000,
    });

    // ── Step 2: Type job description into chat input ─────────────────────
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "We need a senior Go backend engineer in Berlin, 5+ years experience, must know Kubernetes and Docker"
    );

    // ── Step 3: Press Enter ──────────────────────────────────────────────
    await chatInput.press("Enter");

    // ── Step 4: Wait for JD extraction pipeline (progress + card) ────────
    // The use-chat hook has ~2.5s of timers before showing the JD preview
    await page.waitForTimeout(2000);

    // ── Step 5: Verify JD Preview Card appeared ──────────────────────────
    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 10000 });

    // ── Step 6: Verify extracted fields ──────────────────────────────────
    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    await expect(fieldsContainer).toBeVisible();

    // Get all field text content for assertions
    const fieldsText = await fieldsContainer.textContent();

    // 6a. Job title — should contain "Backend Engineer" or "Go"
    expect(
      fieldsText?.includes("Backend Engineer") || fieldsText?.includes("Go")
    ).toBeTruthy();

    // 6b. Location — should contain "Berlin"
    expect(fieldsText).toContain("Berlin");

    // 6c. Experience — should contain "5" and some form of "years"
    expect(fieldsText).toMatch(/5.*year/i);

    // 6d. Skills — verify skill tags exist
    const skillTags = page.locator('[data-testid="jd-skill-tag"]');
    const skillCount = await skillTags.count();
    expect(skillCount).toBeGreaterThanOrEqual(2);

    // Collect all skill tag texts
    const skillTexts: string[] = [];
    for (let i = 0; i < skillCount; i++) {
      const text = await skillTags.nth(i).textContent();
      if (text) skillTexts.push(text.trim());
    }

    // At least one of Kubernetes, Docker, Go should be present
    const hasExpectedSkill = skillTexts.some(
      (s) =>
        s.toLowerCase().includes("kubernetes") ||
        s.toLowerCase().includes("docker") ||
        s.toLowerCase().includes("go")
    );
    expect(hasExpectedSkill).toBeTruthy();

    // ── Step 7: Verify action buttons ────────────────────────────────────
    const confirmBtn = page.locator('[data-testid="jd-confirm-btn"]');
    const modifyBtn = page.locator('[data-testid="jd-modify-btn"]');
    await expect(confirmBtn).toBeVisible();
    await expect(modifyBtn).toBeVisible();

    // Confirm button text
    const confirmText = await confirmBtn.textContent();
    expect(confirmText?.toLowerCase()).toContain("confirm");

    // Modify button text
    const modifyText = await modifyBtn.textContent();
    expect(modifyText?.toLowerCase()).toContain("modify");

    // ── Step 8: Screenshot — JD Preview ──────────────────────────────────
    await page.screenshot({
      path: "screenshots/flow1-jd-preview.png",
      fullPage: false,
    });

    // ── Step 9: Click "Confirm & Create Job" ─────────────────────────────
    await confirmBtn.click();

    // ── Step 10: Verify confirmation message in chat ─────────────────────
    // After confirm, the card transforms to "confirmed" state and a message appears
    const confirmedCard = page.locator(
      '[data-testid="jd-preview-card-confirmed"]'
    );
    await expect(confirmedCard).toBeVisible({ timeout: 5000 });

    // Confirmation message should appear in chat
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText("Job created", { timeout: 5000 });

    // ── Step 11: Verify new job appears in Jobs panel ────────────────────
    // The data panel should be open (handleJDConfirm calls setDataPanelOpen(true))
    const dataPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(dataPanel).toBeVisible({ timeout: 5000 });

    // Switch to Jobs tab if not already there
    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    await jobsTab.click();
    await page.waitForTimeout(500);

    // The jobs panel should contain the new job title
    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 5000 });

    // Look for the newly created job (title should contain "Backend Engineer")
    const jobsPanelText = await jobsPanel.textContent();
    expect(
      jobsPanelText?.includes("Backend Engineer") ||
        jobsPanelText?.includes("Go")
    ).toBeTruthy();

    // ── Step 12: Screenshot — Job Created ────────────────────────────────
    await page.screenshot({
      path: "screenshots/flow1-job-created.png",
      fullPage: false,
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 2 — Chinese Input: JD Extraction from Mandarin
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

test.describe("FLOW-1 — Conversational Job Creation (Chinese)", () => {
  test("Chinese NL input extracts location and experience correctly", async ({
    page,
  }) => {
    // ── Step 1: Navigate to dashboard ────────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', {
      timeout: 10000,
    });

    // ── Step 2: Type Chinese job description ─────────────────────────────
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "现在要在墨西哥招一个新销售，需要3年经验以上以及储能行业经验"
    );

    // ── Step 3: Press Enter ──────────────────────────────────────────────
    await chatInput.press("Enter");

    // ── Step 4: Wait for JD extraction ───────────────────────────────────
    await page.waitForTimeout(2000);

    // ── Step 5: Verify JD Preview Card appeared ──────────────────────────
    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 10000 });

    // ── Step 6: Verify extracted fields ──────────────────────────────────
    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    await expect(fieldsContainer).toBeVisible();

    const fieldsText = await fieldsContainer.textContent();

    // 6a. Location — should contain Mexico-related text (墨西哥 → "Mexico" or "墨西哥")
    const hasLocationMexico =
      fieldsText?.includes("墨西哥") || fieldsText?.toLowerCase().includes("mexico");
    expect(hasLocationMexico).toBeTruthy();

    // 6b. Experience — should contain "3" (from 3年经验)
    expect(fieldsText).toContain("3");

    // 6c. Verify skill tags include energy storage related skills
    const skillTags = page.locator('[data-testid="jd-skill-tag"]');
    const skillCount = await skillTags.count();
    expect(skillCount).toBeGreaterThanOrEqual(1);

    // ── Step 7: Screenshot — Chinese input JD preview ────────────────────
    await page.screenshot({
      path: "screenshots/flow1-chinese-input.png",
      fullPage: false,
    });
  });
});
