import { expect, test, type Page, type Locator } from "@playwright/test";
import { matchIdIn } from "./helpers/fixtures";

/** A real staging article with an `htmlTable` block and related articles —
 * the pinned `e2e-*` fixtures carry neither, so both tests below would
 * `continue` past every viewport and assert nothing. */
const TABLE_ARTICLE_SLUG =
  "2025-06-20-definitieve-reeksindeling-3e-nationale-bis";
import { gotoBounded } from "./helpers/goto";

// #2577 — "one scroll arrow in two registers, held space by real overflow"
// (#2444, as amended by #2476, #2478 and #2489). Source-scan and Storybook
// can fix a scroller's geometry per fixture, but only a real browser at a
// real viewport can confirm the arrow's mount/unmount actually tracks the
// track's live `scrollWidth`/`clientWidth` — the map's own testing
// decisions single this out as e2e-only ("runtime geometry no source scan
// can see").
//
// Rather than asserting a specific viewport overflows a specific route
// (fragile against CMS content and pre-season data gaps — several of these
// rows render zero items today), every case below asserts the *invariant*
// the acceptance criterion actually states: at the viewport under test, an
// arrow is mounted in a given direction if and only if the track can
// actually scroll that way. That holds regardless of which side of the
// overflow boundary today's real content happens to land on.

/** Every `/ploegen/[slug]` in the sitemap — one pinned team is not enough,
 * and #2444/#2478 already recorded that whether a team's section nav renders
 * at all (let alone overflows) is pre-season-dependent per
 * team: the senior sides currently ship ≤1 section (no nav at all) while
 * several youth sides ship enough for the nav to appear. Scanning the full
 * list, not just the first slug, is what makes the TeamSectionNav case
 * below exercise the real thing instead of silently no-op-ing on whichever
 * team happens to sort first. */
let teamSlugs: string[] = [];
/** The first `/ploegen/[slug]` or `/wedstrijd/[matchId]` whose SSR HTML
 * carries a numbered `<StandingsTable>` (not the numberless list variant),
 * or `null` if none does today (review S5: `StandingsTable` is a Server
 * Component, so this is discoverable from the raw HTML — a plain HTTP GET
 * per candidate, no browser, no hydration — instead of `page.goto()`-ing
 * up to 19 routes just to throw most of them away). */
let standingsTableUrl: string | null = null;
/** The first `/ploegen/[slug]` whose SSR HTML carries `TeamSectionNav`
 * (auto-hides at ≤1 section — the same pre-season dependency), found the
 * same way and in the same sweep as `standingsTableUrl` above. */
let teamSectionNavSlug: string | null = null;

/** The numbered table's wrapper carries `data-testid="standings-table"`
 * with no `data-variant` attribute; the numberless list carries both. JSX
 * attribute order is stable, so "not immediately followed by a
 * `data-variant`" is a precise, hydration-free signature for "numbered". */
function hasNumberedStandingsTable(html: string): boolean {
  return /data-testid="standings-table"(?!\s+data-variant)/.test(html);
}

// ponytail: this spec (like section-nav.spec.ts) still sweeps every team page
// at start-up. #3146 deletes both files.
test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error("playwright config baseURL is required");
  }

  const sitemapResponse = await fetch(`${baseURL}/sitemap.xml`);
  const sitemapXml = await sitemapResponse.text();
  teamSlugs = Array.from(
    sitemapXml.matchAll(/<loc>\s*[^<]*\/ploegen\/([a-z0-9-]+)\s*<\/loc>/g),
    (m) => m[1]!,
  );

  // Both `StandingsTable` and `TeamSectionNav` are Server Components, so
  // one GET per team slug settles both discoveries — no `page.goto()`, no
  // hydration (review S5: this used to be two independent full-navigation
  // sweeps over the same up-to-18 team pages).
  for (const slug of teamSlugs) {
    const response = await fetch(`${baseURL}/ploegen/${slug}`);
    if (!response.ok) continue;
    const html = await response.text();
    if (!standingsTableUrl && hasNumberedStandingsTable(html)) {
      standingsTableUrl = `/ploegen/${slug}`;
    }
    if (
      !teamSectionNavSlug &&
      html.includes('data-testid="team-section-nav"')
    ) {
      teamSectionNavSlug = slug;
    }
    if (standingsTableUrl && teamSectionNavSlug) break;
  }
  const matchId = standingsTableUrl ? null : matchIdIn(sitemapXml);
  if (matchId) {
    const url = `/wedstrijd/${matchId}`;
    const response = await fetch(`${baseURL}${url}`);
    if (response.ok && hasNumberedStandingsTable(await response.text())) {
      standingsTableUrl = url;
    }
  }
});

