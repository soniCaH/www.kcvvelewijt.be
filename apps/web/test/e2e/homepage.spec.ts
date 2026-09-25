import { expect, test } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";

// Phase 4.D.2 (#1681) + Phase 4.5.C.1 (#1754) — Playwright e2e
// regression for the assembled homepage. The carousel was retired in
// 4.5.C.1: the hero is now a single static `<EditorialHero>` plus a
// 3-up `<FeaturedUitgelichtRow>`. Auto-rotation, thumb-strip, and
// pause-button tests have been removed; the integration here covers
// (a) page renders 200 with the new spine order, (b) UpcomingMatches
// expand-collapse, (c) sponsor-logo greyscale/hover.
//
// The component-level Vitest + Storybook test-runner suites cover the
// behaviour of each homepage section in isolation. This spec exercises
// the **integration**: that page.tsx wires every section in the right
// order on `/` and that the cross-component interactions work against
// real CMS data.
//
// Section selectors lean on aria labels and roles set inside each
// component so the suite stays robust if the visual chrome shifts. A
// section that is missing fails the test, it never skips it: the suite
// runs against the pinned `staging` dataset, so missing data is a
// regression (#3087 §6, #3149).

test.describe("/ homepage integration (Phase 4.5.C.1)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoBounded(page, "/");
  });

  test("renders the page without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await gotoBounded(page, "/");
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("renders the R4.B spine ordering — clubshop closes the page after sponsors", async ({
    page,
  }) => {
    // Sections are identified by their aria-labels (set inside each
    // component). The R4.B-locked ordering on `/` is:
    //   hero → uitgelicht → event band → banner → news → upcoming →
    //   banner → youth → banner → sponsors → clubshop
    const sponsorsRegion = page.getByRole("region", { name: /onze sponsors/i });
    const clubshopRegion = page
      .getByRole("region", { name: /^clubshop$/i })
      .first();

    await expect(sponsorsRegion, "sponsors section").toBeVisible();
    await expect(clubshopRegion, "clubshop banner").toBeVisible();

    const sponsorsIndex = await sponsorsRegion.evaluate((el) =>
      Array.from(document.querySelectorAll("section, [role='region']")).indexOf(
        el,
      ),
    );
    const clubshopIndex = await clubshopRegion.evaluate((el) =>
      Array.from(document.querySelectorAll("section, [role='region']")).indexOf(
        el,
      ),
    );
    expect(sponsorsIndex).toBeGreaterThanOrEqual(0);
    expect(clubshopIndex).toBeGreaterThan(sponsorsIndex);
  });

  test("upcoming matches: expand button reveals all matches", async ({
    page,
  }) => {
    // Scoped to the agenda block: `<FirstTeamsBlock>` carries its own,
    // permanently visible "Volledige kalender" link, so a page-wide locator
    // never reads 0 no matter what this block does.
    const agenda = page.getByRole("region", { name: "Komende wedstrijden" });

    const expandButton = agenda.getByRole("button", {
      name: /toon alle \d+ wedstrijden/i,
    });
    await expect(
      expandButton,
      "fewer than 6 upcoming matches — no expand button",
    ).toBeVisible();

    // The /kalender link is hidden in the collapsed state.
    const kalenderLink = agenda.getByRole("link", {
      name: /volledige kalender/i,
    });
    await expect(kalenderLink).toHaveCount(0);

    await expandButton.click();

    // After expand: button disappears, /kalender link appears.
    await expect(expandButton).toHaveCount(0);
    await expect(kalenderLink).toBeVisible();
    await expect(kalenderLink).toHaveAttribute("href", "/kalender");
  });

  test("hovering the hero never opens a horizontal scrollbar, at three widths, and the sticky header keeps sticking (#2912)", async ({
    page,
  }) => {
    // Root cause: the homepage hero wraps in a full-bleed <Link> carrying
    // the canonical press-down (translate +4px right/down on hover). A
    // translated box still counts toward `scrollWidth`, so without
    // containment the page grew 4px of horizontal scroll on every hover.
    // Fix: `overflow-x: clip` on BOTH `<html>` and `<body>` in the root
    // layout — `clip`, never `hidden` (a scroll container `hidden` creates
    // would break the sticky <SiteHeader> positioning against it). Widths
    // below are the ones measured live against production in the issue's
    // own "Agent Brief" comment (885px, 1497px) plus one narrower case —
    // the hero link is exactly viewport-width at every size, so there is
    // no breakpoint threshold, any width reproduces the bug pre-fix.
    for (const width of [400, 885, 1497]) {
      await page.setViewportSize({ width, height: 900 });
      await gotoBounded(page, "/");

      // `[data-testid="homepage-hero-link"]` (set on the <Link> itself in
      // EditorialHero.tsx), not `main a[href^="/nieuws/"]` + `.first()` —
      // that selector also matches every <NewsCard>/<FeaturedUitgelichtRow>
      // link on this page, and `.first()` staying accidentally correct
      // depends entirely on today's spine ordering. If the hero ever
      // stopped rendering as a <Link>, `count()` would still find a news
      // card, the check below would pass anyway, and this test would hover a
      // news card while claiming to test the hero.
      const heroLink = page.locator('[data-testid="homepage-hero-link"]');
      await expect(heroLink, "homepage hero article").toBeVisible();

      await heroLink.hover();
      await page.waitForTimeout(400); // let the 300ms press-down settle

      // scrollWidth alone can look inflated even when an ancestor clips the
      // overflow (clip doesn't shrink reported content extent, only what's
      // reachable) — so also try to actually scroll sideways, which is
      // what a real horizontal scrollbar would let a visitor do.
      const scrollXAfterAttempt = await page.evaluate(() => {
        const before = window.scrollX;
        window.scrollTo({ left: 50, behavior: "instant" });
        const after = window.scrollX;
        window.scrollTo({ left: before, behavior: "instant" });
        return after;
      });
      expect(scrollXAfterAttempt, `width ${width}px`).toBe(0);
    }

    // Sticky header: scroll the page and confirm the header stays pinned
    // at the viewport top rather than scrolling away with the page — the
    // regression `overflow: hidden` (instead of `clip`) would cause (it
    // parks the header at y:-1200 here, not y:0).
    //
    // Read the scroll position and the header's position in the SAME
    // evaluate, and assert the page really scrolled before trusting the
    // header's position at all: a header read at y:0 passes whether it is
    // sticky or not, which is exactly the failure this assertion exists to
    // catch. This used to need a 20-attempt retry loop because
    // `<ScrollToTop>` reset scrollY to 0 on hydration, and `page.goto()`'s
    // default `waitUntil: "load"` resolves before an App Router page
    // hydrates — that reset is gone (#2986), so one scroll holds.
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoBounded(page, "/");
    const { scrollY, headerTop } = await page.evaluate(() => {
      window.scrollTo({ top: 1200, behavior: "instant" });
      const header = document.querySelector("header");
      return {
        scrollY: window.scrollY,
        headerTop: header ? header.getBoundingClientRect().top : null,
      };
    });
    expect(scrollY, "the page should have actually scrolled").toBeGreaterThan(
      0,
    );
    expect(
      headerTop,
      "sticky header should stay pinned at the viewport top",
    ).toBe(0);
  });

  test("sponsors block: logo tiles greyscale by default and resolve to colour on hover", async ({
    page,
  }) => {
    const sponsorsSection = page.getByRole("region", {
      name: /onze sponsors/i,
    });
    await expect(sponsorsSection, "sponsors section").toBeVisible();
    const firstLogo = sponsorsSection
      .locator("img")
      .filter({ hasNot: page.locator("[data-decorative]") })
      .first();
    await expect(
      firstLogo,
      "sponsor logos render as italic fallback — no images to hover",
    ).toHaveCount(1);

    // Default state: the image carries the `grayscale` class.
    await expect(firstLogo).toHaveClass(/grayscale/);

    // Hover the wrapping anchor (the `group`) — the image inherits
    // `group-hover:grayscale-0`. We assert via the computed filter style
    // rather than the class string because Tailwind's group-hover utility
    // only changes the runtime filter property, not the class list.
    const anchor = firstLogo.locator("xpath=ancestor::a[1]");
    await anchor.hover();
    await expect
      .poll(() =>
        firstLogo.evaluate((el) => window.getComputedStyle(el).filter),
      )
      .not.toContain("grayscale(1)");
  });
});
