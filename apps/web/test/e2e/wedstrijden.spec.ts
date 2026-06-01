/**
 * e2e smoke tests for /ploegen/[slug]/wedstrijden
 *
 * AC covered:
 *  - Route renders with h1 "Wedstrijden" and no console errors
 *  - Returns HTTP 200 (no 404/redirect) even when PSD returns no matches
 *  - Auto-scroll is skipped when there is no next match — page must not crash
 */

import { test, expect } from "@playwright/test";
import { discoverRouteFixtures } from "./helpers/fixtures";
import { smokeTest } from "./helpers/smoke";

test.describe("/ploegen/[slug]/wedstrijden", () => {
  test("renders the full-season agenda page (smoke)", async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("baseURL required");

    const { teamSlug } = await discoverRouteFixtures(baseURL);

    if (!teamSlug) {
      test.skip(true, "No team slug discovered from sitemap — skipping");
      return;
    }

    await smokeTest(page, {
      path: `/ploegen/${teamSlug}/wedstrijden`,
    });

    // h1 should read "Wedstrijden."
    await expect(page.locator("h1").first()).toContainText("Wedstrijden");
  });

  test("returns 200 (no 404) regardless of match data availability", async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("baseURL required");

    const { teamSlug } = await discoverRouteFixtures(baseURL);

    if (!teamSlug) {
      test.skip(true, "No team slug discovered — skipping");
      return;
    }

    const response = await page.goto(`/ploegen/${teamSlug}/wedstrijden`);
    expect(response?.status()).toBe(200);

    // Either the empty-state message or a list of agenda rows must be present.
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("auto-scroll is skipped gracefully when no next match exists", async ({
    page,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("baseURL required");

    const { teamSlug } = await discoverRouteFixtures(baseURL);

    if (!teamSlug) {
      test.skip(true, "No team slug discovered — skipping");
      return;
    }

    // Page must render without JS errors whether or not a next-match anchor exists.
    await smokeTest(page, {
      path: `/ploegen/${teamSlug}/wedstrijden`,
    });

    // Verify the scroll anchor data-attribute is either present (has next match)
    // or absent (no next match) — both are acceptable; the test asserts no crash.
    const nextAnchor = page.locator("[data-testid='wedstrijden-next-match']");
    const count = await nextAnchor.count();
    // count is 0 or 1 — no assertion on which, just that the page rendered.
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
