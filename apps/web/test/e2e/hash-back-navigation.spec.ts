/**
 * e2e: Back after a plain `#hash` link leaves the page (#3501)
 *
 * A section chip writes `#spelers` natively, so the browser's history entry
 * carries no Next router state. Before `<HashHistorySync>`, Back from a player
 * onto that entry changed the URL to the team page but kept the player page
 * on screen. Unit tests stub `replaceState`; only a real browser runs Next's
 * patched one, so this is the check that the fix holds across Next upgrades.
 */

import { test, expect } from "@playwright/test";
import { FIXTURES } from "./helpers/fixtures";

test("Back after a section chip and a player returns to the team page", async ({
  page,
}) => {
  await page.goto(`/ploegen/${FIXTURES.teamSlug}`);
  const teamHeading = page.locator("h1").first();
  const teamTitle = (await teamHeading.textContent()) ?? "";
  expect(teamTitle).not.toBe("");

  await page.locator('a[href="#spelers"]:visible').first().click();
  await expect(page).toHaveURL(/#spelers$/);

  await page.locator('#spelers a[href^="/spelers/"]').first().click();
  await expect(page).toHaveURL(/\/spelers\//);
  await expect(teamHeading).not.toHaveText(teamTitle);

  await page.goBack();
  await expect(page).toHaveURL(
    new RegExp(`/ploegen/${FIXTURES.teamSlug}#spelers$`),
  );
  await expect(teamHeading).toHaveText(teamTitle);
});
