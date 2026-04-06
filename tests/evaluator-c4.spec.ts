import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/c4";

/**
 * Evaluator C-4: Inline candidate preview expansion
 *
 * Tests:
 * 1. Navigate to pipeline, click candidate row -> inline preview expands
 * 2. Preview shows score breakdown with dimension bars
 * 3. Preview shows all skills (not just top 3)
 * 4. Preview shows AI summary text
 * 5. Preview shows strengths and skill gaps
 * 6. Preview has "View Full Profile" button
 * 7. Click "View Full Profile" -> navigates to /job/:id/candidate/:cid
 * 8. Click same row again -> preview collapses (toggle behavior)
 * 9. Expand a different row -> first row collapses, second expands
 * 10. Design audit: Industrial Clarity styling validation
 *
 * All locators scoped to [data-testid="candidate-list-panel"] to avoid
 * strict-mode collisions with sidebar pipeline-panel duplicate testids.
 */
test.describe("Evaluator C-4: Inline candidate preview expansion", () => {
  test.setTimeout(60000);

  /** Helper: navigate to pipeline page and return the scoped main panel locator. */
  async function setup(page: import("@playwright/test").Page) {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    const panel = page.locator('[data-testid="candidate-list-panel"]');
    await expect(panel).toBeVisible({ timeout: 10000 });
    return panel;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Click candidate row -> inline preview panel expands below row
  // ──────────────────────────────────────────────────────────────────────────
  test("01 — clicking candidate row expands inline preview below", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Verify candidates are loaded
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-pipeline-before-expand.png`,
      fullPage: true,
    });

    // Click the first candidate row (c1-01 = Liam Chen, highest score)
    const firstRow = panel.locator('[data-testid="candidate-row-c1-01"]');
    await expect(firstRow).toBeVisible({ timeout: 5000 });
    await firstRow.click();

    // Verify inline preview panel appears
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Verify the row shows expanded state (aria-expanded=true)
    await expect(firstRow).toHaveAttribute("aria-expanded", "true");

    // Verify the expand indicator triangle is rotated (has rotate-90 class)
    const triangle = firstRow.locator("span.rotate-90");
    await expect(triangle).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-first-candidate-expanded.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Preview shows score breakdown with dimension bars
  // ──────────────────────────────────────────────────────────────────────────
  test("02 — preview shows score breakdown with dimension bars", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Expand first candidate
    await panel.locator('[data-testid="candidate-row-c1-01"]').click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Verify overall score is displayed
    const overallScore = preview.locator(
      '[data-testid="preview-overall-score-c1-01"]'
    );
    await expect(overallScore).toBeVisible();
    const scoreText = await overallScore.textContent();
    expect(parseInt(scoreText || "0")).toBeGreaterThan(0);

    // Verify dimension scores section exists (Technical Fit, Culture Fit, Experience)
    const dimensions = preview.locator(
      '[data-testid="preview-dimensions-c1-01"]'
    );
    await expect(dimensions).toBeVisible();

    // Should have at least 3 dimension bars (TechnicalFit, CultureFit, ExperienceDepth)
    const dimensionBars = dimensions.locator("> div");
    const barCount = await dimensionBars.count();
    expect(barCount).toBeGreaterThanOrEqual(3);

    // Take a close-up of the score breakdown area
    const previewBox = await preview.boundingBox();
    if (previewBox) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-score-breakdown-closeup.png`,
        clip: {
          x: previewBox.x,
          y: previewBox.y,
          width: Math.min(previewBox.width, 400),
          height: Math.min(previewBox.height, 300),
        },
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Preview shows all skills (more than the top 3 in the row)
  // ──────────────────────────────────────────────────────────────────────────
  test("03 — preview shows all candidate skills", async ({ page }) => {
    const panel = await setup(page);

    // Expand first candidate (c1-01 has 5 skills: Go, Kubernetes, gRPC, PostgreSQL, Distributed Systems)
    await panel.locator('[data-testid="candidate-row-c1-01"]').click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Verify skills section
    const skillsContainer = preview.locator(
      '[data-testid="preview-skills-c1-01"]'
    );
    await expect(skillsContainer).toBeVisible();

    // Should show more than the 3 top skills shown in the row
    const skillTags = skillsContainer.locator("span");
    const skillCount = await skillTags.count();
    expect(skillCount).toBeGreaterThanOrEqual(4); // At least 4 of the 5 skills

    // Verify specific skills are displayed
    const skillsText = await skillsContainer.textContent();
    expect(skillsText).toContain("Go");
    expect(skillsText).toContain("Kubernetes");
    expect(skillsText).toContain("gRPC");
    expect(skillsText).toContain("PostgreSQL");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-skills-section.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4: Preview shows AI evaluation summary
  // ──────────────────────────────────────────────────────────────────────────
  test("04 — preview shows AI evaluation summary text", async ({ page }) => {
    const panel = await setup(page);

    // Expand first candidate
    await panel.locator('[data-testid="candidate-row-c1-01"]').click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Verify AI summary exists and has content
    const summary = preview.locator(
      '[data-testid="preview-summary-c1-01"]'
    );
    await expect(summary).toBeVisible();
    const summaryText = await summary.textContent();
    expect(summaryText?.length).toBeGreaterThan(20); // Should be a meaningful summary

    // Verify strengths section exists
    const strengths = preview.locator(
      '[data-testid="preview-strengths-c1-01"]'
    );
    await expect(strengths).toBeVisible();
    const strengthItems = strengths.locator("> div");
    const strengthCount = await strengthItems.count();
    expect(strengthCount).toBeGreaterThanOrEqual(1);

    // Verify skill gaps section exists
    const gaps = preview.locator('[data-testid="preview-gaps-c1-01"]');
    await expect(gaps).toBeVisible();
    const gapItems = gaps.locator("> div");
    const gapCount = await gapItems.count();
    expect(gapCount).toBeGreaterThanOrEqual(1);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-ai-summary-strengths-gaps.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5: "View Full Profile" button is present
  // ──────────────────────────────────────────────────────────────────────────
  test("05 — View Full Profile button is present and styled", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Expand first candidate
    await panel.locator('[data-testid="candidate-row-c1-01"]').click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Verify "View Full Profile" button exists
    const profileBtn = preview.locator(
      '[data-testid="view-full-profile-c1-01"]'
    );
    await expect(profileBtn).toBeVisible();
    await expect(profileBtn).toContainText("View Full Profile");

    // Verify it's a link element (anchor tag)
    const tagName = await profileBtn.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("a");

    // Verify href points to the correct candidate profile page
    const href = await profileBtn.getAttribute("href");
    expect(href).toBe("/job/1/candidate/c1-01");

    // Take close-up of the button area
    const btnBox = await profileBtn.boundingBox();
    if (btnBox) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-view-full-profile-button.png`,
        clip: {
          x: Math.max(0, btnBox.x - 100),
          y: Math.max(0, btnBox.y - 20),
          width: btnBox.width + 200,
          height: btnBox.height + 40,
        },
      });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 6: Click "View Full Profile" -> navigates to /job/:id/candidate/:cid
  // ──────────────────────────────────────────────────────────────────────────
  test("06 — View Full Profile navigates to candidate profile page", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Expand first candidate
    await panel.locator('[data-testid="candidate-row-c1-01"]').click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Click "View Full Profile"
    const profileBtn = preview.locator(
      '[data-testid="view-full-profile-c1-01"]'
    );
    await profileBtn.click();

    // Wait for navigation
    await page.waitForURL("**/job/1/candidate/c1-01", { timeout: 10000 });

    // Verify we're on the candidate profile page
    expect(page.url()).toContain("/job/1/candidate/c1-01");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-navigated-to-profile.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 7: Toggle behavior — click same row collapses preview
  // ──────────────────────────────────────────────────────────────────────────
  test("07 — clicking same row again collapses the preview", async ({
    page,
  }) => {
    const panel = await setup(page);

    const firstRow = panel.locator('[data-testid="candidate-row-c1-01"]');

    // Expand
    await firstRow.click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });
    await expect(firstRow).toHaveAttribute("aria-expanded", "true");

    // Collapse (click same row again)
    await firstRow.click();
    await expect(preview).not.toBeVisible({ timeout: 5000 });
    await expect(firstRow).toHaveAttribute("aria-expanded", "false");

    // Triangle indicator should no longer be rotated
    const rotatedTriangle = firstRow.locator("span.rotate-90");
    await expect(rotatedTriangle).not.toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-collapsed-after-toggle.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 8: Expanding different row collapses the first
  // ──────────────────────────────────────────────────────────────────────────
  test("08 — expanding different candidate collapses the first", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Expand first candidate
    const firstRow = panel.locator('[data-testid="candidate-row-c1-01"]');
    await firstRow.click();
    const firstPreview = panel.locator(
      '[data-testid="candidate-preview-c1-01"]'
    );
    await expect(firstPreview).toBeVisible({ timeout: 5000 });

    // Now expand second candidate (c1-02)
    const secondRow = panel.locator('[data-testid="candidate-row-c1-02"]');
    await secondRow.click();
    const secondPreview = panel.locator(
      '[data-testid="candidate-preview-c1-02"]'
    );
    await expect(secondPreview).toBeVisible({ timeout: 5000 });

    // First preview should be collapsed
    await expect(firstPreview).not.toBeVisible();
    await expect(firstRow).toHaveAttribute("aria-expanded", "false");

    // Second row should be expanded
    await expect(secondRow).toHaveAttribute("aria-expanded", "true");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-second-candidate-expanded.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 9: Checkbox click does NOT trigger expand (independence check)
  // ──────────────────────────────────────────────────────────────────────────
  test("09 — checkbox click does not trigger inline preview expansion", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Click checkbox (not the row body)
    const checkbox = panel.locator('[data-testid="select-checkbox-c1-01"]');
    await checkbox.click();

    // Preview should NOT appear
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).not.toBeVisible({ timeout: 3000 });

    // But the candidate should be selected (checkbox interaction worked)
    const toolbar = panel.locator('[data-testid="bulk-action-toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 3000 });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-checkbox-no-expand.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 10: Expand another candidate and verify its data
  // ──────────────────────────────────────────────────────────────────────────
  test("10 — expanding a lower-scored candidate shows its own data", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Expand a mid-ranked candidate (c1-05 or similar)
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    // Pick the 5th candidate row
    const targetRow = rows.nth(4);
    await targetRow.click();

    // Get the candidate ID from the expanded preview
    const allPreviews = panel.locator('[data-testid^="candidate-preview-"]');
    await expect(allPreviews).toBeVisible({ timeout: 5000 });

    // Verify it has score breakdown, skills, and the profile button
    const previewTestId = await allPreviews.getAttribute("data-testid");
    const candidateId = previewTestId?.replace("candidate-preview-", "") || "";
    expect(candidateId).toBeTruthy();

    // Check score, skills, and profile link exist
    const score = allPreviews.locator(
      `[data-testid="preview-overall-score-${candidateId}"]`
    );
    await expect(score).toBeVisible();

    const skills = allPreviews.locator(
      `[data-testid="preview-skills-${candidateId}"]`
    );
    await expect(skills).toBeVisible();

    const profileLink = allPreviews.locator(
      `[data-testid="view-full-profile-${candidateId}"]`
    );
    await expect(profileLink).toBeVisible();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-lower-ranked-expanded.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Step 11: Design audit — Industrial Clarity styling
  // ──────────────────────────────────────────────────────────────────────────
  test("11 — design audit: Industrial Clarity styling on preview panel", async ({
    page,
  }) => {
    const panel = await setup(page);

    // Expand first candidate
    await panel.locator('[data-testid="candidate-row-c1-01"]').click();
    const preview = panel.locator('[data-testid="candidate-preview-c1-01"]');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // ── Preview background: surface-secondary (#1A1A1A), dark ──────────
    const previewBg = await preview.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const bgMatch = previewBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (bgMatch) {
      const [, r, g, b] = bgMatch.map(Number);
      // Should be dark (surface-secondary ~= #1A1A1A = rgb(26,26,26))
      expect(r).toBeLessThan(50);
      expect(g).toBeLessThan(50);
      expect(b).toBeLessThan(50);
    }

    // ── Left border: accent-secondary (#00D4AA), teal ──────────────────
    const borderLeft = await preview.evaluate((el) =>
      getComputedStyle(el).borderLeftColor
    );
    const borderMatch = borderLeft.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (borderMatch) {
      const [, r, g, b] = borderMatch.map(Number);
      // accent-secondary is teal: green channel should dominate
      expect(g).toBeGreaterThan(150);
      expect(g).toBeGreaterThan(r); // More green than red
    }

    // ── Left border width: 4px ─────────────────────────────────────────
    const borderLeftWidth = await preview.evaluate((el) =>
      getComputedStyle(el).borderLeftWidth
    );
    expect(borderLeftWidth).toBe("4px");

    // ── Score labels use monospace font ─────────────────────────────────
    const scoreLabel = preview.locator(
      'span:has-text("Score Breakdown")'
    );
    if (await scoreLabel.isVisible()) {
      const fontFamily = await scoreLabel.evaluate((el) =>
        getComputedStyle(el).fontFamily
      );
      expect(fontFamily.toLowerCase()).toMatch(/mono|jetbrains/);
    }

    // ── Dimension labels use 10px font, text-muted color ───────────────
    const dimensionLabels = preview.locator(
      '[data-testid="preview-dimensions-c1-01"] span'
    );
    const firstLabel = dimensionLabels.first();
    if (await firstLabel.isVisible()) {
      const labelFontSize = await firstLabel.evaluate((el) =>
        getComputedStyle(el).fontSize
      );
      expect(labelFontSize).toBe("10px");
    }

    // ── Score bars have NO border-radius (industrial flat ends) ────────
    const scoreBarFill = preview.locator(
      '[data-testid="preview-dimensions-c1-01"] div > div > div'
    ).first();
    if (await scoreBarFill.isVisible()) {
      const borderRadius = await scoreBarFill.evaluate((el) =>
        getComputedStyle(el).borderRadius
      );
      expect(borderRadius).toBe("0px");
    }

    // ── Skill tags: monospace, accent-primary colors ───────────────────
    const skillTag = preview
      .locator('[data-testid="preview-skills-c1-01"] span')
      .first();
    if (await skillTag.isVisible()) {
      const tagFont = await skillTag.evaluate((el) =>
        getComputedStyle(el).fontFamily
      );
      expect(tagFont.toLowerCase()).toMatch(/mono|jetbrains/);

      // Tag text should use accent-primary color (#D4FF00)
      const tagColor = await skillTag.evaluate((el) =>
        getComputedStyle(el).color
      );
      const tagColorMatch = tagColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (tagColorMatch) {
        const [, r, g] = tagColorMatch.map(Number);
        // D4FF00 = rgb(212,255,0) — high green, high red, zero blue
        expect(g).toBeGreaterThan(200);
        expect(r).toBeGreaterThan(150);
      }
    }

    // ── "View Full Profile" button: accent-primary bg, dark text ───────
    const profileBtn = preview.locator(
      '[data-testid="view-full-profile-c1-01"]'
    );
    const btnBg = await profileBtn.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const btnBgMatch = btnBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (btnBgMatch) {
      const [, r, g, b] = btnBgMatch.map(Number);
      // accent-primary #D4FF00 = rgb(212,255,0)
      expect(g).toBeGreaterThan(200);
      expect(b).toBeLessThan(50);
    }
    const btnColor = await profileBtn.evaluate((el) =>
      getComputedStyle(el).color
    );
    const btnColorMatch = btnColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (btnColorMatch) {
      const [, r, g, b] = btnColorMatch.map(Number);
      // Text should be dark (surface-primary #0D0D0D)
      expect(r).toBeLessThan(50);
      expect(g).toBeLessThan(50);
      expect(b).toBeLessThan(50);
    }

    // ── Button font: monospace ─────────────────────────────────────────
    const btnFont = await profileBtn.evaluate((el) =>
      getComputedStyle(el).fontFamily
    );
    expect(btnFont.toLowerCase()).toMatch(/mono|jetbrains/);

    // ── No border-radius on preview panel (max 4px per spec) ──────────
    const previewBorderRadius = await preview.evaluate((el) =>
      getComputedStyle(el).borderRadius
    );
    const radiusValue = parseInt(previewBorderRadius);
    expect(radiusValue).toBeLessThanOrEqual(4);

    // ── Expanded row styling: surface-tertiary highlight ────────────────
    const expandedRow = panel.locator('[data-testid="candidate-row-c1-01"]');
    const rowBg = await expandedRow.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    // Should be different from transparent (has tertiary tint)
    expect(rowBg).not.toBe("rgba(0, 0, 0, 0)");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-design-audit-full.png`,
      fullPage: true,
    });

    // Close-up of the inline preview panel
    const previewBox = await preview.boundingBox();
    if (previewBox) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/13-preview-panel-closeup.png`,
        clip: {
          x: previewBox.x,
          y: previewBox.y,
          width: previewBox.width,
          height: previewBox.height,
        },
      });
    }
  });
});
