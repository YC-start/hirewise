import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/evaluator-c2-r2";

/**
 * Evaluator C-2 Round 2: Ranked candidate list with scores
 *
 * Critical fix verified: font-weight on score numbers MUST be 700 now
 * (was 400 in R1). Generator replaced font-700 → font-bold and
 * font-500 → font-medium across 9 files, plus CSS utility fallbacks.
 *
 * Checks:
 * 1. Candidates listed in descending score order
 * 2. Each row: candidate name visible
 * 3. Each row: AI match score as large numeric with font-weight 700 (Space Grotesk bold)
 * 4. Horizontal score bar with correct colors (#D4FF00 80-100, #FFB800 50-79, #FF4444 0-49), flat ends
 * 5. Up to 3 skill tags per candidate (monospace font)
 * 6. Row height 40-44px, alternating surface-tertiary tint
 * 7. Table headers: uppercase 11px, letter-spacing 0.08em
 */

test.describe("Evaluator C-2 Round 2: Ranked candidate list with scores", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  /** Scoped locator for the main candidate list panel (not sidebar). */
  function mainPanel(page: import("@playwright/test").Page) {
    return page.locator('[data-testid="candidate-list-panel"]');
  }

  test("candidates listed in descending score order", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-pipeline-overview.png`,
      fullPage: false,
    });

    const panel = mainPanel(page);
    await expect(panel).toBeVisible({ timeout: 10000 });

    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    console.log(`Total candidate rows in main panel: ${rowCount}`);
    expect(rowCount).toBeGreaterThanOrEqual(5);

    // Extract scores from each row and verify descending order
    const scores: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const scoreEl = row.locator(".font-heading");
      const scoreText = await scoreEl.textContent();
      const score = parseInt(scoreText?.trim() || "0", 10);
      scores.push(score);
    }

    console.log(`Scores in display order: ${scores.join(", ")}`);

    // Verify strictly descending (or equal)
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }

    console.log("PASS: Candidates are sorted in descending score order");
  });

  test("each row shows candidate name", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const panel = mainPanel(page);
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const nameEl = row.locator(".text-text-primary");
      await expect(nameEl).toBeVisible();
      const name = await nameEl.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);
      console.log(`Row ${i + 1}: ${name?.trim()}`);
    }

    console.log("PASS: All candidate rows display a visible name");
  });

  test("CRITICAL R2: AI match score font-weight MUST be 700 (Space Grotesk bold)", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const panel = mainPanel(page);
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    const checkCount = Math.min(rowCount, 5);
    for (let i = 0; i < checkCount; i++) {
      const row = rows.nth(i);
      const scoreEl = row.locator(".font-heading");
      await expect(scoreEl).toBeVisible();

      const styles = await scoreEl.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontFamily: cs.fontFamily,
          fontWeight: cs.fontWeight,
          fontSize: cs.fontSize,
        };
      });

      console.log(
        `Row ${i + 1} score styles: family="${styles.fontFamily}", weight=${styles.fontWeight}, size=${styles.fontSize}`
      );

      // Font must include Space Grotesk
      expect(styles.fontFamily.toLowerCase()).toContain("space grotesk");

      // CRITICAL R2 CHECK: Weight MUST be 700 (was 400 in R1)
      expect(styles.fontWeight).toBe("700");

      // Font size should be >= 16px (text-lg = 18px typically)
      const sizeNum = parseFloat(styles.fontSize);
      expect(sizeNum).toBeGreaterThanOrEqual(16);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-score-typography.png`,
      fullPage: false,
    });

    console.log(
      "PASS: Score numbers use Space Grotesk bold (font-weight: 700) — R2 fix confirmed"
    );
  });

  test("score bar: correct colors per range and flat ends (no border-radius)", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const panel = mainPanel(page);
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();

    // Expected color mapping:
    //   80-100: #D4FF00 -> rgb(212, 255, 0)
    //   50-79:  #FFB800 -> rgb(255, 184, 0)
    //   0-49:   #FF4444 -> rgb(255, 68, 68)
    const COLOR_HIGH = "rgb(212, 255, 0)";
    const COLOR_MID = "rgb(255, 184, 0)";
    const COLOR_LOW = "rgb(255, 68, 68)";

    let highChecked = false;
    let midChecked = false;
    let lowChecked = false;

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);

      // Get the score value
      const scoreEl = row.locator(".font-heading");
      const scoreText = await scoreEl.textContent();
      const score = parseInt(scoreText?.trim() || "0", 10);

      // Get the score bar element
      const scoreBar = row.locator('[data-testid^="score-bar-"]');
      await expect(scoreBar).toBeVisible();

      const barStyles = await scoreBar.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          backgroundColor: cs.backgroundColor,
          borderRadius: cs.borderRadius,
        };
      });

      // Also check parent container for border-radius (must be flat)
      const parentBorderRadius = await scoreBar.evaluate((el) => {
        const parent = el.parentElement;
        if (!parent) return "0px";
        return window.getComputedStyle(parent).borderRadius;
      });

      // Determine expected color
      let expectedColor: string;
      let range: string;
      if (score >= 80) {
        expectedColor = COLOR_HIGH;
        range = "high (80-100)";
        highChecked = true;
      } else if (score >= 50) {
        expectedColor = COLOR_MID;
        range = "mid (50-79)";
        midChecked = true;
      } else {
        expectedColor = COLOR_LOW;
        range = "low (0-49)";
        lowChecked = true;
      }

      console.log(
        `Row ${i + 1} score=${score} (${range}): bg=${barStyles.backgroundColor}, expected=${expectedColor}, borderRadius="${barStyles.borderRadius}", parentBorderRadius="${parentBorderRadius}"`
      );

      // Verify color matches expected
      expect(barStyles.backgroundColor).toBe(expectedColor);

      // Verify flat ends: no border-radius on bar or its parent
      expect(barStyles.borderRadius).toBe("0px");
      expect(parentBorderRadius).toBe("0px");
    }

    // Ensure we tested at least the high and mid ranges (mock data covers those)
    expect(highChecked).toBeTruthy();
    expect(midChecked).toBeTruthy();
    // Low range may not be present in mock data — only fail if we find a low-scored
    // candidate whose bar color is wrong (already checked above)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-score-bars.png`,
      fullPage: false,
    });

    console.log("PASS: Score bars have correct colors per range and flat ends");
  });

  test("up to 3 skill tags per candidate, monospace font", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const panel = mainPanel(page);
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const skillChips = row.locator('[data-testid^="skill-chip-"]');
      const chipCount = await skillChips.count();

      // At most 3 skill tags
      expect(chipCount).toBeLessThanOrEqual(3);
      // Should have at least 1 skill tag
      expect(chipCount).toBeGreaterThanOrEqual(1);

      // Check monospace font on first skill tag
      const firstChip = skillChips.first();
      const fontFamily = await firstChip.evaluate(
        (el) => window.getComputedStyle(el).fontFamily
      );

      // Should use monospace font (JetBrains Mono or monospace fallback)
      const isMonospace =
        fontFamily.toLowerCase().includes("jetbrains mono") ||
        fontFamily.toLowerCase().includes("monospace");
      expect(isMonospace).toBeTruthy();

      const chipTexts: string[] = [];
      for (let j = 0; j < chipCount; j++) {
        const text = await skillChips.nth(j).textContent();
        chipTexts.push(text?.trim() || "");
      }
      console.log(
        `Row ${i + 1}: ${chipCount} skill tags: [${chipTexts.join(", ")}], font="${fontFamily}"`
      );
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-skill-tags.png`,
      fullPage: false,
    });

    console.log("PASS: All rows have 1-3 skill tags with monospace font");
  });

  test("row height 40-44px, alternating surface-tertiary tint", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const panel = mainPanel(page);
    const rows = panel.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(5);

    const oddRowBgs: string[] = [];
    const evenRowBgs: string[] = [];

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const styles = await row.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          height: cs.height,
          backgroundColor: cs.backgroundColor,
        };
      });

      const height = parseFloat(styles.height);
      console.log(
        `Row ${i + 1}: height=${styles.height} (${height}px), bg=${styles.backgroundColor}`
      );

      // Row height must be 40-44px
      expect(height).toBeGreaterThanOrEqual(40);
      expect(height).toBeLessThanOrEqual(44);

      if (i % 2 === 1) {
        oddRowBgs.push(styles.backgroundColor);
      } else {
        evenRowBgs.push(styles.backgroundColor);
      }
    }

    console.log(`Even-index row backgrounds: ${evenRowBgs.join(" | ")}`);
    console.log(`Odd-index row backgrounds: ${oddRowBgs.join(" | ")}`);

    // Odd-indexed rows should have a tinted background different from even rows
    const hasAlternating = oddRowBgs.some((bg) => bg !== evenRowBgs[0]);
    expect(hasAlternating).toBeTruthy();

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-row-height-alternating.png`,
      fullPage: false,
    });

    console.log("PASS: Row heights are 40-44px with alternating tint");
  });

  test("table headers: uppercase 11px, letter-spacing 0.08em", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const panel = mainPanel(page);
    const header = panel.locator('[data-testid="candidate-list-header"]');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Get all table header cells
    const headerCells = header.locator(".table-header");
    const cellCount = await headerCells.count();
    console.log(`Table header cell count: ${cellCount}`);
    expect(cellCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < cellCount; i++) {
      const cell = headerCells.nth(i);
      const styles = await cell.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontSize: cs.fontSize,
          textTransform: cs.textTransform,
          letterSpacing: cs.letterSpacing,
          text: el.textContent?.trim() || "",
        };
      });

      console.log(
        `Header "${styles.text}": fontSize=${styles.fontSize}, textTransform=${styles.textTransform}, letterSpacing=${styles.letterSpacing}`
      );

      // Font size must be 11px
      expect(styles.fontSize).toBe("11px");

      // Text transform must be uppercase
      expect(styles.textTransform).toBe("uppercase");

      // Letter spacing: 0.08em at 11px = 0.88px
      const spacing = parseFloat(styles.letterSpacing);
      expect(spacing).toBeCloseTo(0.88, 1);
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-table-headers.png`,
      fullPage: false,
    });

    console.log(
      "PASS: Table headers are uppercase, 11px, letter-spacing 0.08em"
    );
  });

  test("full-page design screenshot for review", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-full-design-review.png`,
      fullPage: true,
    });

    console.log("Screenshot captured for design review");
  });
});
