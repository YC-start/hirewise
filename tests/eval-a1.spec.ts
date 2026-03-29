import { test, expect } from '@playwright/test';

test.describe('A-1: Natural Language Candidate Search', () => {
  test('full search flow: input → confirm → progress → action card → navigate', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // 1. Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Locate chat input by its data-testid (placeholder is "Ask the agent...")
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // 3. Type a search query containing keywords that trigger the search flow
    await chatInput.fill('Find me senior backend engineers with Go and Kubernetes experience');
    await chatInput.press('Enter');

    // 4. Verify input cleared after send (onSend calls setInput(""))
    await expect(chatInput).toHaveValue('', { timeout: 2000 });

    // 5. Wait for agent acknowledgement message containing "Got it" or "Searching"
    const agentBubbles = page.locator('[data-testid="chat-bubble-agent"]');
    // The acknowledgement is the first agent bubble after the welcome message
    // It should contain "Got it! Searching" per buildAcknowledgement()
    await expect(
      page.locator('[data-testid="chat-bubble-agent"]').filter({ hasText: /Got it|Searching/ })
    ).toBeVisible({ timeout: 3000 });

    // 6. Wait for progress indicator to appear (400ms delay in use-chat.ts)
    const progress = page.locator('[data-testid="progress-indicator"]');
    await expect(progress).toBeVisible({ timeout: 3000 });

    // 7. Wait for Action Card to appear
    //    Timeline: progress starts at 400ms, completes at 4900ms, action card at 5500ms
    //    So we need ~6s from send. Give it up to 10s total.
    const actionCard = page.locator('[data-testid="action-card"]');
    await expect(actionCard).toBeVisible({ timeout: 10000 });

    // Verify the action card has expected content
    await expect(page.locator('[data-testid="action-card-title"]')).toHaveText('Search Complete');
    await expect(page.locator('[data-testid="action-card-summary"]')).toContainText('candidates');

    // 8. Screenshot the search flow
    await page.screenshot({ path: 'screenshots/a1-search-flow.png', fullPage: false });

    // 9. Click "View Ranking" CTA
    const cta = page.locator('[data-testid="action-card-cta"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('View Ranking');
    await cta.click();

    // 10. Verify navigation to pipeline page (/job/[id]/pipeline)
    await page.waitForURL(/\/job\/.*\/pipeline/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // 11. Verify candidate ranked list is visible
    const candidateList = page.locator('[data-testid="candidate-ranked-list"]');
    await expect(candidateList).toBeVisible({ timeout: 5000 });

    // Verify at least one candidate row exists
    const candidateRows = page.locator('[data-testid^="candidate-row-"]');
    await expect(candidateRows.first()).toBeVisible({ timeout: 3000 });

    // 12. Screenshot the pipeline result
    await page.screenshot({ path: 'screenshots/a1-pipeline-result.png', fullPage: false });

    await context.close();
  });
});
