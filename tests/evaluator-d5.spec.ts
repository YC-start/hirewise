import { test, expect, type Page } from "@playwright/test";

/**
 * Evaluator D-5: Internal notes on candidate
 *
 * features.json test_steps:
 *  1. Navigate to /job/:id/candidate/:cid.
 *  2. Navigate to the Notes & Activity tab.
 *  3. Type a note in the input field and submit.
 *  4. Verify the note appears in the activity feed with author name
 *     and timestamp.
 *  5. Verify the note persists on page reload.
 *  6. Verify the note is visible when another team member views the
 *     same candidate.
 *
 * Plus the tight edges the Evaluator cares about: cross-candidate
 * isolation, tab round-trip preservation, whitespace-only guard,
 * ordering, and design audit.
 */

const SCREENSHOT_DIR =
  "/home/administrator/playground/hirewise/screenshots/evaluator/d5";

const PRIMARY_URL = "/job/1/candidate/c1-01"; // Liam Chen
const SECOND_CANDIDATE_URL = "/job/1/candidate/c1-02"; // Ava Petrov
const CROSS_JOB_URL = "/job/2/candidate/c2-01"; // Different job
const AUTHOR_NAME = "Alex Chen";

test.describe("Evaluator D-5: Internal notes on candidate", () => {
  test.setTimeout(60000);

  // Each test starts with a clean localStorage so notes from a previous
  // test do not pollute the feed. We do this by visiting the site root
  // once and clearing storage there — a context-wide addInitScript would
  // wipe the store on every reload/navigation and break persistence
  // tests, so we avoid that approach.
  test.use({ storageState: { cookies: [], origins: [] } });

  async function clearStorageOnce(page: Page) {
    // Navigate to a cheap route first so we have a same-origin document
    // to run localStorage.clear() against.
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
      } catch {
        /* noop */
      }
    });
  }

  async function gotoProfile(page: Page, url: string) {
    await clearStorageOnce(page);
    await page.goto(url, { waitUntil: "networkidle" });
    const profile = page.locator('[data-testid="candidate-profile"]');
    await expect(profile).toBeVisible({ timeout: 10000 });
    return profile;
  }

  async function openNotesTab(page: Page) {
    const tab = page.locator('[data-testid="notes-tab"]');
    await expect(tab).toBeVisible();
    await tab.click();
    const panel = page.locator('[data-testid="notes-tab-panel"]');
    await expect(panel).toBeVisible();
    return panel;
  }

  async function postNote(page: Page, body: string) {
    const input = page.locator('[data-testid="note-input"]');
    const submit = page.locator('[data-testid="note-submit-btn"]');
    await input.fill(body);
    await expect(submit).toBeEnabled();
    await submit.click();
    // After submit, the input should clear.
    await expect(input).toHaveValue("");
  }

  // ──────────────────────────────────────────────────────────────────────
  // 01 — Notes & Activity tab is visible and clickable
  // ──────────────────────────────────────────────────────────────────────
  test("01 — notes tab is present on the candidate profile", async ({
    page,
  }) => {
    await gotoProfile(page, PRIMARY_URL);

    const notesTab = page.locator('[data-testid="notes-tab"]');
    await expect(notesTab).toBeVisible();
    await expect(notesTab).toContainText(/Notes/i);

    // Default tab is Overview, notes tab is inactive
    await expect(notesTab).toHaveAttribute("aria-selected", "false");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-tab-visible.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 02 — Clicking the tab activates it without changing the URL
  // ──────────────────────────────────────────────────────────────────────
  test("02 — clicking the tab activates it without navigating away", async ({
    page,
  }) => {
    await gotoProfile(page, PRIMARY_URL);

    const urlBefore = page.url();

    const notesTab = page.locator('[data-testid="notes-tab"]');
    await notesTab.click();

    await expect(notesTab).toHaveAttribute("aria-selected", "true");
    expect(page.url()).toBe(urlBefore);

    // Panel is visible, other tab panels are not
    await expect(
      page.locator('[data-testid="notes-tab-panel"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="ai-evaluation-section"]'),
    ).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-tab-active.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 03 — Default empty state is visible
  // ──────────────────────────────────────────────────────────────────────
  test("03 — empty state renders on first visit", async ({ page }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    await expect(
      page.locator('[data-testid="notes-empty-state"]'),
    ).toBeVisible();

    // Count should read 0
    const count = page.locator('[data-testid="notes-count"]');
    await expect(count).toContainText(/0/);

    // Feed must not be present yet
    await expect(page.locator('[data-testid="notes-feed"]')).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-empty-state.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 04 — Post a note, verify it appears with author + timestamp
  // ──────────────────────────────────────────────────────────────────────
  test("04 — posted note appears in feed with author and timestamp", async ({
    page,
  }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    const body = "Strong candidate, schedule a technical screen next week.";
    await postNote(page, body);

    // Empty state gone, feed rendered
    await expect(
      page.locator('[data-testid="notes-empty-state"]'),
    ).toHaveCount(0);
    await expect(page.locator('[data-testid="notes-feed"]')).toBeVisible();

    const noteItem = page.locator('[data-testid="note-item"]').first();
    await expect(noteItem).toBeVisible();

    await expect(
      noteItem.locator('[data-testid="note-author"]'),
    ).toHaveText(AUTHOR_NAME);

    // Body text
    await expect(
      noteItem.locator('[data-testid="note-body"]'),
    ).toHaveText(body);

    // Timestamp is visible and human-readable (just now, Xs ago, ...)
    const ts = noteItem.locator('[data-testid="note-timestamp"]');
    await expect(ts).toBeVisible();
    await expect(ts).toHaveText(/just now|ago/i);

    // The <time> element must have a datetime attribute for a11y
    await expect(ts).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);

    // Notes count badge updated
    await expect(
      page.locator('[data-testid="notes-count"]'),
    ).toContainText(/1/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-note-posted.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 05 — Note persists across a full page reload (localStorage)
  // ──────────────────────────────────────────────────────────────────────
  test("05 — note persists after page reload (persistence is the soul of D-5)", async ({
    page,
  }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    const body = "Persisted across reload — do not lose me.";
    await postNote(page, body);

    await expect(
      page.locator('[data-testid="note-item"]').first(),
    ).toBeVisible();

    // Confirm the store actually wrote to localStorage (extra paranoia).
    const stored = await page.evaluate(() => {
      return window.localStorage.getItem("hirewise-notes");
    });
    expect(stored).toBeTruthy();
    expect(stored).toContain("Persisted across reload");

    // Hard reload
    await page.reload({ waitUntil: "networkidle" });

    // Re-open the tab (default is Overview after reload)
    await openNotesTab(page);

    const firstItem = page.locator('[data-testid="note-item"]').first();
    await expect(firstItem).toBeVisible();
    await expect(firstItem.locator('[data-testid="note-body"]')).toHaveText(
      body,
    );
    await expect(
      firstItem.locator('[data-testid="note-author"]'),
    ).toHaveText(AUTHOR_NAME);
    await expect(
      page.locator('[data-testid="notes-count"]'),
    ).toContainText(/1/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-after-reload.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 06 — Cross-candidate isolation: c1-01 note does not leak to c1-02
  // ──────────────────────────────────────────────────────────────────────
  test("06 — notes are isolated per candidate", async ({ page }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    await postNote(page, "This note belongs to Liam only.");
    await expect(
      page.locator('[data-testid="note-item"]'),
    ).toHaveCount(1);

    // Navigate to a different candidate in the same job
    await page.goto(SECOND_CANDIDATE_URL, { waitUntil: "networkidle" });
    await expect(
      page.locator('[data-testid="candidate-profile"]'),
    ).toBeVisible();
    await openNotesTab(page);

    // Second candidate: empty state, zero notes
    await expect(
      page.locator('[data-testid="notes-empty-state"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="note-item"]'),
    ).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-isolation-other-candidate.png`,
      fullPage: true,
    });

    // Back to c1-01 — note still there
    await page.goto(PRIMARY_URL, { waitUntil: "networkidle" });
    await openNotesTab(page);
    await expect(page.locator('[data-testid="note-item"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid="note-item"]').first().locator(
        '[data-testid="note-body"]',
      ),
    ).toHaveText("This note belongs to Liam only.");
  });

  // ──────────────────────────────────────────────────────────────────────
  // 07 — Multiple notes: newest-first ordering
  // ──────────────────────────────────────────────────────────────────────
  test("07 — multiple notes show newest first", async ({ page }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    await postNote(page, "First note — oldest.");
    // Slight wait to ensure distinct createdAt values
    await page.waitForTimeout(30);
    await postNote(page, "Second note — middle.");
    await page.waitForTimeout(30);
    await postNote(page, "Third note — newest.");

    const items = page.locator('[data-testid="note-item"]');
    await expect(items).toHaveCount(3);

    // First rendered should be the newest
    await expect(
      items.nth(0).locator('[data-testid="note-body"]'),
    ).toHaveText("Third note — newest.");
    await expect(
      items.nth(1).locator('[data-testid="note-body"]'),
    ).toHaveText("Second note — middle.");
    await expect(
      items.nth(2).locator('[data-testid="note-body"]'),
    ).toHaveText("First note — oldest.");

    // Count should show 3
    await expect(
      page.locator('[data-testid="notes-count"]'),
    ).toContainText(/3/);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-multiple-notes-order.png`,
      fullPage: true,
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // 08 — Whitespace-only input disables submit
  // ──────────────────────────────────────────────────────────────────────
  test("08 — whitespace-only input keeps submit disabled", async ({
    page,
  }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    const input = page.locator('[data-testid="note-input"]');
    const submit = page.locator('[data-testid="note-submit-btn"]');

    // Empty → disabled
    await expect(submit).toBeDisabled();

    // Only whitespace → still disabled
    await input.fill("     \n\t   ");
    await expect(submit).toBeDisabled();

    // Real content → enabled
    await input.fill("actual content");
    await expect(submit).toBeEnabled();

    // Clear → disabled again
    await input.fill("");
    await expect(submit).toBeDisabled();
  });

  // ──────────────────────────────────────────────────────────────────────
  // 09 — Tab round-trip does not lose the draft note already posted
  // ──────────────────────────────────────────────────────────────────────
  test("09 — switching tabs preserves posted notes", async ({ page }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    await postNote(page, "Surviving a tab tour.");
    await expect(page.locator('[data-testid="note-item"]')).toHaveCount(1);

    // Go back to Overview
    await page.locator('[data-testid="tab-overview"]').click();
    await expect(
      page.locator('[data-testid="ai-evaluation-section"]'),
    ).toBeVisible();

    // Go to Interview Prep
    await page.locator('[data-testid="tab-interview-prep"]').click();

    // Back to Notes
    await openNotesTab(page);
    await expect(page.locator('[data-testid="note-item"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid="note-item"]').first().locator(
        '[data-testid="note-body"]',
      ),
    ).toHaveText("Surviving a tab tour.");
  });

  // ──────────────────────────────────────────────────────────────────────
  // 10 — Cross-job isolation: notes for c1-01 do not leak to c2-01
  //     (candidate ids are job-prefixed but we verify via scope key anyway)
  // ──────────────────────────────────────────────────────────────────────
  test("10 — notes are isolated per (job, candidate) scope", async ({
    page,
  }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);
    await postNote(page, "Note for job 1 / c1-01.");

    await page.goto(CROSS_JOB_URL, { waitUntil: "networkidle" });
    const otherProfile = page.locator('[data-testid="candidate-profile"]');
    await expect(otherProfile).toBeVisible();
    await openNotesTab(page);

    await expect(
      page.locator('[data-testid="notes-empty-state"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="note-item"]'),
    ).toHaveCount(0);
  });

  // ──────────────────────────────────────────────────────────────────────
  // 11 — Keyboard shortcut Ctrl+Enter submits
  // ──────────────────────────────────────────────────────────────────────
  test("11 — Ctrl+Enter submits the note", async ({ page }) => {
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    const input = page.locator('[data-testid="note-input"]');
    await input.fill("Submitted via shortcut.");
    await input.press("Control+Enter");

    await expect(page.locator('[data-testid="note-item"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid="note-item"]').first().locator(
        '[data-testid="note-body"]',
      ),
    ).toHaveText("Submitted via shortcut.");
    await expect(input).toHaveValue("");
  });

  // ──────────────────────────────────────────────────────────────────────
  // 12 — Design audit: 1440x900 full screenshot + note closeup
  // ──────────────────────────────────────────────────────────────────────
  test("12 — design audit at 1440x900", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoProfile(page, PRIMARY_URL);
    await openNotesTab(page);

    await postNote(
      page,
      "Loved the depth of the K8s answer — let's move to the on-site and line up a systems design interview.",
    );
    await page.waitForTimeout(60);
    await postNote(
      page,
      "Heads up: reference check pending. Offer letter can go out Friday if refs are clean.",
    );

    // Full page audit
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-design-audit-1440.png`,
      fullPage: true,
    });

    // Close-up on the feed
    const feed = page.locator('[data-testid="notes-feed"]');
    await expect(feed).toBeVisible();
    await feed.screenshot({
      path: `${SCREENSHOT_DIR}/12-design-feed-closeup.png`,
    });

    // Close-up on the compose card
    const compose = page.locator('[data-testid="note-compose-form"]');
    await compose.screenshot({
      path: `${SCREENSHOT_DIR}/12-design-compose-closeup.png`,
    });
  });
});