/**
 * Repeatedly evaluates `read` until two consecutive reads agree, then
 * returns that settled value — instead of a single snapshot.
 *
 * #2985 bounded this suite's post-goto `load` wait to 10s (`gotoBounded`).
 * On a contended runner the page can still be swapping its real webfont in
 * after that bound expires, and a one-shot `scrollWidth`/`clientWidth`
 * snapshot taken then can read fallback-font metrics instead of the
 * settled layout — a race the old *unbounded* `load` wait papered over by
 * construction, since it always waited the font out. The arrow assertions
 * that follow already auto-retry against the DOM; this makes the
 * measurement they're compared against retry the same way, rather than
 * staying frozen at a pre-settle read. Do NOT swap this for
 * `document.fonts.ready` — #2834 already recorded that signal as
 * unreliable in this repo.
 */
async function settled<T>(read: () => Promise<T>): Promise<T> {
  let previousKey: string | undefined;
  let latest!: T;
  await expect
    .poll(
      async () => {
        latest = await read();
        const key = JSON.stringify(latest);
        const stable = key === previousKey;
        previousKey = key;
        return stable;
      },
      { timeout: 5000 },
    )
    .toBe(true);
  return latest;
}

async function readOverflow(track: Locator) {
  const { scrollWidth, clientWidth, scrollLeft } = await settled(() =>
    track.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
    })),
  );
  const DEAD_ZONE = 10;
  return {
    overflows: scrollWidth - clientWidth > DEAD_ZONE,
    canScrollRight: scrollLeft < scrollWidth - clientWidth - DEAD_ZONE,
    canScrollLeft: scrollLeft > DEAD_ZONE,
  };
}

/**
 * Asserts the arrow/overflow invariant for an "overlay" scroller — a table
 * or a diagram, content you scroll past rather than a row of tap targets
 * (#2444, as amended by #2476). No held space: a "Scroll right"/"Scroll
 * left" control mounts and unmounts per direction, exactly matching
 * `canScrollLeft`/`canScrollRight` independently. Scoped to `within` so a
 * page with more than one scroller doesn't cross-match.
 */
async function assertOverlayArrowMatchesOverflow(
  within: Page | Locator,
  track: Locator,
) {
  await expect(track).toHaveCount(1);
  const { canScrollLeft, canScrollRight } = await readOverflow(track);

  const rightArrow = within.getByLabel("Scroll right");
  const leftArrow = within.getByLabel("Scroll left");

  if (canScrollRight) {
    await expect(rightArrow).toBeVisible();
  } else {
    await expect(rightArrow).toHaveCount(0);
  }

  if (canScrollLeft) {
    await expect(leftArrow).toBeVisible();
  } else {
    await expect(leftArrow).toHaveCount(0);
  }
}

/**
 * Asserts the arrow/overflow invariant for a "rail" scroller — a row of
 * discrete things (chips, nav items, crumbs), which holds a 40px gutter on
 * *both* sides exactly when the track overflows at all (#2489 resolution
 * part 1), never per direction. Both arrows mount together and the spent
 * direction **disables in place** rather than unmounting (#2489 resolution
 * part 3) — the property under test here is presence-vs-absence-as-a-pair
 * plus each direction's `disabled` state, not per-direction mount/unmount.
 */
