import { expect, test, type Locator, type Page } from "@playwright/test";

// #2584 — "the sticky section nav is chrome, not content" (#2478's full
// resolution). Two invariants only a real browser can confirm (the map's own
// testing decisions single out runtime geometry as e2e-only):
//
//  1. Scroll-spy produces the right active chip — the fill means "the
//     section being read", not "the one last clicked" (rule 3).
//  2. An anchor jump — a click, or a hash landed on directly — lands the
//     target section BELOW the sticky bar, at an offset derived from the
//     bar's own measured height (rule 7), never behind it.
//
// 3 routes, per the decision's own scope: `/ploegen/[slug]` and `/hulp` each
// carry a section nav; `/jeugd#visie` carries none, so it exercises
// `globals.css`'s header-only `scroll-padding-top` base rule instead.

let teamSlugWithNav: string | null = null;

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error("playwright config baseURL is required");
  }

  const sitemapResponse = await fetch(`${baseURL}/sitemap.xml`);
  if (!sitemapResponse.ok) {
    throw new Error(
      `Failed to fetch sitemap.xml: ${sitemapResponse.status} ${sitemapResponse.statusText}`,
    );
  }
  const sitemapXml = await sitemapResponse.text();
  const teamSlugs = Array.from(
    sitemapXml.matchAll(/<loc>\s*[^<]*\/ploegen\/([a-z0-9-]+)\s*<\/loc>/g),
    (m) => m[1]!,
  );
  if (teamSlugs.length === 0) {
    throw new Error(
      "sitemap.xml carries zero /ploegen/[slug] entries — every test below " +
        "would silently skip and this suite would still report green.",
    );
  }

  // Not every team ships the nav today (it auto-hides at ≤1 section — #2444/
  // #2478's pre-season blindness). Scan for one that does rather than
  // assuming the sitemap's first entry — routinely a senior side with none.
  for (const slug of teamSlugs) {
    const res = await fetch(`${baseURL}/ploegen/${slug}`);
    if (!res.ok) continue;
    const html = await res.text();
    if (html.includes('data-testid="team-section-nav"')) {
      teamSlugWithNav = slug;
      break;
    }
  }
});

/** Reads the bar's own bottom edge in viewport coordinates. */
async function stickyBarBottom(page: Page, testId: string) {
  return stickyBarBottomFromLocator(page.getByTestId(testId));
}

/**
 * Same as `stickyBarBottom`, but for a bar reached by locator rather than
 * `data-testid` — the organigram nav has none, so its tests locate it by
 * role `navigation` + accessible name instead (see the scroll-spy test
 * above). Shared here once this became a third call site for the same
 * bounding-box arithmetic.
 */
async function stickyBarBottomFromLocator(bar: Locator) {
  const box = await bar.boundingBox();
  if (!box) throw new Error("sticky bar has no bounding box");
  return box.y + box.height;
}

/**
 * Waits until `window.scrollY` has stopped changing for a short quiet
 * period, rather than a fixed timeout. A fixed wait can read the geometry
 * mid-animation and pass "by accident": a bar that grows *after* a native
 * smooth-scroll already started (e.g. `<HubSearch>` mounting once the hero
 * leaves view) keeps scrolling well past 600ms, and an earlier version of
 * this spec that waited a flat 600ms observed an intermediate,
 * still-in-flight position instead of where the page actually settles —
 * measured on `/hulp` at 375px, where the settle takes closer to 900ms.
 */
async function waitForScrollSettled(page: Page) {
  await page.waitForFunction(
    () => {
      const w = window as unknown as {
        __scrollSettleY?: number;
        __scrollSettleAt?: number;
      };
      const y = window.scrollY;
      const now = performance.now();
      if (w.__scrollSettleY !== y) {
        w.__scrollSettleY = y;
        w.__scrollSettleAt = now;
        return false;
      }
      return now - (w.__scrollSettleAt ?? now) > 250;
    },
    undefined,
    { timeout: 5000, polling: 50 },
  );
}

