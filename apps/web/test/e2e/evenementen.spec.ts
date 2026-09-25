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
 * Phase 0.5 testing rework — `docs/prd/page-level-testing-rework.md`). Each
 * test asserts on the pinned fixture event, never on whichever event sorts
 * first (#3149).
 */

import { test, expect } from "@playwright/test";
import { FIXTURES } from "./helpers/fixtures";
import { gotoBounded } from "./helpers/goto";

// Event-doc tickets link to /evenementen/[slug]; article-sourced (articleType
// "event") tickets link to /nieuws/[slug]. Both render as <TicketStub> links.
const TICKET_SELECTOR =
  'main a[href^="/evenementen/"], main a[href^="/nieuws/"]';
// The pinned 2099 `Clubevent` fixture (#3087 §5) — it keeps the upcoming-only
// feed and its Clubevent filter non-empty, so an empty state is a regression.
const FIXTURE_EVENT_PATH = `/evenementen/${FIXTURES.eventSlug}`;
const FIXTURE_TICKET_SELECTOR = `main a[href="${FIXTURE_EVENT_PATH}"]`;

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

    await expect(
      page.getByRole("group", { name: /Filter evenementen op type/i }),
    ).toBeVisible();
    await expect(page.locator(FIXTURE_TICKET_SELECTOR)).toBeVisible();
  });

  test("a type filter narrows the feed", async ({ page }) => {
    const tickets = page.locator(TICKET_SELECTOR);
    // `.count()` does not auto-wait — settle on the fixture ticket first.
    await expect(page.locator(FIXTURE_TICKET_SELECTOR)).toBeVisible();
    const allCount = await tickets.count();

    // Single-select filter — picking one type can only narrow the set.
    const clubChip = page.getByRole("button", {
      name: "Clubevent",
      exact: true,
    });
    await clubChip.click();
    await expect(clubChip).toHaveAttribute("aria-pressed", "true");

    await expect(page.locator(FIXTURE_TICKET_SELECTOR)).toBeVisible();
    expect(await tickets.count()).toBeLessThanOrEqual(allCount);
  });

  test("a ticket opens its detail page, which exposes the agenda CTA", async ({
    page,
  }) => {
    await page.locator(FIXTURE_TICKET_SELECTOR).click();

    await expect(page).toHaveURL(new RegExp(`${FIXTURE_EVENT_PATH}/?$`));
    await expect(page.locator("h1").first()).toBeVisible();
    // The "＋ Zet in agenda" CTA is always present (the .ics download); the
    // ＋ glyph is aria-hidden, so the accessible name is just the label.
    await expect(
      page.getByRole("button", { name: "Zet in agenda" }),
    ).toBeVisible();
  });
});
