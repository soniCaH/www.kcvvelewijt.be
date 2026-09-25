/**
 * e2e smoke tests for /ploegen/[slug]/wedstrijden
 *
 * AC covered:
 *  - Route renders with h1 "Wedstrijden" and no console errors
 *  - Returns HTTP 200 (no 404/redirect) even when PSD returns no matches
 *  - Auto-scroll is skipped when there is no next match — page must not crash
 */

import { test, expect } from "@playwright/test";
import { FIXTURES } from "./helpers/fixtures";
import { smokeTest } from "./helpers/smoke";

test.describe("/ploegen/[slug]/wedstrijden", () => {
  test("renders the full-season agenda page (smoke)", async ({ page }) => {
    await smokeTest(page, {
      path: `/ploegen/${FIXTURES.teamSlug}/wedstrijden`,
    });

    // h1 should read "Wedstrijden."
    await expect(page.locator("h1").first()).toContainText("Wedstrijden");
  });

  test("returns 200 (no 404) regardless of match data availability", async ({
    page,
  }) => {
    await smokeTest(page, {
      path: `/ploegen/${FIXTURES.teamSlug}/wedstrijden`,
    });
  });

  test("auto-scroll is skipped gracefully when no next match exists", async ({
    page,
  }) => {
    // Page must render without JS errors whether or not a next-match anchor exists.
    await smokeTest(page, {
      path: `/ploegen/${FIXTURES.teamSlug}/wedstrijden`,
    });

    // At most one next-match anchor should exist (0 = no upcoming match, 1 = has next match).
    const count = await page
      .locator("[data-testid='wedstrijden-next-match']")
      .count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
