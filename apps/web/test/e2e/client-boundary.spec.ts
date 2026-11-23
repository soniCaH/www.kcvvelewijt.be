import { expect, test } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";
import { waitForHydrated } from "./helpers/hydration";

// A 'use client' file exports components and types only (#3839, lint rule
// `kcvv/use-client-exports`). The footer's "Cookie-instellingen" button is the
// one place two client modules share a runtime value: the button reads
// `cookieConsentState.ready`, which the banner sets once CookieConsent.run()
// resolves. This runs against `next build && next start` (the e2e webServer),
// the only build where a value that went through a client reference instead of
// the module itself would show: the click would do nothing.

test("the footer's Cookie-instellingen button opens the preferences modal", async ({
  page,
}) => {
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
