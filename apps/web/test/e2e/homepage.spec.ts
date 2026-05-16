import { expect, test } from "@playwright/test";

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
// component so the suite stays robust if the visual chrome shifts. If a
// section drops because its drop-if-empty branch fires (no events
// scheduled, no upcoming matches, sponsors not yet loaded), the optional
// assertions below skip via `if (await section.count() === 0) test.skip()`
// pattern — we only fail when something is present but broken.

test.describe("/ homepage integration (Phase 4.5.C.1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the page without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
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

    if ((await sponsorsRegion.count()) === 0) {
      test.skip(true, "Sponsors section absent — staging seed gap.");
    }
    if ((await clubshopRegion.count()) === 0) {
      test.skip(true, "Clubshop banner is missing — staging-only seed gap.");
    }

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
    const expandButton = page.getByRole("button", {
      name: /toon alle \d+ wedstrijden/i,
    });
    if ((await expandButton.count()) === 0) {
      test.skip(true, "Fewer than 6 upcoming matches — no expand button.");
    }

    // The /kalender link is hidden in the collapsed state.
    const kalenderLink = page.getByRole("link", {
      name: /volledige kalender/i,
    });
    await expect(kalenderLink).toHaveCount(0);

    await expandButton.click();

    // After expand: button disappears, /kalender link appears.
    await expect(expandButton).toHaveCount(0);
    await expect(kalenderLink).toBeVisible();
    await expect(kalenderLink).toHaveAttribute("href", "/kalender");
  });

  test("sponsors block: logo tiles greyscale by default and resolve to colour on hover", async ({
    page,
  }) => {
    const sponsorsSection = page.getByRole("region", {
      name: /onze sponsors/i,
    });
    if ((await sponsorsSection.count()) === 0) {
      test.skip(true, "Sponsors section absent in this environment.");
    }
    const firstLogo = sponsorsSection
      .locator("img")
      .filter({ hasNot: page.locator("[data-decorative]") })
      .first();
    if ((await firstLogo.count()) === 0) {
      test.skip(
        true,
        "Sponsor logos render as italic fallback — no images to hover.",
      );
    }

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
