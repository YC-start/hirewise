import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "/home/administrator/playground/hirewise/screenshots";

test.describe("Debug: Pipeline error investigation", () => {
  test("click Pipeline tab in data panel sidebar on /dashboard", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Collect console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    });

    // Collect uncaught page errors
    page.on("pageerror", (err) => {
      pageErrors.push(`[pageerror] ${err.message}\n${err.stack}`);
    });

    // 1. Navigate to /dashboard
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-01-dashboard.png`, fullPage: true });

    // 2. Wait for the data panel to be visible
    const dataPanel = page.locator('[data-testid="data-panel-expanded"], [data-testid="data-panel-collapsed"]');
    await expect(dataPanel.first()).toBeVisible({ timeout: 10000 });

    // 3. If collapsed, expand it first
    const collapsed = page.locator('[data-testid="data-panel-collapsed"]');
    if (await collapsed.isVisible()) {
      const toggle = page.locator('[data-testid="data-panel-toggle"]');
      await toggle.click();
      await page.waitForTimeout(500);
    }

    // 4. Click the Pipeline tab
    const pipelineTab = page.locator('[data-testid="data-panel-tab-pipeline"]');
    await expect(pipelineTab).toBeVisible({ timeout: 5000 });
    await pipelineTab.click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-02-after-tab-click.png`, fullPage: true });

    // 5. Check what's visible in the pipeline panel
    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    const pipelinePanelVisible = await pipelinePanel.isVisible().catch(() => false);

    // 6. Also try selecting a job first (click a job card to set selectedJobId)
    // Switch back to jobs tab
    const jobsTab = page.locator('[data-testid="data-panel-tab-jobs"]');
    await jobsTab.click();
    await page.waitForTimeout(500);

    // Look for any clickable job card
    const jobCard = page.locator('[data-testid^="job-card-"]').first();
    const jobCardExists = await jobCard.isVisible().catch(() => false);

    if (jobCardExists) {
      await jobCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-03-after-job-click.png`, fullPage: true });
    } else {
      // Try job list row instead
      const jobRow = page.locator('[data-testid^="job-row-"]').first();
      const jobRowExists = await jobRow.isVisible().catch(() => false);
      if (jobRowExists) {
        await jobRow.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-03-after-job-click.png`, fullPage: true });
      }
    }

    // Check pipeline panel after selecting a job
    const pipelinePanel2 = page.locator('[data-testid="pipeline-panel"]');
    const pipelinePanelVisible2 = await pipelinePanel2.isVisible().catch(() => false);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-04-pipeline-with-job.png`, fullPage: true });

    // Log all errors
    console.log("\n=== CONSOLE ERRORS ===");
    consoleErrors.forEach((e) => console.log(e));
    console.log(`Total console errors: ${consoleErrors.length}`);

    console.log("\n=== PAGE ERRORS (uncaught exceptions) ===");
    pageErrors.forEach((e) => console.log(e));
    console.log(`Total page errors: ${pageErrors.length}`);

    console.log("\n=== PIPELINE PANEL STATUS ===");
    console.log(`Pipeline panel visible (no job selected): ${pipelinePanelVisible}`);
    console.log(`Pipeline panel visible (after job selected): ${pipelinePanelVisible2}`);

    // Get page content if there's an error overlay
    const nextError = page.locator('#__next-build-error, [data-nextjs-dialog], [data-nextjs-container-errors-pseudo-html]');
    if (await nextError.isVisible().catch(() => false)) {
      const errorText = await nextError.textContent();
      console.log("\n=== NEXT.JS ERROR OVERLAY ===");
      console.log(errorText);
    }
  });

  test("navigate directly to /job/1/pipeline", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(`[pageerror] ${err.message}\n${err.stack}`);
    });

    // Navigate directly to pipeline URL
    const response = await page.goto("/job/1/pipeline", { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    console.log(`\n=== HTTP STATUS: ${status} ===`);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-05-direct-nav.png`, fullPage: true });

    // Check for error overlay
    const nextError = page.locator('#__next-build-error, [data-nextjs-dialog], [data-nextjs-container-errors-pseudo-html]');
    if (await nextError.isVisible().catch(() => false)) {
      const errorText = await nextError.textContent();
      console.log("\n=== NEXT.JS ERROR OVERLAY ===");
      console.log(errorText);
    }

    // Check for the pipeline panel in the sidebar
    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    const pipelineVisible = await pipelinePanel.isVisible().catch(() => false);
    console.log(`Pipeline panel visible: ${pipelineVisible}`);

    // Check for a pipeline-page (full page component)
    const pipelinePage = page.locator('[data-testid="pipeline-page"]');
    const pipelinePageVisible = await pipelinePage.isVisible().catch(() => false);
    console.log(`Pipeline page visible: ${pipelinePageVisible}`);

    // Get page body text to see if there's an error message
    const bodyText = await page.locator("body").textContent();
    if (bodyText && (bodyText.includes("Error") || bodyText.includes("error") || bodyText.includes("not found"))) {
      console.log("\n=== PAGE BODY (contains error-like text) ===");
      console.log(bodyText?.substring(0, 2000));
    }

    // Log all errors
    console.log("\n=== CONSOLE ERRORS ===");
    consoleErrors.forEach((e) => console.log(e));
    console.log(`Total console errors: ${consoleErrors.length}`);

    console.log("\n=== PAGE ERRORS (uncaught exceptions) ===");
    pageErrors.forEach((e) => console.log(e));
    console.log(`Total page errors: ${pageErrors.length}`);
  });

  test("navigate directly to /job/2/pipeline (Product Designer)", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[console.error] ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(`[pageerror] ${err.message}\n${err.stack}`);
    });

    const response = await page.goto("/job/2/pipeline", { waitUntil: "networkidle" });
    const status = response?.status() ?? 0;
    console.log(`\n=== HTTP STATUS: ${status} ===`);

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/debug-pipeline-06-job2-pipeline.png`, fullPage: true });

    // Check for error overlay
    const nextError = page.locator('#__next-build-error, [data-nextjs-dialog], [data-nextjs-container-errors-pseudo-html]');
    if (await nextError.isVisible().catch(() => false)) {
      const errorText = await nextError.textContent();
      console.log("\n=== NEXT.JS ERROR OVERLAY ===");
      console.log(errorText);
    }

    const pipelinePanel = page.locator('[data-testid="pipeline-panel"]');
    const pipelineVisible = await pipelinePanel.isVisible().catch(() => false);
    console.log(`Pipeline panel visible: ${pipelineVisible}`);

    console.log("\n=== CONSOLE ERRORS ===");
    consoleErrors.forEach((e) => console.log(e));
    console.log(`Total console errors: ${consoleErrors.length}`);

    console.log("\n=== PAGE ERRORS (uncaught exceptions) ===");
    pageErrors.forEach((e) => console.log(e));
    console.log(`Total page errors: ${pageErrors.length}`);
  });
});