test.describe("scroll-spy fills the chip that is actually being read (#2478 rule 3)", () => {
  test("TeamSectionNav on /ploegen/[slug]", async ({ page }) => {
    test.skip(
      !teamSlugWithNav,
      "no team in the sitemap renders TeamSectionNav today (pre-season)",
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/ploegen/${teamSlugWithNav}`);

    const nav = page.getByTestId("team-section-nav");
    const links = nav.getByRole("link");
    const count = await links.count();
    test.skip(count < 2, "fewer than two sections render — nothing to spy on");

    const lastLink = links.nth(count - 1);
    const lastHref = await lastLink.getAttribute("href");
    const targetId = lastHref!.slice(1);

    // Explicit `block: "start"` rather than `scrollIntoViewIfNeeded()` — the
    // latter scrolls the *minimum* distance needed, which for a short
    // trailing section can leave it short of the spy's `-55%` bottom band
    // entirely, so `aria-current` never appears.
    await page
      .locator(`#${targetId}`)
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    // The scroll-spy IntersectionObserver settles asynchronously.
    await expect(lastLink).toHaveAttribute("aria-current", "location");

    // No other chip is also marked active — the fill is exclusive.
    for (let i = 0; i < count - 1; i++) {
      await expect(links.nth(i)).not.toHaveAttribute("aria-current");
    }
  });

  test("OrganigramSectionNav on /hulp", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/hulp");

    // "Hulp" and "Structuur" both also appear in the global header/footer —
    // scope to the section nav's own landmark so this asserts the chip, not
    // an unrelated nav link that happens to share a name.
    const nav = page.getByRole("navigation", { name: "Secties van de hub" });
    const structuur = nav.getByRole("link", { name: "Structuur" });
    const hulp = nav.getByRole("link", { name: "Hulp" });

    await page
      .locator("#structuur")
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(structuur).toHaveAttribute("aria-current", "location");
    await expect(hulp).not.toHaveAttribute("aria-current");

    // Scrolling back up flips the fill again — it tracks reading position on
    // every pass, not just the first jump.
    await page
      .locator("#hulp")
      .evaluate((el) => el.scrollIntoView({ block: "start" }));
    await expect(hulp).toHaveAttribute("aria-current", "location");
    await expect(structuur).not.toHaveAttribute("aria-current");
  });
});

