import { test, expect } from '@playwright/test';

// ============================================================================
// LAYOUT-2 — Dark theme app shell with design tokens
// ============================================================================

test.describe('LAYOUT-2: Dark theme app shell with design tokens', () => {
  test('body background is near #0D0D0D', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/layout2-dashboard.png', fullPage: true });

    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // #0D0D0D = rgb(13, 13, 13)
    // Allow small tolerance — parse rgb values
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match, `Expected rgb(...) format, got: ${bgColor}`).toBeTruthy();
    if (match) {
      const [, r, g, b] = match.map(Number);
      expect(r).toBeLessThanOrEqual(20);
      expect(g).toBeLessThanOrEqual(20);
      expect(b).toBeLessThanOrEqual(20);
    }
  });

  test('accent-primary (#D4FF00) element exists', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // The "+ New Job" button uses bg-accent-primary which should resolve to #D4FF00
    const accentElement = await page.locator('[class*="accent-primary"]').first();
    await expect(accentElement).toBeVisible();

    // Verify computed color is near #D4FF00 = rgb(212, 255, 0)
    const bgColor = await accentElement.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      // D4FF00 = 212, 255, 0 — allow some tolerance
      expect(r).toBeGreaterThan(190);
      expect(g).toBeGreaterThan(230);
      expect(b).toBeLessThan(30);
    }
  });

  test('cards use surface-secondary background', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Job cards have bg-surface-secondary class
    const card = await page.locator('[class*="bg-surface-secondary"]').first();
    await expect(card).toBeVisible();

    const bgColor = await card.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // #1A1A1A = rgb(26, 26, 26)
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match, `Expected rgb format, got: ${bgColor}`).toBeTruthy();
    if (match) {
      const [, r, g, b] = match.map(Number);
      expect(r).toBeGreaterThanOrEqual(20);
      expect(r).toBeLessThanOrEqual(35);
      expect(g).toBeGreaterThanOrEqual(20);
      expect(g).toBeLessThanOrEqual(35);
      expect(b).toBeGreaterThanOrEqual(20);
      expect(b).toBeLessThanOrEqual(35);
    }
  });
});

// ============================================================================
// LAYOUT-1 — Persistent chat sidebar with collapse
// ============================================================================

test.describe('LAYOUT-1: Persistent chat sidebar with collapse', () => {
  test('chat sidebar is visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // On desktop (1280px+), sidebar should be expanded
    const expandedSidebar = page.locator('[data-testid="chat-sidebar-expanded"]');
    await expect(expandedSidebar).toBeVisible();
  });

  test('sidebar collapses and expands on toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Initially expanded
    const expandedSidebar = page.locator('[data-testid="chat-sidebar-expanded"]');
    await expect(expandedSidebar).toBeVisible();
    await page.screenshot({ path: 'screenshots/layout1-sidebar-expanded.png' });

    // Get initial sidebar width
    const initialWidth = await expandedSidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(initialWidth).toBeGreaterThan(200); // Expanded should be ~380px

    // Click toggle to collapse
    const toggle = page.locator('[data-testid="sidebar-toggle"]');
    await toggle.click();
    await page.waitForTimeout(300); // Wait for animation

    // Should now be collapsed
    const collapsedSidebar = page.locator('[data-testid="chat-sidebar-collapsed"]');
    await expect(collapsedSidebar).toBeVisible();
    await page.screenshot({ path: 'screenshots/layout1-sidebar-collapsed.png' });

    const collapsedWidth = await collapsedSidebar.evaluate((el) => el.getBoundingClientRect().width);
    expect(collapsedWidth).toBeLessThan(100); // Collapsed should be ~56px

    // Click toggle again to expand
    const toggleAgain = page.locator('[data-testid="sidebar-toggle"]');
    await toggleAgain.click();
    await page.waitForTimeout(300);

    const expandedAgain = page.locator('[data-testid="chat-sidebar-expanded"]');
    await expect(expandedAgain).toBeVisible();
  });
});

// ============================================================================
// B-1 — Job card grid/list view
// ============================================================================

test.describe('B-1: Job card grid/list view', () => {
  test('dashboard has job cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for job cards — there should be 6 from mock data
    const cards = page.locator('[data-testid^="job-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('grid/list toggle buttons exist', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const viewToggle = page.locator('[data-testid="view-toggle"]');
    await expect(viewToggle).toBeVisible();

    const gridBtn = page.locator('[data-testid="view-toggle-grid"]');
    const listBtn = page.locator('[data-testid="view-toggle-list"]');
    await expect(gridBtn).toBeVisible();
    await expect(listBtn).toBeVisible();
  });

  test('clicking list view changes layout', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Default should be grid view
    const gridView = page.locator('[data-testid="job-grid-view"]');
    await expect(gridView).toBeVisible();

    // Click list view toggle
    const listBtn = page.locator('[data-testid="view-toggle-list"]');
    await listBtn.click();
    await page.waitForTimeout(200);

    // Grid should be gone, list should appear
    const listView = page.locator('[data-testid="job-list-view"]');
    await expect(listView).toBeVisible();
    await expect(gridView).not.toBeVisible();

    await page.screenshot({ path: 'screenshots/b1-list-view.png' });
  });

  test('job card navigates to /job/*/pipeline', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click the first job card
    const firstCard = page.locator('[data-testid^="job-card-"]').first();
    await firstCard.click();
    await page.waitForLoadState('networkidle');

    // URL should match /job/*/pipeline
    expect(page.url()).toMatch(/\/job\/\d+\/pipeline/);
  });
});

