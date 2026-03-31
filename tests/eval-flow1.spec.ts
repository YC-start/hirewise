import { test, expect } from "@playwright/test";

/**
 * FLOW-1 Evaluator Round 2: Conversational Job Creation
 *
 * Re-evaluation after Generator fixes for:
 *   BUG-1: Edit reverts after "Done Editing" — now uses confirmedData state
 *   BUG-2: Location "Berlin with" greedy match — negative lookahead added
 *   BUG-3: "Go engineer" not in ROLE_KEYWORDS — added go/golang variants
 *   Minor: JD PREVIEW title color — inline style var(--accent-primary)
 *
 * Desktop viewport: 1280x800
 */

test.use({ viewport: { width: 1280, height: 800 } });

const SCREENSHOT_DIR = "screenshots/evaluator/flow1/r2";

test.describe("FLOW-1 Round 2 — Conversational Job Creation (Bug Fix Verification)", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // CORE FLOW: Steps 1-9 with BUG-1 fix verification
  // ══════════════════════════════════════════════════════════════════════════
  test("Steps 1-9: full flow with edit persistence via Done Editing (BUG-1 fix)", async ({
    page,
  }) => {
    // ── Navigate to dashboard ──────────────────────────────────────────────
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', {
      timeout: 10000,
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-initial.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 1: Type a natural-language hiring request in the chat
    // Using the EXACT phrase from features.json
    // ════════════════════════════════════════════════════════════════════════
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    const hiringRequest =
      "I need to hire a senior Go engineer in Berlin with 5 years experience";
    await chatInput.fill(hiringRequest);
    await chatInput.press("Enter");

    // ════════════════════════════════════════════════════════════════════════
    // STEP 2: Verify Agent acknowledges and shows progress indicator
    // ════════════════════════════════════════════════════════════════════════
    const chatMessages = page.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).toContainText(hiringRequest, { timeout: 5000 });

    // Agent acknowledgement
    await expect(chatMessages).toContainText("extract", {
      timeout: 5000,
    });

    await page.waitForTimeout(1500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-agent-ack-progress.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 3: Verify JD Preview Action Card with extracted fields
    // ════════════════════════════════════════════════════════════════════════
    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    await expect(fieldsContainer).toBeVisible();
    const fieldsText = await fieldsContainer.textContent();

    console.log(`[FLOW-1 R2] Extracted fields text: ${fieldsText}`);

    // ── BUG-2 regression: Location must be "Berlin", NOT "Berlin with" ──
    expect(fieldsText).toContain("Berlin");
    expect(fieldsText).not.toContain("Berlin with");
    expect(fieldsText).not.toContain("Berlin With");

    // ── BUG-3 regression: Title should contain "Go Engineer", NOT "New Position" ──
    const titleContainsGoEngineer =
      fieldsText?.includes("Go Engineer") || fieldsText?.includes("Go Developer");
    expect(titleContainsGoEngineer).toBeTruthy();
    expect(fieldsText).not.toContain("New Position");

    // Seniority
    expect(fieldsText).toContain("Senior");

    // Experience
    expect(fieldsText).toMatch(/5.*year/i);

    // Skills
    const skillTags = page.locator('[data-testid="jd-skill-tag"]');
    const skillCount = await skillTags.count();
    expect(skillCount).toBeGreaterThanOrEqual(1);

    const skillTexts: string[] = [];
    for (let i = 0; i < skillCount; i++) {
      const text = await skillTags.nth(i).textContent();
      if (text) skillTexts.push(text.trim());
    }
    console.log(`[FLOW-1 R2] Skills: ${JSON.stringify(skillTexts)}`);
    expect(skillTexts.some((s) => s.includes("Go"))).toBeTruthy();

    // Description
    const descriptionEl = page.locator('[data-testid="jd-preview-description"]');
    await expect(descriptionEl).toBeVisible();
    const descText = await descriptionEl.textContent();
    expect(descText?.length).toBeGreaterThan(50);

    // Action buttons
    const confirmBtn = page.locator('[data-testid="jd-confirm-btn"]');
    const modifyBtn = page.locator('[data-testid="jd-modify-btn"]');
    await expect(confirmBtn).toBeVisible();
    await expect(modifyBtn).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-jd-preview-card.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 4: Verify JD Preview fields are editable inline
    // ════════════════════════════════════════════════════════════════════════
    await modifyBtn.click();

    const titleEditInput = page.locator('[data-testid="jd-edit-position"]');
    await expect(titleEditInput).toBeVisible({ timeout: 3000 });

    const locationEditInput = page.locator('[data-testid="jd-edit-location"]');
    await expect(locationEditInput).toBeVisible();

    const experienceEditInput = page.locator('[data-testid="jd-edit-experience"]');
    await expect(experienceEditInput).toBeVisible();

    const seniorityEditInput = page.locator('[data-testid="jd-edit-seniority"]');
    await expect(seniorityEditInput).toBeVisible();

    const skillsEditInput = page.locator('[data-testid="jd-edit-skills"]');
    await expect(skillsEditInput).toBeVisible();

    const descriptionEditInput = page.locator('[data-testid="jd-edit-description"]');
    await expect(descriptionEditInput).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-edit-mode-active.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 5: Modify the title field → click "Done Editing" → verify persistence
    //         THIS IS THE CRITICAL BUG-1 FIX VERIFICATION
    // ════════════════════════════════════════════════════════════════════════
    await titleEditInput.clear();
    await titleEditInput.fill("Lead Go Platform Engineer");
    await expect(titleEditInput).toHaveValue("Lead Go Platform Engineer");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-title-modified-in-edit.png`,
      fullPage: false,
    });

    // Click "Done Editing" — in the old code this reverted changes
    const doneEditingBtn = page.locator('[data-testid="jd-modify-btn"]');
    const doneEditingText = await doneEditingBtn.textContent();
    expect(doneEditingText?.toLowerCase()).toContain("done");
    await doneEditingBtn.click();

    // Wait for state update
    await page.waitForTimeout(500);

    // ── CRITICAL ASSERTION: edited title must persist in read-only view ──
    const fieldsAfterEdit = page.locator('[data-testid="jd-preview-fields"]');
    const fieldsTextAfterEdit = await fieldsAfterEdit.textContent();
    console.log(`[BUG-1 FIX] Fields after Done Editing: ${fieldsTextAfterEdit}`);

    const editPersisted = fieldsTextAfterEdit?.includes("Lead Go Platform Engineer");
    console.log(`[BUG-1 FIX] Edit persisted after Done Editing: ${editPersisted}`);

    // This was the critical bug — edits MUST persist now
    expect(editPersisted).toBe(true);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-edit-persisted-after-done.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 6: Click 'Confirm & Create Job'
    // After "Done Editing", button should say "Confirm & Create Job"
    // ════════════════════════════════════════════════════════════════════════
    const confirmBtnAfterEdit = page.locator('[data-testid="jd-confirm-btn"]');
    const confirmText = await confirmBtnAfterEdit.textContent();
    expect(confirmText?.toLowerCase()).toContain("confirm");
    await confirmBtnAfterEdit.click();

    // ════════════════════════════════════════════════════════════════════════
    // STEP 7: Verify job appears in Jobs panel with status 'Draft'
    // ════════════════════════════════════════════════════════════════════════
    const confirmedCard = page.locator('[data-testid="jd-preview-card-confirmed"]');
    await expect(confirmedCard).toBeVisible({ timeout: 5000 });

    // Confirmed card should show the EDITED title
    const confirmedCardText = await confirmedCard.textContent();
    expect(confirmedCardText?.toLowerCase()).toContain("job created");
    console.log(`[FLOW-1 R2] Confirmed card text: ${confirmedCardText}`);

    // Verify edited title appears in confirmed card
    expect(
      confirmedCardText?.includes("Lead Go Platform Engineer") ||
        confirmedCardText?.includes("Platform Engineer"),
    ).toBeTruthy();

    // Data panel should be open
    const dataPanel = page.locator('[data-testid="data-panel-expanded"]');
    await expect(dataPanel).toBeVisible({ timeout: 5000 });

    // Switch to Jobs tab
    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    if (await jobsTab.isVisible()) {
      await jobsTab.click();
      await page.waitForTimeout(500);
    }

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 5000 });

    const jobsPanelText = await jobsPanel.textContent();
    console.log(`[FLOW-1 R2] Jobs panel text: ${jobsPanelText}`);

    // The edited title should appear in the jobs panel
    expect(
      jobsPanelText?.includes("Lead Go Platform Engineer") ||
        jobsPanelText?.includes("Platform Engineer"),
    ).toBeTruthy();

    // Verify Draft status
    expect(jobsPanelText?.toLowerCase()).toContain("draft");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-job-in-panel-draft.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 8: Verify confirmation message in chat with link
    // ════════════════════════════════════════════════════════════════════════
    await expect(chatMessages).toContainText("Job created", { timeout: 5000 });
    await expect(chatMessages).toContainText("Draft", { timeout: 3000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-confirmation-message.png`,
      fullPage: false,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 9: Verify no modal or form was used at any point
    // ════════════════════════════════════════════════════════════════════════
    const modals = page.locator(
      '[role="dialog"], [data-testid*="modal"], .modal, .dialog, [aria-modal="true"]',
    );
    expect(await modals.count()).toBe(0);

    const quickCreateModal = page.locator(
      '[data-testid="quick-create-modal"], [data-testid="create-job-modal"]',
    );
    expect(await quickCreateModal.count()).toBe(0);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BUG-1 DEDICATED VERIFICATION: Edit + Done Editing + re-enter edit
  // ══════════════════════════════════════════════════════════════════════════
  test("BUG-1 fix: edits persist through Done Editing and survive re-edit", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', { timeout: 10000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "Hire a senior Go backend engineer in Berlin, 5+ years, Kubernetes and Docker required",
    );
    await chatInput.press("Enter");

    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    // Enter edit mode
    const modifyBtn = page.locator('[data-testid="jd-modify-btn"]');
    await modifyBtn.click();

    const titleEditInput = page.locator('[data-testid="jd-edit-position"]');
    await expect(titleEditInput).toBeVisible({ timeout: 3000 });

    // Modify title
    await titleEditInput.clear();
    await titleEditInput.fill("Lead Go Platform Engineer");
    await expect(titleEditInput).toHaveValue("Lead Go Platform Engineer");

    // Click "Done Editing"
    const doneBtn = page.locator('[data-testid="jd-modify-btn"]');
    await doneBtn.click();
    await page.waitForTimeout(500);

    // VERIFY: Edit persists in read-only view
    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    const fieldsTextAfter = await fieldsContainer.textContent();
    console.log(`[BUG-1 DEDICATED] After Done Editing: ${fieldsTextAfter}`);

    expect(fieldsTextAfter).toContain("Lead Go Platform Engineer");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-bug1-edit-persists.png`,
      fullPage: false,
    });

    // BONUS: Re-enter edit mode — verify the edited value is still there
    const modifyBtnAgain = page.locator('[data-testid="jd-modify-btn"]');
    await modifyBtnAgain.click();

    const titleEditInputAgain = page.locator('[data-testid="jd-edit-position"]');
    await expect(titleEditInputAgain).toBeVisible({ timeout: 3000 });
    await expect(titleEditInputAgain).toHaveValue("Lead Go Platform Engineer");

    // Modify title AGAIN
    await titleEditInputAgain.clear();
    await titleEditInputAgain.fill("Principal Go Architect");

    // Done editing again
    const doneBtnAgain = page.locator('[data-testid="jd-modify-btn"]');
    await doneBtnAgain.click();
    await page.waitForTimeout(500);

    // Verify second edit also persists
    const fieldsText2 = await fieldsContainer.textContent();
    expect(fieldsText2).toContain("Principal Go Architect");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-bug1-second-edit-persists.png`,
      fullPage: false,
    });

    // Now confirm with the doubly-edited title
    const confirmBtn = page.locator('[data-testid="jd-confirm-btn"]');
    await confirmBtn.click();

    const confirmedCard = page.locator('[data-testid="jd-preview-card-confirmed"]');
    await expect(confirmedCard).toBeVisible({ timeout: 5000 });
    const confirmedText = await confirmedCard.textContent();
    expect(confirmedText).toContain("Principal Go Architect");

    console.log(`[BUG-1 DEDICATED] Confirmed card with double-edited title: ${confirmedText}`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BUG-2 REGRESSION: Location extraction — "Berlin" not "Berlin with"
  // ══════════════════════════════════════════════════════════════════════════
  test("BUG-2 fix: location extracts 'Berlin' not 'Berlin with'", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', { timeout: 10000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // The EXACT features.json phrase that triggered the bug
    await chatInput.fill(
      "I need to hire a senior Go engineer in Berlin with 5 years experience",
    );
    await chatInput.press("Enter");

    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    const fieldsText = await fieldsContainer.textContent();
    console.log(`[BUG-2] Extracted fields: ${fieldsText}`);

    // Location must be exactly "Berlin", not "Berlin with" or "Berlin With"
    expect(fieldsText).toContain("Berlin");
    expect(fieldsText).not.toContain("Berlin with");
    expect(fieldsText).not.toContain("Berlin With");

    // Also verify the title extraction (BUG-3 regression)
    expect(fieldsText).not.toContain("New Position");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-bug2-berlin-location.png`,
      fullPage: false,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // BUG-3 REGRESSION: "Go engineer" in ROLE_KEYWORDS
  // ══════════════════════════════════════════════════════════════════════════
  test("BUG-3 fix: 'Go engineer' recognized as title, not 'New Position'", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', { timeout: 10000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "I need to hire a senior Go engineer in Berlin with 5 years experience",
    );
    await chatInput.press("Enter");

    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    const fieldsText = await fieldsContainer.textContent();
    console.log(`[BUG-3] Title extraction: ${fieldsText}`);

    // Must NOT contain "New Position" — should be "Go Engineer" or "Senior Go Engineer"
    expect(fieldsText).not.toContain("New Position");
    const hasGoTitle =
      fieldsText?.includes("Go Engineer") || fieldsText?.includes("Go Developer");
    expect(hasGoTitle).toBeTruthy();

    // Also check seniority
    expect(fieldsText).toContain("Senior");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-bug3-go-engineer-title.png`,
      fullPage: false,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 10: Repeatability — create two jobs via chat
  // ══════════════════════════════════════════════════════════════════════════
  test("Step 10: flow is repeatable — create a second job via chat", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', { timeout: 10000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // First job
    await chatInput.fill(
      "We need to hire a product designer in San Francisco with 3 years experience",
    );
    await chatInput.press("Enter");

    const jdCard1 = page.locator('[data-testid="jd-preview-card"]').first();
    await expect(jdCard1).toBeVisible({ timeout: 15000 });

    const confirmBtn1 = page.locator('[data-testid="jd-confirm-btn"]');
    await expect(confirmBtn1).toBeVisible({ timeout: 5000 });
    await confirmBtn1.click();

    const confirmedCard1 = page.locator('[data-testid="jd-preview-card-confirmed"]').first();
    await expect(confirmedCard1).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-first-job-created.png`,
      fullPage: false,
    });

    await page.waitForTimeout(1500);

    // Second job
    await chatInput.fill(
      "I need to hire a senior data scientist in Tokyo with 7 years machine learning experience",
    );
    await chatInput.press("Enter");

    const allJdCards = page.locator('[data-testid="jd-preview-card"]');
    await expect(allJdCards).toHaveCount(1, { timeout: 15000 });

    const jdCard2 = allJdCards.first();
    await expect(jdCard2).toBeVisible({ timeout: 15000 });

    const fieldsContainer2 = page.locator('[data-testid="jd-preview-fields"]');
    const fields2Text = await fieldsContainer2.textContent();
    expect(
      fields2Text?.includes("Tokyo") || fields2Text?.includes("Data"),
    ).toBeTruthy();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-second-jd-preview.png`,
      fullPage: false,
    });

    const confirmBtn2 = page.locator('[data-testid="jd-confirm-btn"]');
    await confirmBtn2.click();

    const confirmedCards = page.locator('[data-testid="jd-preview-card-confirmed"]');
    await expect(confirmedCards).toHaveCount(2, { timeout: 5000 });

    await page.waitForTimeout(500);
    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    if (await jobsTab.isVisible()) {
      await jobsTab.click();
      await page.waitForTimeout(500);
    }

    const jobsPanel = page.locator('[data-testid="jobs-panel"]');
    await expect(jobsPanel).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-two-jobs-created.png`,
      fullPage: false,
    });

    // No modals
    const modals = page.locator(
      '[role="dialog"], [data-testid*="modal"], .modal, .dialog, [aria-modal="true"]',
    );
    expect(await modals.count()).toBe(0);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // DESIGN AUDIT: Visual spec compliance + title color fix
  // ══════════════════════════════════════════════════════════════════════════
  test("Design audit: JD Preview Card visual spec + title color fix", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', { timeout: 10000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "Hire a senior Go backend engineer in Berlin, 5+ years, Kubernetes and Docker required",
    );
    await chatInput.press("Enter");

    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    // 1. Left border — 4px solid #D4FF00
    const cardStyles = await jdCard.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        borderLeftWidth: cs.borderLeftWidth,
        borderLeftStyle: cs.borderLeftStyle,
        borderLeftColor: cs.borderLeftColor,
        background: cs.backgroundColor,
        borderRadius: cs.borderRadius,
      };
    });
    expect(cardStyles.borderLeftWidth).toBe("4px");
    expect(cardStyles.borderLeftStyle).toBe("solid");
    expect(cardStyles.borderLeftColor).toMatch(/rgb\(212,\s*255,\s*0\)/);

    // 2. Background — surface-tertiary (#262626)
    expect(cardStyles.background).toMatch(/rgb\(38,\s*38,\s*38\)/);

    // 3. Border radius — 0
    expect(cardStyles.borderRadius).toBe("0px");

    // 4. Title — uppercase and #D4FF00 color (BUG FIX: was wrong color before)
    const titleEl = page.locator('[data-testid="jd-preview-title"]');
    const titleStyles = await titleEl.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        textTransform: cs.textTransform,
        color: cs.color,
        fontFamily: cs.fontFamily,
      };
    });
    expect(titleStyles.textTransform).toBe("uppercase");
    // CRITICAL: Title must be #D4FF00 (accent-primary)
    expect(titleStyles.color).toMatch(/rgb\(212,\s*255,\s*0\)/);
    console.log(`[DESIGN AUDIT] JD Preview title color: ${titleStyles.color} — PASS (accent-primary)`);

    // 5. Skill tags — accent-primary border, monospace
    const skillTag = page.locator('[data-testid="jd-skill-tag"]').first();
    const skillStyles = await skillTag.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        borderColor: cs.borderColor,
        fontFamily: cs.fontFamily,
        color: cs.color,
      };
    });
    expect(skillStyles.borderColor).toMatch(/rgb\(212,\s*255,\s*0\)/);
    expect(skillStyles.color).toMatch(/rgb\(212,\s*255,\s*0\)/);
    expect(skillStyles.fontFamily.toLowerCase()).toMatch(/mono|jetbrains/);

    // 6. Confirm button — accent-primary bg, pill shape
    const confirmBtn = page.locator('[data-testid="jd-confirm-btn"]');
    const confirmStyles = await confirmBtn.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        textTransform: cs.textTransform,
      };
    });
    expect(confirmStyles.backgroundColor).toMatch(/rgb\(212,\s*255,\s*0\)/);
    expect(parseFloat(confirmStyles.borderRadius)).toBeGreaterThan(10);
    expect(confirmStyles.textTransform).toBe("uppercase");

    // 7. Modify button — ghost style
    const modifyBtn = page.locator('[data-testid="jd-modify-btn"]');
    const modifyStyles = await modifyBtn.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        textTransform: cs.textTransform,
      };
    });
    expect(modifyStyles.backgroundColor).toMatch(
      /rgba?\(0,\s*0,\s*0,\s*0\)|transparent/,
    );
    expect(modifyStyles.textTransform).toBe("uppercase");

    // 8. Field labels — monospace, uppercase, 11px
    const fieldLabels = page
      .locator('[data-testid="jd-preview-fields"] span')
      .filter({ hasText: /^(POSITION|DEPARTMENT|LOCATION|EXPERIENCE|SENIORITY|SKILLS|DESCRIPTION)$/i });
    if ((await fieldLabels.count()) > 0) {
      const labelStyles = await fieldLabels.first().evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontFamily: cs.fontFamily,
          textTransform: cs.textTransform,
          fontSize: cs.fontSize,
        };
      });
      expect(labelStyles.fontFamily.toLowerCase()).toMatch(/mono|jetbrains/);
      expect(labelStyles.textTransform).toBe("uppercase");
      expect(parseFloat(labelStyles.fontSize)).toBeLessThanOrEqual(12);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-design-audit.png`,
      fullPage: false,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CHINESE INPUT
  // ══════════════════════════════════════════════════════════════════════════
  test("Chinese NL input: JD extraction from Mandarin", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForSelector('[data-testid="chat-main-area"]', { timeout: 10000 });

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
    await chatInput.fill(
      "现在要在墨西哥招一个新销售，需要3年经验以上以及储能行业经验",
    );
    await chatInput.press("Enter");

    const jdCard = page.locator('[data-testid="jd-preview-card"]');
    await expect(jdCard).toBeVisible({ timeout: 15000 });

    const fieldsContainer = page.locator('[data-testid="jd-preview-fields"]');
    const fieldsText = await fieldsContainer.textContent();

    const hasLocationMexico =
      fieldsText?.includes("墨西哥") ||
      fieldsText?.toLowerCase().includes("mexico");
    expect(hasLocationMexico).toBeTruthy();
    expect(fieldsText).toContain("3");

    const skillTags = page.locator('[data-testid="jd-skill-tag"]');
    expect(await skillTags.count()).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/17-chinese-input.png`,
      fullPage: false,
    });
  });
});
