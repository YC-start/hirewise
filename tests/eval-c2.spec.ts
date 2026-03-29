import { test, expect } from "@playwright/test";

/**
 * C-2 Evaluation: Ranked Candidate List with Scores and Skill Tags
 *
 * Validates the candidate ranking table on the pipeline page:
 * - Candidate list presence with >= 8 rows
 * - Scores sorted descending (each score >= next)
 * - Score progress bars exist and are color-coded by range:
 *   - High (>=80): ~#D4FF00
 *   - Mid (50-79): ~#FFB800
 *   - Low (<50):   ~#FF4444
 * - Each row has at least 1 skill tag
 * - Table header exists with text-transform: uppercase
 * - Rows are clickable links to /job/{id}/candidate/{cid}
 * - Navigation to candidate detail page
 * - Desktop + mobile screenshots
 */

/** Parse an rgb(r, g, b) string to {r, g, b}. */
function parseRgb(rgb: string): { r: number; g: number; b: number } {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

/** Convert hex #RRGGBB to {r, g, b}. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/** Check if two colors are close (tolerance per channel). */
function colorsClose(
  actual: { r: number; g: number; b: number },
  expected: { r: number; g: number; b: number },
  tolerance = 30
): boolean {
  return (
    Math.abs(actual.r - expected.r) <= tolerance &&
    Math.abs(actual.g - expected.g) <= tolerance &&
    Math.abs(actual.b - expected.b) <= tolerance
  );
}

test.describe("C-2: Ranked Candidate List with Scores and Skill Tags", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("candidate ranked list renders correctly with all features", async ({
    page,
  }) => {
    // ── Step 1: Navigate to pipeline page ─────────────────────────────
    await page.goto("/job/1/pipeline");
    await page.waitForLoadState("networkidle");

    // ── Step 2: Verify the candidate list exists ──────────────────────
    const candidateList = page.locator(
      '[data-testid="candidate-ranked-list"]'
    );
    await expect(candidateList).toBeVisible();

    // ── Step 3: Verify at least 8 candidate rows ──────────────────────
    const rows = candidateList.locator('[data-testid^="candidate-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(8);

    // ── Step 4: Extract scores and verify descending order ────────────
    // Job 1 has 12 candidates; scores are rendered as the first <span>
    // with font-heading inside each row's AI Score cell.
    const scores: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      // The score span is the one with font-heading and tabular-nums
      const scoreText = await row
        .locator("span.font-heading")
        .first()
        .textContent();
      const score = parseInt(scoreText!.trim(), 10);
      expect(score).not.toBeNaN();
      scores.push(score);
    }

    // Verify descending sort: each score >= next score
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }

    // ── Step 5: Verify score progress bars exist ──────────────────────
    const scoreBars = candidateList.locator('[data-testid^="score-bar-"]');
    const barCount = await scoreBars.count();
    expect(barCount).toBe(rowCount); // one bar per row

    // ── Step 6: Verify bar colors match score ranges ──────────────────
    const expectedHigh = hexToRgb("#D4FF00");
    const expectedMid = hexToRgb("#FFB800");
    const expectedLow = hexToRgb("#FF4444");

    for (let i = 0; i < rowCount; i++) {
      const score = scores[i];
      const bar = scoreBars.nth(i);
      const bgColor = await bar.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor
      );
      const actual = parseRgb(bgColor);

      if (score >= 80) {
        expect(
          colorsClose(actual, expectedHigh),
          `Row ${i} score ${score}: expected high color ~#D4FF00 but got ${bgColor}`
        ).toBe(true);
      } else if (score >= 50) {
        expect(
          colorsClose(actual, expectedMid),
          `Row ${i} score ${score}: expected mid color ~#FFB800 but got ${bgColor}`
        ).toBe(true);
      } else {
        expect(
          colorsClose(actual, expectedLow),
          `Row ${i} score ${score}: expected low color ~#FF4444 but got ${bgColor}`
        ).toBe(true);
      }
    }

    // ── Step 7: Verify each row has at least 1 skill tag ──────────────
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const skillChips = row.locator('[data-testid^="skill-chip-"]');
      const chipCount = await skillChips.count();
      expect(chipCount).toBeGreaterThanOrEqual(1);
    }

    // ── Step 8: Verify table header exists with uppercase ─────────────
    const header = candidateList.locator(
      '[data-testid="candidate-list-header"]'
    );
    await expect(header).toBeVisible();

    // Check that header cells use text-transform: uppercase
    const headerCells = header.locator(".table-header");
    const headerCellCount = await headerCells.count();
    expect(headerCellCount).toBeGreaterThanOrEqual(3); // at least #, Candidate, AI Score

    for (let i = 0; i < headerCellCount; i++) {
      const textTransform = await headerCells.nth(i).evaluate(
        (el) => window.getComputedStyle(el).textTransform
      );
      expect(textTransform).toBe("uppercase");
    }

    // ── Step 9: Verify candidate rows are clickable links ─────────────
    // Each row is a <Link> rendering as <a> with href matching /job/*/candidate/*
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const tagName = await row.evaluate((el) => el.tagName.toLowerCase());
      expect(tagName).toBe("a");

      const href = await row.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/\/job\/\d+\/candidate\/.+/);
    }

    // ── Step 10: Click first candidate and verify navigation ──────────
    const firstRowHref = await rows.first().getAttribute("href");
    expect(firstRowHref).toBeTruthy();
    expect(firstRowHref).toMatch(/\/job\/1\/candidate\/.+/);

    await rows.first().click();
    await page.waitForURL(/\/job\/1\/candidate\/.+/, { timeout: 10000 });

    // Verify URL changed to /job/1/candidate/*
    expect(page.url()).toMatch(/\/job\/1\/candidate\/.+/);

    // ── Step 11: Go back and take desktop screenshot ──────────────────
    await page.goto("/job/1/pipeline");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('[data-testid="candidate-ranked-list"]')
    ).toBeVisible();

    await page.screenshot({
      path: "screenshots/c2-ranking-desktop.png",
      fullPage: false,
    });

    // ── Step 12: Mobile viewport and screenshot ───────────────────────
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500); // allow layout reflow

    await page.screenshot({
      path: "screenshots/c2-ranking-mobile.png",
      fullPage: false,
    });
  });
});
