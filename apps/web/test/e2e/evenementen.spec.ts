/**
 * e2e for the merged /evenementen events feed (Phase 6.E).
 *
 * AC covered (#1969):
 *  - list renders (h1 + colour-coded filter bar + at least one ticket)
 *  - a type filter narrows the feed (single-select; can only shrink the set)
 *  - a ticket navigates to its detail page (event docs → /evenementen/[slug])
 *  - the detail page exposes the always-present "Zet in agenda" CTA
 *
 * Runs against the real Next.js app (the page-level coverage layer per the
 * Phase 0.5 testing rework — `docs/prd/page-level-testing-rework.md`). Tickets
 * are found via the DOM rather than the sitemap so the spec is resilient to the
 * exact upcoming-event set on the dataset.
 */

import { test, expect } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";

// Event-doc tickets link to /evenementen/[slug]; article-sourced (articleType
// "event") tickets link to /nieuws/[slug]. Both render as <TicketStub> links.
const TICKET_SELECTOR =
  'main a[href^="/evenementen/"], main a[href^="/nieuws/"]';

test.describe("/evenementen", () => {
  // Relative goto resolves against the config `baseURL`; every test starts on
  // the list, so a single beforeEach covers them all.
  test.beforeEach(async ({ page }) => {
    await gotoBounded(page, "/evenementen");
  });

  test("renders the month-grouped list with the filter bar and at least one ticket", async ({
    page,
  }) => {
    await expect(page.locator("h1").first()).toContainText("Evenementen");

    // The feed is upcoming-only, but the pinned 2099 fixture event
    // (`FIXTURES.eventSlug`) keeps it non-empty, so the empty state is a
    // regression here, not a valid outcome (#3087 §5–§6).
    const filterBar = page.getByRole("group", {
      name: /Filter evenementen op type/i,
    });
    await expect(filterBar).toBeVisible();
    expect(await page.locator(TICKET_SELECTOR).count()).toBeGreaterThan(0);
  });

  test("a type filter narrows the feed (or shows the per-type empty state)", async ({
    page,
  }) => {
    const tickets = page.locator(TICKET_SELECTOR);
    // `.count()` does not auto-wait — settle on a rendered ticket first.
    await expect(
      tickets.first(),
      "no upcoming events on the dataset",
    ).toBeVisible();
    const allCount = await tickets.count();

    // Single-select filter — picking one type can only narrow the set.
    const clubChip = page.getByRole("button", {
      name: "Clubevent",
      exact: true,
    });
    await clubChip.click();
    await expect(clubChip).toHaveAttribute("aria-pressed", "true");

    const emptyForType = page.getByText(/Geen evenementen in de categorie/i);
    if (await emptyForType.isVisible()) {
      // No Clubevents upcoming → the reset affordance must be offered.
      await expect(
        page.getByRole("button", { name: /Toon alles/i }),
      ).toBeVisible();
    } else {
      expect(await tickets.count()).toBeLessThanOrEqual(allCount);
    }
  });

  test("a ticket opens its detail page, which exposes the agenda CTA", async ({
    page,
  }) => {
    // Pick an event-doc ticket so we land on a /evenementen/[slug] detail page
    // (article tickets intentionally route to /nieuws/[slug] instead).
    const eventTicket = page.locator('main a[href^="/evenementen/"]').first();
    await expect(eventTicket, "no event-doc tickets in the feed").toBeVisible();

    const href = await eventTicket.getAttribute("href");
    await eventTicket.click();

    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
    await expect(page.locator("h1").first()).toBeVisible();
    // The "＋ Zet in agenda" CTA is always present (the .ics download); the
    // ＋ glyph is aria-hidden, so the accessible name is just the label.
    await expect(
      page.getByRole("button", { name: "Zet in agenda" }),
    ).toBeVisible();
  });
});
