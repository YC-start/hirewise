import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "test-results/evaluator-c1-r2";

/**
 * Evaluator C-1 Round 2: Left Rail JD Context Tags
 *
 * Strict evaluation of:
 * 1. Rail visible in MAIN content (data-testid="jd-context-rail")
 * 2. Required skill tags with solid #D4FF00 border
 * 3. Nice-to-have tags with dashed border + muted text
 * 4. Seniority badge with teal (#00D4AA) accent
 * 5. Section headers: 11px uppercase, 0.08em letter-spacing
 * 6. Rail stays visible while scrolling candidates
 */

test.describe("Evaluator C-1 Round 2: Left Rail JD Context Tags", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Rail is visible in main content area", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    // Screenshot: full page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-pipeline-full.png`,
      fullPage: false,
    });

    // The rail MUST exist and be visible
    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Verify it is an <aside> element (semantic correctness)
    const tagName = await rail.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("aside");

    // Verify it is inside the main content area, NOT inside a sidebar
    // It should be a child of the pipeline-page container
    const pipelinePage = page.locator('[data-testid="pipeline-page"]');
    await expect(pipelinePage).toBeVisible();

    // Rail must be a descendant of pipeline-page
    const railInsidePipeline = pipelinePage.locator(
      '[data-testid="jd-context-rail"]'
    );
    await expect(railInsidePipeline).toBeVisible();

    // Verify the rail has a reasonable width (spec says 280px)
    const railBox = await rail.boundingBox();
    expect(railBox).toBeTruthy();
    expect(railBox!.width).toBeGreaterThanOrEqual(250);
    expect(railBox!.width).toBeLessThanOrEqual(320);

    console.log(
      `PASS: Rail visible at (${railBox!.x}, ${railBox!.y}), ${railBox!.width}x${railBox!.height}`
    );
  });

  test("Required skill tags have solid #D4FF00 border", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Check the required skills section exists
    const requiredSection = rail.locator(
      '[data-testid="rail-required-skills"]'
    );
    await expect(requiredSection).toBeVisible();

    // Get all required skill tags
    const requiredTags = rail.locator('[data-skill-category="required"]');
    const tagCount = await requiredTags.count();
    expect(tagCount).toBeGreaterThanOrEqual(3); // Job 1 has 5 required skills

    console.log(`Required skill tags found: ${tagCount}`);

    // Expected required skills for job 1
    const expectedRequired = [
      "Go",
      "Kubernetes",
      "PostgreSQL",
      "gRPC",
      "Distributed Systems",
    ];

    for (let i = 0; i < tagCount; i++) {
      const tag = requiredTags.nth(i);
      const text = (await tag.textContent())?.trim();
      console.log(`  Required tag ${i}: "${text}"`);
      expect(expectedRequired).toContain(text);

      // Check border style is SOLID (not dashed)
      const styles = await tag.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        // Resolve the border color to RGB via a canvas to handle oklab/oklch
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = cs.borderColor;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return {
          borderStyle: cs.borderStyle,
          borderColorRgb: { r, g, b },
          textColor: cs.color,
        };
      });

      expect(styles.borderStyle).toBe("solid");

      // Text color must be accent-primary #D4FF00 = rgb(212, 255, 0)
      expect(styles.textColor).toBe("rgb(212, 255, 0)");

      // Border color should be in the #D4FF00 family (with alpha applied on dark bg)
      // The RGB from canvas will reflect alpha compositing on black, so
      // check that R channel (D4=212) and G channel (FF=255) dominate, B near 0
      expect(styles.borderColorRgb.r).toBeGreaterThan(60); // 212 * 0.4 ~ 85 on black
      expect(styles.borderColorRgb.g).toBeGreaterThan(70); // 255 * 0.4 ~ 102 on black
      expect(styles.borderColorRgb.b).toBeLessThan(30);

      console.log(
        `  Border: ${styles.borderStyle}, borderRGB=(${styles.borderColorRgb.r},${styles.borderColorRgb.g},${styles.borderColorRgb.b}), textColor=${styles.textColor}`
      );
    }

    // Screenshot of the required skills section
    await requiredSection.screenshot({
      path: `${SCREENSHOT_DIR}/02-required-skills.png`,
    });
  });

  test("Nice-to-have tags have dashed border and muted text", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Check the nice-to-have section exists
    const niceSection = rail.locator(
      '[data-testid="rail-nice-to-have-skills"]'
    );
    await expect(niceSection).toBeVisible();

    // Get all nice-to-have tags
    const niceTags = rail.locator('[data-skill-category="nice-to-have"]');
    const tagCount = await niceTags.count();
    expect(tagCount).toBeGreaterThanOrEqual(2); // Job 1 has 3 nice-to-have skills

    console.log(`Nice-to-have tags found: ${tagCount}`);

    const expectedNice = ["Rust", "Terraform", "GraphQL"];

    for (let i = 0; i < tagCount; i++) {
      const tag = niceTags.nth(i);
      const text = (await tag.textContent())?.trim();
      console.log(`  Nice-to-have tag ${i}: "${text}"`);
      expect(expectedNice).toContain(text);

      const styles = await tag.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          borderStyle: cs.borderStyle,
          color: cs.color,
        };
      });

      // MUST be dashed border
      expect(styles.borderStyle).toBe("dashed");

      // Text color should be muted/secondary (text-text-secondary = #888888 = rgb(136,136,136))
      const isMuted =
        styles.color.includes("136") || styles.color.includes("85");
      expect(isMuted).toBeTruthy();

      console.log(`  Border: ${styles.borderStyle}, text color: ${styles.color}`);
    }

    // Visual comparison: required vs nice-to-have side by side
    await niceSection.screenshot({
      path: `${SCREENSHOT_DIR}/03-nice-to-have-skills.png`,
    });

    // Compare a required tag vs nice-to-have tag styles
    const requiredTag = rail
      .locator('[data-skill-category="required"]')
      .first();
    const niceTag = rail
      .locator('[data-skill-category="nice-to-have"]')
      .first();

    const [reqStyle, niceStyle] = await Promise.all([
      requiredTag.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { borderStyle: cs.borderStyle, color: cs.color };
      }),
      niceTag.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return { borderStyle: cs.borderStyle, color: cs.color };
      }),
    ]);

    // They MUST be visually different
    expect(reqStyle.borderStyle).not.toBe(niceStyle.borderStyle);
    console.log(
      `Visual differentiation: required=${reqStyle.borderStyle}/${reqStyle.color} vs nice=${niceStyle.borderStyle}/${niceStyle.color}`
    );
  });

  test("Seniority badge with teal (#00D4AA) accent", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Check seniority section
    const senioritySection = rail.locator('[data-testid="rail-seniority"]');
    await expect(senioritySection).toBeVisible();

    // Find the seniority badge (the span with the seniority text)
    const badge = senioritySection.locator("span.inline-flex").first();
    await expect(badge).toBeVisible();

    const badgeText = await badge.textContent();
    expect(badgeText?.trim()).toContain("Senior");
    console.log(`Seniority badge text: "${badgeText?.trim()}"`);

    // Check teal accent (#00D4AA = rgb(0, 212, 170))
    const styles = await badge.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        color: cs.color,
        borderColor: cs.borderColor,
      };
    });

    // Text color should be accent-secondary (#00D4AA)
    const hasTealText =
      styles.color.includes("0") &&
      styles.color.includes("212") &&
      styles.color.includes("170");
    const hasTealBorder =
      styles.borderColor.includes("0") &&
      styles.borderColor.includes("212") &&
      styles.borderColor.includes("170");

    expect(hasTealText || hasTealBorder).toBeTruthy();
    console.log(
      `Seniority badge: color=${styles.color}, border=${styles.borderColor}`
    );

    await senioritySection.screenshot({
      path: `${SCREENSHOT_DIR}/04-seniority-badge.png`,
    });
  });

  test("Section headers: 11px uppercase, 0.08em letter-spacing", async ({
    page,
  }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Section headers use the .table-header class
    const headers = rail.locator(".table-header");
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(3); // Seniority, Required Skills, Nice to Have, Summary

    console.log(`Section headers found: ${headerCount}`);

    for (let i = 0; i < headerCount; i++) {
      const header = headers.nth(i);
      const text = await header.textContent();

      const styles = await header.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          fontSize: cs.fontSize,
          textTransform: cs.textTransform,
          letterSpacing: cs.letterSpacing,
        };
      });

      console.log(
        `  Header "${text?.trim()}": fontSize=${styles.fontSize}, textTransform=${styles.textTransform}, letterSpacing=${styles.letterSpacing}`
      );

      // Font size should be 11px
      expect(styles.fontSize).toBe("11px");

      // Text transform should be uppercase
      expect(styles.textTransform).toBe("uppercase");

      // Letter spacing should be ~0.08em = 0.88px at 11px
      // Parse the computed letter-spacing (will be in px)
      const lsPx = parseFloat(styles.letterSpacing);
      // 0.08em at 11px = 0.88px, allow a tolerance range
      expect(lsPx).toBeGreaterThanOrEqual(0.7);
      expect(lsPx).toBeLessThanOrEqual(1.1);
    }
  });

  test("Rail stays visible while scrolling candidates", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Get the candidate list panel
    const candidatePanel = page.locator(
      '[data-testid="candidate-list-panel"]'
    );
    await expect(candidatePanel).toBeVisible();

    // Record rail position before scroll
    const railBoxBefore = await rail.boundingBox();
    expect(railBoxBefore).toBeTruthy();

    // Screenshot before scroll
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-before-scroll.png`,
      fullPage: false,
    });

    // Scroll the candidate list panel (or the main scrollable container)
    // Try scrolling the candidate panel content
    await candidatePanel.evaluate((el) => {
      const scrollable = el.querySelector("[class*='overflow']") || el;
      scrollable.scrollTop = 500;
    });
    await page.waitForTimeout(300);

    // Also try scrolling child elements
    await page.evaluate(() => {
      const containers = document.querySelectorAll(
        '[data-testid="candidate-list-panel"] *'
      );
      for (const c of containers) {
        if (
          c.scrollHeight > c.clientHeight &&
          c.clientHeight > 0
        ) {
          c.scrollTop = 500;
          break;
        }
      }
    });
    await page.waitForTimeout(300);

    // Screenshot after scroll
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-after-scroll.png`,
      fullPage: false,
    });

    // Rail must STILL be visible after scrolling
    await expect(rail).toBeVisible();

    // Rail position should not have changed significantly (stays fixed/sticky)
    const railBoxAfter = await rail.boundingBox();
    expect(railBoxAfter).toBeTruthy();

    // The Y position should be the same or very close (not scrolled away)
    const yDrift = Math.abs(railBoxAfter!.y - railBoxBefore!.y);
    expect(yDrift).toBeLessThan(5); // Allow tiny subpixel drift

    console.log(
      `Rail position: before=(${railBoxBefore!.x},${railBoxBefore!.y}), after=(${railBoxAfter!.x},${railBoxAfter!.y}), drift=${yDrift}px`
    );
  });

  test("Full design screenshot for manual review", async ({ page }) => {
    await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible({ timeout: 5000 });

    // Screenshot the rail in isolation
    await rail.screenshot({
      path: `${SCREENSHOT_DIR}/07-rail-isolated.png`,
    });

    // Full page
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-full-page-final.png`,
      fullPage: false,
    });
  });
});