test.describe("an anchor jump lands below the bar, at the derived offset (#2478 rule 7)", () => {
  test("clicking a TeamSectionNav chip lands its section below the bar", async ({
    page,
  }) => {
    test.skip(
      !teamSlugWithNav,
      "no team in the sitemap renders TeamSectionNav today (pre-season)",
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/ploegen/${teamSlugWithNav}`);

    const nav = page.getByTestId("team-section-nav");
    const links = nav.getByRole("link");
    const count = await links.count();
    test.skip(count < 1, "no sections render");

    const lastLink = links.nth(count - 1);
    const href = await lastLink.getAttribute("href");
    const targetId = href!.slice(1);

    await lastLink.click();
    await waitForScrollSettled(page);

    const barBottom = await stickyBarBottom(page, "team-section-nav");
    const targetTop = await page
      .locator(`#${targetId}`)
      .evaluate((el) => el.getBoundingClientRect().top);

    // A couple of px of slack for sub-pixel rounding — never behind the bar.
    expect(targetTop).toBeGreaterThanOrEqual(barBottom - 2);

    // The geometry check above only proves the target isn't hidden BEHIND
    // the bar — a scroll that stalled well SHORT of the target (never
    // reaching it at all) leaves `targetTop` even further below the
    // viewport, which trivially satisfies that same assertion (#2640
    // review, finding 1: the old `chip.scrollIntoView` implementation
    // reissued a fresh, short root-scroll on every scroll-spy `activeId`
    // change mid-animation, repeatedly truncating this exact click's
    // native smooth scroll before it ever reached `lastLink`'s target — a
    // regression this geometry-only assertion would NOT have caught).
    // Asserting scroll-spy's own fill against the clicked chip closes
    // that gap: if the scroll had stalled at an earlier section, THAT
    // section's chip — not `lastLink` — would still be the one marked
    // active once settled.
    await expect(lastLink).toHaveAttribute("aria-current", "location");
  });

  test("clicking an OrganigramSectionNav door lands its section below the bar, even once HubSearch mounts mid-scroll", async ({
    page,
  }) => {
    // 375px is where `<HubSearch>` reveals as its own wrapped row once the
    // hero scrolls out of view — the exact mid-scroll bar-growth race that
    // makes this landing worth its own test (measured on this route at
    // this width).
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/hulp");

    const nav = page.getByRole("navigation", { name: "Secties van de hub" });
    await nav.getByRole("link", { name: "Structuur" }).click();
    await waitForScrollSettled(page);

    const barBottom = await stickyBarBottomFromLocator(nav);

    const targetTop = await page
      .locator("#structuur")
      .evaluate((el) => el.getBoundingClientRect().top);

    expect(targetTop).toBeGreaterThanOrEqual(barBottom - 2);
  });

  test("a cold load with a hash already in the URL, on a route that HAS a section nav, still lands below the bar", async ({
    page,
  }) => {
    // The hand-written `scroll-mt-*` fallbacks this ticket deletes used to
    // cover a hard/cold load's pre-hydration jump. The derived offset only
    // exists once this hook's effect has run, so this is the regression
    // test for that gap — on a route that actually has a nav, not
    // `/jeugd#visie` (which has none).
    test.skip(
      !teamSlugWithNav,
      "no team in the sitemap renders TeamSectionNav today (pre-season)",
    );
    await page.setViewportSize({ width: 1280, height: 900 });

    // Discover a real section id first (a fresh, unscrolled load).
    await page.goto(`/ploegen/${teamSlugWithNav}`);
    const nav = page.getByTestId("team-section-nav");
    const links = nav.getByRole("link");
    const count = await links.count();
    test.skip(count < 1, "no sections render");
    const targetId = (await links.nth(count - 1).getAttribute("href"))!.slice(
      1,
    );

    await page.goto(`/ploegen/${teamSlugWithNav}#${targetId}`);
    await waitForScrollSettled(page);

    const barBottom = await stickyBarBottom(page, "team-section-nav");
    const targetTop = await page
      .locator(`#${targetId}`)
      .evaluate((el) => el.getBoundingClientRect().top);

    expect(targetTop).toBeGreaterThanOrEqual(barBottom - 2);
  });

  test("a cold load with a hash already in the URL on /hulp still lands below the bar, even once HubSearch mounts mid-scroll", async ({
    page,
  }) => {
    // /hulp is the route this cold-load path actually needed guarding on:
    // its nav always renders (its sections are static, no pre-season
    // skip), and <HubSearch> mounting mid-scroll once the hero leaves view
    // is the exact bar-growth race the correction hook exists for (see the
    // click variant of this test above). The /ploegen cold-load test above
    // covers the same code path on a route whose nav can disable itself;
    // this one can't skip itself the same way.
    //
    // 375px is where <HubSearch> reveals as its own wrapped row — the same
    // width the sibling click test above uses, for the same reason.
    await page.setViewportSize({ width: 375, height: 800 });

    // Cold load: the hash is already in the URL on `goto`, not set via a
    // click or `window.location.hash` after load — a same-page hash change
    // only *arms* the correction hook, it does not also correct, so only a
    // true cold load exercises the "arm and correct immediately" branch
    // (see `useHashLandingCorrection`'s wiring comment).
    await page.goto("/hulp#structuur");
    await waitForScrollSettled(page);

    const nav = page.getByRole("navigation", { name: "Secties van de hub" });
    const barBottom = await stickyBarBottomFromLocator(nav);
    const targetTop = await page
      .locator("#structuur")
      .evaluate((el) => el.getBoundingClientRect().top);

    // A couple of px of slack for sub-pixel rounding — never behind the bar.
    expect(targetTop).toBeGreaterThanOrEqual(barBottom - 2);

    // The geometry check above only proves the target isn't hidden BEHIND
    // the bar — a scroll that stalled well SHORT of the target (never
    // reaching it at all) leaves `targetTop` even further below the
    // viewport, which trivially satisfies that same assertion (the same gap
    // #2640's review, finding 1, closed for the click variant above — a
    // manual run of this test with the correction disabled reproduced it
    // here too: the cold load stalled at a much earlier scroll position,
    // which this assertion alone did not catch). Asserting scroll-spy's own
    // fill against `#structuur` closes it the same way: only a landing that
    // actually reached the section marks its chip active.
    const structuur = nav.getByRole("link", { name: "Structuur" });
    await expect(structuur).toHaveAttribute("aria-current", "location");
  });

  test("/jeugd#visie — no section nav on this route, lands below the header alone", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/jeugd#visie");
    await waitForScrollSettled(page);

    const header = page.locator("header").first();
    const headerBox = await header.boundingBox();
    if (!headerBox) throw new Error("header has no bounding box");

    const targetTop = await page
      .locator("#visie")
      .evaluate((el) => el.getBoundingClientRect().top);

    expect(targetTop).toBeGreaterThanOrEqual(
      headerBox.y + headerBox.height - 2,
    );
  });
});