// ============================================================================
// B-2 — Job card data display
// ============================================================================

test.describe('B-2: Job card data display', () => {
  test('job cards display status badges', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for at least one status badge
    const activeBadge = page.locator('[data-testid="status-badge-active"]');
    await expect(activeBadge.first()).toBeVisible();
  });

  test('job cards display resume count, high-score count, interview count', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // First job card (Senior Backend Engineer) should show metrics
    const firstCard = page.locator('[data-testid="job-card-1"]');
    await expect(firstCard).toBeVisible();

    // Check that the card text contains the expected counts from mock data
    // Job 1: resumes=142, highScore=12, interviews=4
    const cardText = await firstCard.textContent();
    expect(cardText).toContain('142');
    expect(cardText).toContain('12');
    expect(cardText).toContain('4');
  });
});

// ============================================================================
// C-1 — Left rail JD context tags
// ============================================================================

test.describe('C-1: Left rail JD context tags', () => {
  test('JD context rail exists on pipeline page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    const rail = page.locator('[data-testid="jd-context-rail"]');
    await expect(rail).toBeVisible();
  });

  test('required skill tags display', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    const requiredSection = page.locator('[data-testid="rail-required-skills"]');
    await expect(requiredSection).toBeVisible();

    // Job 1 has required skills: Go, Kubernetes, PostgreSQL, gRPC, Distributed Systems
    const goTag = page.locator('[data-testid="skill-tag-go"]');
    await expect(goTag).toBeVisible();

    const k8sTag = page.locator('[data-testid="skill-tag-kubernetes"]');
    await expect(k8sTag).toBeVisible();
  });

  test('nice-to-have skills display', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    const niceSection = page.locator('[data-testid="rail-nice-to-have-skills"]');
    await expect(niceSection).toBeVisible();

    // Job 1 has nice-to-have: Rust, Terraform, GraphQL
    const rustTag = page.locator('[data-testid="skill-tag-rust"]');
    await expect(rustTag).toBeVisible();
  });

  test('seniority level displays', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    const senioritySection = page.locator('[data-testid="rail-seniority"]');
    await expect(senioritySection).toBeVisible();

    // Job 1 seniority: "Senior (5-8 years)"
    const seniorityText = await senioritySection.textContent();
    expect(seniorityText).toContain('Senior');
    expect(seniorityText).toContain('5-8 years');

    await page.screenshot({ path: 'screenshots/c1-jd-context-rail.png' });
  });
});

// ============================================================================
// C-2 — Ranked candidate list with scores
// ============================================================================

test.describe('C-2: Ranked candidate list with scores', () => {
  test('candidate list exists', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    const list = page.locator('[data-testid="candidate-ranked-list"]');
    await expect(list).toBeVisible();
  });

  test('candidates are sorted by score descending', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    // Extract all scores from the candidate rows
    const rows = page.locator('[data-testid^="candidate-row-"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    const scores: number[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // The score is in a span with font-heading class inside the score area
      const scoreEl = row.locator('.font-heading.font-700').first();
      const scoreText = await scoreEl.textContent();
      if (scoreText) {
        scores.push(parseInt(scoreText.trim(), 10));
      }
    }

    // Verify descending order
    expect(scores.length).toBeGreaterThan(1);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  test('score progress bars exist', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    // Score bars have data-testid="score-bar-*"
    const scoreBars = page.locator('[data-testid^="score-bar-"]');
    const count = await scoreBars.count();
    expect(count).toBeGreaterThan(0);

    // Verify first bar has a width style set
    const firstBar = scoreBars.first();
    const width = await firstBar.evaluate((el) => el.style.width);
    expect(width).toBeTruthy();
    expect(width).toContain('%');
  });

  test('skill tags display on candidate rows', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    // Check skill chips exist
    const skillChips = page.locator('[data-testid^="skill-chip-"]');
    const count = await skillChips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('candidate rows are clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');

    // Candidate rows are <a> tags (Links)
    const firstRow = page.locator('[data-testid^="candidate-row-"]').first();
    const href = await firstRow.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/\/job\/1\/candidate\//);
  });

  test('desktop viewport screenshot (1280x800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/c2-desktop-1280x800.png', fullPage: false });
  });

  test('mobile viewport screenshot (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/job/1/pipeline');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/c2-mobile-375x812.png', fullPage: false });
  });
});