async function assertRailArrowMatchesOverflow(
  within: Page | Locator,
  track: Locator,
) {
  await expect(track).toHaveCount(1);
  const { overflows, canScrollLeft, canScrollRight } =
    await readOverflow(track);

  const rightArrow = within.getByLabel("Scroll right");
  const leftArrow = within.getByLabel("Scroll left");

  if (!overflows) {
    await expect(rightArrow).toHaveCount(0);
    await expect(leftArrow).toHaveCount(0);
    return;
  }

  await expect(rightArrow).toBeVisible();
  await expect(leftArrow).toBeVisible();
  if (canScrollRight) {
    await expect(rightArrow).toBeEnabled();
  } else {
    await expect(rightArrow).toBeDisabled();
  }
  if (canScrollLeft) {
    await expect(leftArrow).toBeEnabled();
  } else {
    await expect(leftArrow).toBeDisabled();
  }
}

test.describe("scroll arrow — mounts only on real overflow at that width", () => {
  test("FilterTabs on /nieuws — desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoBounded(page, "/nieuws");
    const group = page.getByRole("group", { name: /filter/i }).first();
    // The arrows are the group's own siblings inside FilterTabs' outer
    // `relative` wrapper, not its descendants — scope the label lookup to
    // that wrapper (the group's parent), not the group itself.
    const wrapper = group.locator("..");
    await assertRailArrowMatchesOverflow(wrapper, group);
  });

  test("FilterTabs on /nieuws — narrow phone (360px), where the category row is known to overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoBounded(page, "/nieuws");
    const group = page.getByRole("group", { name: /filter/i }).first();
    const wrapper = group.locator("..");
    await assertRailArrowMatchesOverflow(wrapper, group);
  });

  // #3016 — the one property no unit test in this repo can reach. The rail
  // padding is applied to the very element `useScrollHint` measures, so a
  // wrapper that is a flex item lets that padding grow the track's own
  // border box (`min-width: auto` floors the item at its min-content size)
  // instead of shrinking its content box. `scrollWidth` and `clientWidth`
  // then move together, the hook's padding subtraction counts the gutter
  // twice, and the verdict inverts on every re-measure — which a hover
  // triggers, because the chip's `transition-all` fires `transitionend` and
  // `useScrollHint` re-measures on it. `/hulp`'s audience row shipped that
  // shape: the arrows mounted and unmounted ~3x a second for as long as a
  // chip stayed hovered. jsdom computes no layout, so `ScrollRail.test.tsx`
  // can only assert the `min-w-0` that prevents it; whether the real
  // geometry actually holds is a browser question.
  //
  // Deliberately NOT pinned to the dead-zone boundary: landing content
  // within 10px of the track width would need the CMS copy, the webfont
  // metrics and the viewport all held still — the fragility this file's
  // header rejects — and the defect never needed the boundary anyway (it
  // fired at a 30px margin). A row that plainly overflows is the honest
  // case, and the one that regresses.
  test("FilterTabs on /hulp — a held chip hover must not oscillate the arrows (#3016)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoBounded(page, "/hulp");

    const group = page.getByRole("group", { name: /doelgroep/i });
    await expect(group).toBeVisible();
    const wrapper = group.locator("..");

    // Both /hulp chip rows are hardcoded (`AUDIENCE_TABS`/`CATEGORY_TABS`),
    // not CMS-driven, so unlike the routes above this one can assert the
    // precondition outright: five chips either overflow a 360px phone or
    // the rest of this test is measuring nothing.
    const { overflows } = await readOverflow(group);
    expect(overflows).toBe(true);
    await assertRailArrowMatchesOverflow(wrapper, group);

    // Hover by position, not label — the audience labels are domain copy
    // (`HUB_AUDIENCE_FILTERS`) and this test is about geometry, not wording.
    await group.locator("button").nth(1).hover();

    // One hover is enough: the loop is self-sustaining once started (each
    // flip animates the rail padding, whose `transitionend` drives the
    // next). At the shipped ~320ms period this window caught ~9 flips.
    const flips = await group.evaluate(async (track, sampleMs) => {
      const railWrapper = track.parentElement!;
      const arrowCount = () =>
        [...railWrapper.children].filter((n) => n.tagName === "BUTTON").length;
      let last = arrowCount();
      let transitions = 0;
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const now = arrowCount();
          if (now !== last) {
            transitions += 1;
            last = now;
          }
          if (performance.now() - start < sampleMs) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });
      return transitions;
    }, 3000);

    expect(flips).toBe(0);

    // The same `min-width: auto` floor also pushed this row past the page's
    // own edge (37px at a 500px viewport) — one assertion, same root cause.
    const bleed = await page.evaluate(
      () => document.body.scrollWidth - document.documentElement.clientWidth,
    );
    expect(bleed).toBeLessThanOrEqual(0);
  });

  test("HorizontalSlider (RelatedRow) on /nieuws/[slug] — desktop and mobile", async ({
    page,
  }) => {
    const slug = TABLE_ARTICLE_SLUG;

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 375, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoBounded(page, `/nieuws/${slug}`);
      const track = page.locator('[data-slot="scroll-track"]').first();
      // The related row is optional (auto-hides at zero items) — skip this
      // viewport iteration honestly rather than fail if it isn't present.
      if ((await track.count()) === 0) continue;
      // The arrows are the track's own siblings inside HorizontalSlider's
      // `relative` wrapper, not its descendants — and scoping to that
      // wrapper (rather than the whole page) also keeps this test honest
      // if the article body also carries an HtmlTableBlock scroller.
      const wrapper = track.locator("..");
      await assertOverlayArrowMatchesOverflow(wrapper, track);
    }
  });

  test("TeamSectionNav on /ploegen/[slug] — narrow phone (360px)", async ({
    page,
  }) => {
    // Not every team ships the nav today (it auto-hides at ≤1 section,
    // #2444/#2478's pre-season blindness) — `teamSectionNavSlug` is
    // whichever team in the sitemap does, found by `beforeAll`'s HTTP
    // sweep rather than a second full-navigation scan here (review S5).
    test.skip(
      !teamSectionNavSlug,
      "no team in the sitemap renders TeamSectionNav today (≤1 section on every team — pre-season)",
    );
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoBounded(page, `/ploegen/${teamSectionNavSlug}`);
    const nav = page.getByTestId("team-section-nav");

    const list = nav.locator("ul").first();
    await assertRailArrowMatchesOverflow(nav, list);
  });

  test("StandingsTable on /ploegen/[slug] or /wedstrijd/[matchId] — phone viewport (360px)", async ({
    page,
  }) => {
    test.skip(
      !standingsTableUrl,
      "no team or match in the sitemap renders a numbered StandingsTable today (pre-season / numberless-only data)",
    );
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoBounded(page, standingsTableUrl!);

    // Scoped to the standings table itself, not `page` — a team page also
    // ships `TeamSectionNav`'s own "Scroll right" control, and asserting
    // against the whole page matches both (strict-mode violation).
    const table = page
      .locator(
        '[data-testid="standings-table"]:not([data-variant="numberless"])',
      )
      .first();
    const track = table.locator('[role="region"]');

    // Review finding 1 / M2: this is the only place in the suite that
    // proves the table *actually* overflows at 360px — not a Storybook or
    // vitest mock of scrollWidth/clientWidth, which proves the arrow-mount
    // wiring but nothing about whether the table ever gets there. An
    // 8-column numbered division either overflows a 360px phone or the
    // fix is dead; asserted unconditionally, not `if (overflows)`, so a
    // regression here fails the test instead of skipping the check.
    const { overflows } = await readOverflow(track);
    expect(overflows).toBe(true);

    await assertOverlayArrowMatchesOverflow(table, track);

    // Anchoring (#2476 rule 3): the leading group (#, Ploeg) and the
    // trailing column (Ptn) stay pinned — unconditionally, now that they
    // are declared on the cell itself rather than gated behind overflow
    // (review M1).
    const headers = track.locator("th");
    const pinned = [headers.nth(0), headers.nth(1), headers.last()];
    for (const cell of pinned) {
      const position = await cell.evaluate(
        (el) => getComputedStyle(el).position,
      );
      expect(position).toBe("sticky");
    }
  });

  test("HtmlTableBlock in an article body — desktop and mobile", async ({
    page,
  }) => {
    const slug = TABLE_ARTICLE_SLUG;

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 375, height: 800 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoBounded(page, `/nieuws/${slug}`);
      const region = page.locator('[data-html-table="true"] [role="region"]');
      if ((await region.count()) === 0) continue;
      // HtmlTableBlock never mounts a left arrow — `direction="right"`,
      // unconditionally (#2582: an authored table anchors nothing, so
      // there is no sticky column to justify a left cue either) — only
      // assert the right side.
      const { scrollWidth, clientWidth } = await settled(() =>
        region.first().evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        })),
      );
      const expectCanScrollRight = scrollWidth - clientWidth > 10;
      const rightArrow = page
        .locator('[data-html-table="true"]')
        .first()
        .getByLabel("Scroll right");
      if (expectCanScrollRight) {
        await expect(rightArrow).toBeVisible();
      } else {
        await expect(rightArrow).toHaveCount(0);
      }
    }
  });

  test("organigram explorer stage — no arrow at A, an arrow once zoomed to A+/A++ overflows it", async ({
    page,
  }) => {
    // Review finding #2577 part 6: the stage's zoom control applies a CSS
    // `transform: scale()` to its tree, which never changes the stage's own
    // border box — #2489's "cannot overflow horizontally at any width" was
    // measured at scale 1 (button "A") only. At a narrow-enough viewport,
    // zooming to A+ or A++ should overflow it and mount the arrow; "A"
    // itself should not.
    await page.setViewportSize({ width: 1024, height: 800 });
    await gotoBounded(page, "/hulp");

    // The organigram section renders collapsed on /hulp
    // (`<OrganigramOverview collapsible>`) — expand it first.
    const expandTrigger = page.getByRole("button", {
      name: /bekijk het volledige organigram/i,
    });
    if ((await expandTrigger.count()) === 0) {
      test.skip(true, "no organigram section on /hulp today");
      return;
    }
    await expandTrigger.click();

    const openTrigger = page.getByRole("button", {
      name: /blader door het organigram/i,
    });
    if ((await openTrigger.count()) === 0) {
      test.skip(true, "no organigram explorer trigger on /hulp today");
      return;
    }
    await openTrigger.click();

    const dialog = page.getByTestId("organigram-explorer");
    await expect(dialog).toBeVisible();

    const stage = dialog.locator('[aria-label="Organigram-verkenner"]');
    await expect(stage).toHaveCount(1);
    // The arrows are the stage's own siblings inside ScrollOverlay's outer
    // `relative` wrapper, not its descendants (same shape as ScrollRail —
    // see the FilterTabs/HorizontalSlider cases above).
    const stageWrapper = stage.locator("..");

    // "A" (scaleStep 0) is the default on open — assert its own invariant
    // first rather than assuming it never overflows.
    const readStageOverflow = async () => {
      const { scrollWidth, clientWidth } = await settled(() =>
        stage.evaluate((el) => ({
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        })),
      );
      return scrollWidth - clientWidth > 10;
    };

    if (await readStageOverflow()) {
      await expect(stageWrapper.getByLabel("Scroll right")).toBeVisible();
    } else {
      await expect(stageWrapper.getByLabel("Scroll right")).toHaveCount(0);
    }

    // Zoom to A++ — the transform grows the tree well past a 1024px stage.
    await dialog.getByRole("button", { name: "A++", exact: true }).click();
    // The zoom transition (`transition-transform duration-300`) must
    // settle before scrollWidth reflects the target scale — useScrollHint's
    // `transitionend` listener is what re-checks after it does, so wait
    // past the transition rather than asserting immediately.
    await page.waitForTimeout(500);

    expect(await readStageOverflow()).toBe(true);
    await expect(stageWrapper.getByLabel("Scroll right")).toBeVisible();
  });
});
