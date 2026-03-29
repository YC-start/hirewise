import { test, expect } from "@playwright/test";

/**
 * C-1 Evaluation: Left Rail JD Context Tags
 *
 * Validates the JD context rail on the pipeline page:
 * - Rail presence and width (~280px)
 * - Required Skills section with solid-border tags
 * - Nice to Have section with dashed-border tags
 * - Visual differentiation between required and nice-to-have tags
 * - Seniority level display
 * - JD Summary text
 * - Rail remains visible when right-side content scrolls
 */

test.describe("C-1: Left Rail JD Context Tags", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("JD context rail renders correctly with all sections", async ({
    page,
  }) => {
    // ── Step 1: Navigate to pipeline page for job 1 ────────────────
    await page.goto("/job/1/pipeline");
    await page.waitForLoadState("networkidle");

    // ── Step 2: Verify the JD context rail exists ──────────────────
    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible();

    // ── Step 3: Verify rail width is approximately 280px ───────────
    const railBox = await rail.boundingBox();
    expect(railBox).toBeTruthy();
    expect(railBox!.width).toBeGreaterThanOrEqual(270);
    expect(railBox!.width).toBeLessThanOrEqual(290);

    // ── Step 4: Verify "Required Skills" section exists with tags ──
    const requiredSection = page.locator(
      '[data-testid="rail-required-skills"]'
    );
    await expect(requiredSection).toBeVisible();

    // Verify section header text
    await expect(requiredSection.locator(".table-header")).toContainText(
      "Required Skills"
    );

    // Verify required skill tags are present (job 1 has 5 required skills)
    const requiredTags = requiredSection.locator(
      '[data-skill-category="required"]'
    );
    const requiredCount = await requiredTags.count();
    expect(requiredCount).toBeGreaterThanOrEqual(1);

    // Verify specific expected skill names for job 1
    await expect(
      requiredSection.locator('[data-testid="skill-tag-go"]')
    ).toBeVisible();
    await expect(
      requiredSection.locator('[data-testid="skill-tag-kubernetes"]')
    ).toBeVisible();
    await expect(
      requiredSection.locator('[data-testid="skill-tag-postgresql"]')
    ).toBeVisible();

    // ── Step 5: Verify "Nice to Have" section exists with tags ─────
    const niceToHaveSection = page.locator(
      '[data-testid="rail-nice-to-have-skills"]'
    );
    await expect(niceToHaveSection).toBeVisible();

    // Verify section header text
    await expect(niceToHaveSection.locator(".table-header")).toContainText(
      "Nice to Have"
    );

    // Verify nice-to-have skill tags are present (job 1 has 3 nice-to-have)
    const niceToHaveTags = niceToHaveSection.locator(
      '[data-skill-category="nice-to-have"]'
    );
    const niceToHaveCount = await niceToHaveTags.count();
    expect(niceToHaveCount).toBeGreaterThanOrEqual(1);

    // Verify specific expected nice-to-have skills for job 1
    await expect(
      niceToHaveSection.locator('[data-testid="skill-tag-rust"]')
    ).toBeVisible();
    await expect(
      niceToHaveSection.locator('[data-testid="skill-tag-terraform"]')
    ).toBeVisible();
    await expect(
      niceToHaveSection.locator('[data-testid="skill-tag-graphql"]')
    ).toBeVisible();

    // ── Step 6: Verify visual differentiation (solid vs dashed) ────
    // Required tags should have solid border (default border-style)
    const firstRequiredTag = requiredTags.first();
    const requiredBorderStyle = await firstRequiredTag.evaluate(
      (el) => window.getComputedStyle(el).borderStyle
    );
    expect(requiredBorderStyle).toBe("solid");

    // Nice-to-have tags should have dashed border
    const firstNiceToHaveTag = niceToHaveTags.first();
    const niceToHaveBorderStyle = await firstNiceToHaveTag.evaluate(
      (el) => window.getComputedStyle(el).borderStyle
    );
    expect(niceToHaveBorderStyle).toBe("dashed");

    // Confirm they are visually different
    expect(requiredBorderStyle).not.toBe(niceToHaveBorderStyle);

    // ── Step 7: Verify Seniority level is displayed ────────────────
    const senioritySection = page.locator('[data-testid="rail-seniority"]');
    await expect(senioritySection).toBeVisible();
    // Job 1 seniority is "Senior (5-8 years)"
    await expect(senioritySection).toContainText("Senior (5-8 years)");

    // ── Step 8: Verify JD Summary text exists ──────────────────────
    const summarySection = page.locator('[data-testid="rail-jd-summary"]');
    await expect(summarySection).toBeVisible();
    // Job 1 summary starts with "Build and scale distributed backend..."
    await expect(summarySection).toContainText(
      "Build and scale distributed backend services"
    );

    // Verify summary text is non-trivial (more than 20 characters)
    const summaryText = await summarySection.textContent();
    expect(summaryText!.length).toBeGreaterThan(20);

    // ── Step 9: Screenshot ─────────────────────────────────────────
    await page.screenshot({
      path: "screenshots/c1-jd-rail.png",
      fullPage: false,
    });

    // ── Step 10: Scroll right-side content, verify rail stays visible
    const candidatePanel = page.locator(
      '[data-testid="candidate-list-panel"]'
    );
    const candidatePanelVisible = await candidatePanel.isVisible();

    if (candidatePanelVisible) {
      // Scroll the candidate panel content down
      await candidatePanel.evaluate((el) => {
        // Find the first scrollable child or the element itself
        const scrollable =
          el.querySelector("[class*='overflow']") || el;
        scrollable.scrollTop = scrollable.scrollHeight;
      });

      // Small wait for scroll to settle
      await page.waitForTimeout(300);

      // Verify the rail is still visible after scrolling
      await expect(rail).toBeVisible();
      const railBoxAfterScroll = await rail.boundingBox();
      expect(railBoxAfterScroll).toBeTruthy();
      // Rail should still be at approximately the same position
      expect(railBoxAfterScroll!.width).toBeGreaterThanOrEqual(270);
      expect(railBoxAfterScroll!.width).toBeLessThanOrEqual(290);
    }

    // ── Step 11: Verify the pipeline page container ────────────────
    const pipelinePage = page.locator('[data-testid="pipeline-page"]');
    await expect(pipelinePage).toBeVisible();
  });
});
