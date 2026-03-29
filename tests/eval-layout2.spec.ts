import { test, expect } from "@playwright/test";

/**
 * LAYOUT-2 Evaluation — Dark theme app shell with design tokens
 *
 * Validates that the dashboard page correctly implements the
 * "Industrial Clarity" design system as specified in PRODUCT_SPEC.md:
 *   - Dark surface background (#0D0D0D)
 *   - Accent-primary (#D4FF00) present
 *   - Card surfaces use surface-secondary (#1A1A1A)
 *   - Fonts: Space Grotesk, Inter, JetBrains Mono loaded
 *   - No border-radius exceeding 4px (industrial aesthetic)
 */

// Helper: parse an rgb/rgba string into { r, g, b }
function parseRgb(rgb: string): { r: number; g: number; b: number } | null {
  const match = rgb.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/
  );
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

// Helper: calculate luminance (perceived brightness 0-255)
function luminance(c: { r: number; g: number; b: number }): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

test.describe("LAYOUT-2 — Dark theme app shell with design tokens", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("http://localhost:3000/dashboard", {
      waitUntil: "networkidle",
    });
    // Allow time for fonts to load and hydration to complete
    await page.waitForTimeout(2000);
  });

  test("Screenshot — capture dashboard for visual inspection", async ({
    page,
  }) => {
    await page.screenshot({
      path: "screenshots/layout2-dashboard.png",
      fullPage: true,
    });
    // Just confirm the file was created by checking page loaded
    await expect(page.locator("body")).toBeVisible();
  });

  test("Body background is dark (near #0D0D0D)", async ({ page }) => {
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    const parsed = parseRgb(bgColor);
    expect(parsed).not.toBeNull();

    // #0D0D0D = rgb(13, 13, 13). Accept within tolerance of 10 units per channel.
    expect(parsed!.r).toBeLessThanOrEqual(25);
    expect(parsed!.g).toBeLessThanOrEqual(25);
    expect(parsed!.b).toBeLessThanOrEqual(25);

    // Also verify it's genuinely dark (luminance < 30)
    const lum = luminance(parsed!);
    expect(lum).toBeLessThan(30);
  });

  test("Accent-primary (#D4FF00) color is present on page", async ({
    page,
  }) => {
    // Look for elements with the accent-primary color as background or text color.
    // #D4FF00 = rgb(212, 255, 0)
    const accentElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      let count = 0;
      for (const el of allElements) {
        const styles = window.getComputedStyle(el);
        const bg = styles.backgroundColor;
        const color = styles.color;
        // Check for rgb(212, 255, 0) with tolerance
        const isAccent = (c: string) => {
          const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
          if (!m) return false;
          const r = Number(m[1]),
            g = Number(m[2]),
            b = Number(m[3]);
          return (
            Math.abs(r - 212) <= 10 &&
            Math.abs(g - 255) <= 10 &&
            Math.abs(b - 0) <= 10
          );
        };
        if (isAccent(bg) || isAccent(color)) count++;
      }
      return count;
    });

    // We expect multiple elements with the accent color (buttons, badges, icons, etc.)
    expect(accentElements).toBeGreaterThanOrEqual(1);
  });

  test("Card backgrounds use surface-secondary (#1A1A1A)", async ({
    page,
  }) => {
    // Cards are rendered as elements with bg-surface-secondary.
    // #1A1A1A = rgb(26, 26, 26)
    const cardBgElements = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      let count = 0;
      for (const el of allElements) {
        const bg = window.getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) continue;
        const r = Number(m[1]),
          g = Number(m[2]),
          b = Number(m[3]);
        // Accept within tolerance of 5 from rgb(26, 26, 26)
        if (
          Math.abs(r - 26) <= 5 &&
          Math.abs(g - 26) <= 5 &&
          Math.abs(b - 26) <= 5
        ) {
          count++;
        }
      }
      return count;
    });

    // We expect multiple card/panel elements with this background
    expect(cardBgElements).toBeGreaterThanOrEqual(3);
  });

  test("Fonts loaded — Space Grotesk, Inter, JetBrains Mono in computed styles", async ({
    page,
  }) => {
    // Check that all three font families appear in computed styles somewhere on the page
    const fontCheck = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      let hasSpaceGrotesk = false;
      let hasInter = false;
      let hasJetBrainsMono = false;

      for (const el of allElements) {
        const ff = window.getComputedStyle(el).fontFamily.toLowerCase();
        if (ff.includes("space grotesk") || ff.includes("__Space_Grotesk".toLowerCase()))
          hasSpaceGrotesk = true;
        if (ff.includes("inter") || ff.includes("__Inter".toLowerCase()))
          hasInter = true;
        if (
          ff.includes("jetbrains mono") ||
          ff.includes("jetbrains_mono") ||
          ff.includes("__JetBrains_Mono".toLowerCase())
        )
          hasJetBrainsMono = true;
      }

      return { hasSpaceGrotesk, hasInter, hasJetBrainsMono };
    });

    expect(fontCheck.hasSpaceGrotesk).toBe(true);
    expect(fontCheck.hasInter).toBe(true);
    expect(fontCheck.hasJetBrainsMono).toBe(true);
  });

  test("No border-radius exceeds 4px (industrial aesthetic)", async ({
    page,
  }) => {
    // Spec mandates: "No border-radius (or max 4px)."
    // Exception: pill-shaped primary CTA buttons use rounded-full per spec (allowed).
    const violations = await page.evaluate(() => {
      const allElements = document.querySelectorAll("*");
      const issues: Array<{
        tag: string;
        classes: string;
        radius: string;
        text: string;
      }> = [];

      for (const el of allElements) {
        const styles = window.getComputedStyle(el);
        const br = styles.borderRadius;

        // Parse border-radius values (could be "4px" or "4px 4px 4px 4px" or "9999px")
        const values = br.match(/[\d.]+/g);
        if (!values) continue;

        const maxRadius = Math.max(...values.map(Number));

        // Spec says max 4px for cards. However, the spec also says:
        // "Buttons: Pill-shaped for primary CTA" — so rounded-full buttons are expected.
        if (maxRadius > 4) {
          const htmlEl = el as HTMLElement;
          const tag = htmlEl.tagName.toLowerCase();
          const classes = htmlEl.className || "";

          // Allow pill-shaped CTA buttons (rounded-full) as per spec
          const isPillButton =
            tag === "button" &&
            typeof classes === "string" &&
            classes.includes("rounded-full");

          if (!isPillButton) {
            issues.push({
              tag,
              classes: typeof classes === "string" ? classes.slice(0, 120) : "",
              radius: br,
              text: (htmlEl.textContent || "").slice(0, 50),
            });
          }
        }
      }

      return issues;
    });

    // Report violations for debugging
    if (violations.length > 0) {
      console.log(
        "Border-radius violations (>4px, excluding pill CTA buttons):",
        JSON.stringify(violations, null, 2)
      );
    }

    expect(violations.length).toBe(0);
  });
});
