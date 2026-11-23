import { expect, test } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";
import { waitForHydrated } from "./helpers/hydration";

// Smoke test for the modules split out of 'use client' files in #3839: the footer's
// "Cookie-instellingen" button reads `cookieConsentState.ready`, which the banner sets once
// CookieConsent.run() resolves, and both now import it from a plain module. This runs
// against `next build && next start` (the e2e webServer) and proves the production bundle
// still wires the two together. It does NOT prove the server-to-client boundary: the button
// and the banner are both client components, so moving the flag back into the banner would
// still pass. The lint rule `kcvv/use-client-exports` guards that; no route renders a
// Server Component that reads one of these values reliably enough for e2e (the one case,
// `UP_LINK_TOP_AIR` in `PageHeroSkeleton`, only renders in a `loading.tsx` fallback).

test("the footer's Cookie-instellingen button opens the preferences modal", async ({
  page,
}) => {
  // vanilla-cookieconsent builds no modal for a webdriver (`hideFromBots`), so
  // Playwright would see a banner that never mounts.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  await gotoBounded(page, "/privacy");
  const button = page.getByRole("button", { name: "Cookie-instellingen" });
  await waitForHydrated(button);

  // The click is a no-op until the banner's CookieConsent.run() resolves, so
  // retry the click+assert pair rather than guess when that happens.
  await expect(async () => {
    await button.click();
    await expect(page.locator("html")).toHaveClass(/show--preferences/, {
      timeout: 1_000,
    });
  }).toPass();
});
