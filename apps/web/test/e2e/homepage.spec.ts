import { expect, test } from "@playwright/test";

// Phase 4.D.2 (#1681) — Playwright e2e regression for the assembled homepage.
//
// PRD: docs/prd/redesign-phase-4.md §5.D.2.
//
// The component-level Vitest + Storybook test-runner suites cover the
// behaviour of each homepage section in isolation. This spec exercises the
// **integration**: that page.tsx wires every section in the right order on
// `/` and that the cross-component interactions (carousel auto-advance,
// thumb click, UpcomingMatches expand, sponsor-logo hover) work against
// real CMS data.
//
// Section selectors lean on aria labels and roles set inside each
// component so the suite stays robust if the visual chrome shifts. If a
// section drops because its drop-if-empty branch fires (no events
// scheduled, no upcoming matches, sponsors not yet loaded), the optional
// assertions below skip via `if (await section.count() === 0) test.skip()`
// pattern — we only fail when something is present but broken.

test.describe("/ homepage integration (Phase 4.D.2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the new section ordering on /", async ({ page }) => {
    // Sections are identified by their aria-labels (set inside each
    // component). The PRD-locked ordering is:
    //   carousel → event band → banner → news → upcoming matches →
    //   banner → youth → webshop → banner → sponsors
    const expected = [/uitgelichte? artikels?/i, /webshop/i, /onze sponsors/i];

    for (const label of expected) {
      const section = page.getByRole("region", { name: label }).or(
        page
          .locator("section")
          .filter({ has: page.getByLabel(label) })
          .first(),
      );
      await expect(section.first()).toBeVisible();
    }

    // Hero carousel comes BEFORE the webshop banner in the DOM.
    const carousel = page.getByRole("region", {
      name: /uitgelichte? artikels?/i,
    });
    const webshop = page.getByRole("region", { name: /^webshop$/i }).first();
    if ((await carousel.count()) === 0) {
      test.skip(true, "Carousel has no articles — section drops.");
    }
    if ((await webshop.count()) === 0) {
      test.skip(true, "Webshop banner is missing — staging-only seed gap.");
    }

    const carouselIndex = await carousel.evaluate((el) =>
      Array.from(document.querySelectorAll("section, [role='region']")).indexOf(
        el,
      ),
    );
    const webshopIndex = await webshop.evaluate((el) =>
      Array.from(document.querySelectorAll("section, [role='region']")).indexOf(
        el,
      ),
    );
    expect(carouselIndex).toBeGreaterThanOrEqual(0);
    expect(webshopIndex).toBeGreaterThan(carouselIndex);
  });

  test("hero carousel: thumb click jumps the active slide", async ({
    page,
  }) => {
    const carousel = page.getByRole("region", {
      name: /uitgelichte? artikels?/i,
    });
    if ((await carousel.count()) === 0) {
      test.skip(
        true,
        "Carousel single-article placement or empty — no thumb strip.",
      );
    }
    const thumbs = carousel.getByRole("button", {
      name: /^slide \d+ van \d+/i,
    });
    const count = await thumbs.count();
    if (count < 2) {
      test.skip(true, "Carousel has fewer than 2 slides — thumb click moot.");
    }

    // Slide 1 starts active.
    await expect(thumbs.nth(0)).toHaveAttribute("aria-pressed", "true");

    // Click slide 2 — aria-pressed should swap.
    await thumbs.nth(1).click();
    await expect(thumbs.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(thumbs.nth(0)).toHaveAttribute("aria-pressed", "false");
  });

  test("hero carousel: pause toggle stops auto-advance", async ({ page }) => {
    const pauseButton = page.getByRole("button", {
      name: /auto-rotatie pauzeren/i,
    });
    if ((await pauseButton.count()) === 0) {
      test.skip(true, "No carousel chrome — pause button missing.");
    }

    await expect(pauseButton).toHaveAttribute("aria-pressed", "false");
    await pauseButton.click();
    // After click the label flips to "hervatten" and aria-pressed=true.
    const resumeButton = page.getByRole("button", {
      name: /auto-rotatie hervatten/i,
    });
    await expect(resumeButton).toBeVisible();
    await expect(resumeButton).toHaveAttribute("aria-pressed", "true");
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
