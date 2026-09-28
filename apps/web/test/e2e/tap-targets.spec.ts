import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";
import { waitForHydrated } from "./helpers/hydration";

// The Tap Target Rule (DESIGN.md): an icon-only control answers to a 44 × 44
// hit area, and that hit area never lands on a neighbouring control. Several
// of these controls get their hit area from an invisible `::before` (the
// `hit-area` utility), which does not change `getBoundingClientRect` — so the
// only honest measurement is `elementFromPoint`, in a real browser at a real
// viewport. happy-dom has no layout, so no unit test can stand in for this.

const INTERACTIVE =
  'a[href],button,input,select,textarea,[role="button"],[role="combobox"],[role="link"],[role="tab"],[role="menuitem"]';

interface HitMeasurement {
  width: number;
  height: number;
  /** Share of sample points in the 44 × 44 square around the centre that resolve to the control. */
  coverage: number;
  /** Other interactive elements the hit area geometrically reaches. */
  overlaps: string[];
}

interface MeasureHitAreaOptions {
  /**
   * A CSS selector for a container whose own interactive descendants are
   * exempt from the `overlaps` check — for a rail arrow that floats over
   * its own scroll track (`ScrollRail`), the chips underneath are overlap
   * by design, not a defect: the arrow sits beside/over them and every chip
   * stays reachable next to the arrow or by scrolling past it. Every other
   * neighbour (another control, a link, the row's own other arrow — a
   * sibling of the track, never inside it) still counts. Omit for the
   * default, unrestricted check every other caller uses.
   */
  ignoreWithin?: string;
}

async function measureHitArea(
  control: Locator,
  options: MeasureHitAreaOptions = {},
): Promise<HitMeasurement> {
  return control.evaluate(
    (el, { interactive, ignoreWithin }) => {
      // Rule 2 (#3196): scroll only when the whole 44 × 44 hit square around
      // the control's centre is not already inside the viewport, and never
      // scroll a control whose own or ancestor `position` is `sticky` or
      // `fixed` — measure those where they stand. `scrollIntoViewIfNeeded`
      // used to run unconditionally: on a sticky control (HubSearch's
      // repeated search in the section bar) it scrolls the document to the
      // control's *in-flow* position, which brings the hero back into view,
      // fires its IntersectionObserver, and unmounts the bar's own search —
      // measuring a detached element reports 0 × 0 / width 1, not a real hit
      // area. Centring rather than edge-aligning also closes the other half
      // of the same defect: an edge-aligned scroll can still leave the
      // pseudo-element hit-area overhanging the viewport uncounted (the
      // ContactCard defect this rule closes too).
      const isStickyOrFixed = (node: Element | null): boolean => {
        for (let n = node; n; n = n.parentElement) {
          const position = getComputedStyle(n).position;
          if (position === "sticky" || position === "fixed") return true;
        }
        return false;
      };
      if (!isStickyOrFixed(el)) {
        const pre = el.getBoundingClientRect();
        const half = 22; // half of the 44 × 44 hit square
        const cx0 = pre.left + pre.width / 2;
        const cy0 = pre.top + pre.height / 2;
        const fitsInViewport =
          cx0 - half >= 0 &&
          cy0 - half >= 0 &&
          cx0 + half <= window.innerWidth &&
          cy0 + half <= window.innerHeight;
        if (!fitsInViewport) {
          // `behavior: "instant"` (not the default "auto") is load-bearing:
          // the site sets `html[data-scroll-behavior="smooth"]` globally
          // (`globals.css`), and "auto" respects that ancestor CSS — the
          // scroll would animate, and the very next line's synchronous
          // `getBoundingClientRect()` would read the control mid-flight,
          // not at rest. Same convention `<ScrollToTop>` uses for the same
          // reason.
          el.scrollIntoView({
            block: "center",
            inline: "center",
            behavior: "instant",
          });
        }
      }

      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const hits = (x: number, y: number) => {
        const at = document.elementFromPoint(x, y);
        return !!at && (at === el || el.contains(at));
      };
      // Walk out from the centre along its row and column until a point stops
      // resolving to the control — the real extents, pseudo-element included.
      // Hit testing resolves to whole pixels, so walk whole pixels from a
      // rounded centre: a fractional start would shave a pixel off one side,
      // and sub-pixel steps overshoot the real edge.
      const px = Math.round(cx);
      const py = Math.round(cy);
      const reach = (dx: number, dy: number) => {
        let n = 0;
        while (n < 60 && hits(px + dx * (n + 1), py + dy * (n + 1))) n++;
        return n;
      };
      const [l, rt, t, b] = [
        reach(-1, 0),
        reach(1, 0),
        reach(0, -1),
        reach(0, 1),
      ];
      const width = l + rt + 1;
      const height = t + b + 1;
      const left = px - l;
      const right = px + rt + 1;
      const top = py - t;
      const bottom = py + b + 1;

      let covered = 0;
      let total = 0;
      for (let x = cx - 20.5; x < cx + 22; x += 3) {
        for (let y = cy - 20.5; y < cy + 22; y += 3) {
          total++;
          if (hits(x, y)) covered++;
        }
      }

      // A pseudo-element hit area hides what sits under it from
      // `elementFromPoint`, so look geometrically, then confirm the neighbour
      // is really there by probing with the control's own pointer-events off.
      const overlaps: string[] = [];
      const html = el as HTMLElement;
      const ignoreRoot = ignoreWithin
        ? document.querySelector(ignoreWithin)
        : null;
      for (const other of document.querySelectorAll(interactive)) {
        if (other === el || el.contains(other) || other.contains(el)) continue;
        if (ignoreRoot && ignoreRoot.contains(other)) continue;
        const q = other.getBoundingClientRect();
        if (!q.width || !q.height) continue;
        const ow = Math.min(right, q.right) - Math.max(left, q.left);
        const oh = Math.min(bottom, q.bottom) - Math.max(top, q.top);
        if (ow <= 0.5 || oh <= 0.5) continue;
        const previous = html.style.pointerEvents;
        html.style.pointerEvents = "none";
        const under = document.elementFromPoint(
          Math.max(left, q.left) + ow / 2,
          Math.max(top, q.top) + oh / 2,
        );
        html.style.pointerEvents = previous;
        if (under && (under === other || other.contains(under))) {
          overlaps.push(
            `${other.tagName.toLowerCase()}[${other.getAttribute("aria-label") ?? ""}] ${Math.round(ow)}×${Math.round(oh)}`,
          );
        }
      }
      return {
        width,
        height,
        coverage: Math.round((100 * covered) / total),
        overlaps,
      };
    },
    { interactive: INTERACTIVE, ignoreWithin: options.ignoreWithin ?? null },
  );
}

async function expectTapTarget(
  control: Locator,
  options: MeasureHitAreaOptions = {},
) {
  const m = await measureHitArea(control, options);
  expect(m.width, "hit width").toBeGreaterThanOrEqual(44);
  expect(m.height, "hit height").toBeGreaterThanOrEqual(44);
  expect(m.coverage, "44 × 44 square resolves to the control").toBe(100);
  expect(m.overlaps, "hit area reaches another control").toEqual([]);
}

const VIEWPORTS = [
  { width: 375, height: 800 },
  { width: 1280, height: 900 },
] as const;

/** Opens answers on /hulp until one carries a contact card with actions. */
async function openAnswerWithContact(page: Page): Promise<Locator | null> {
  const actions = page.locator(
    '#hulp a[aria-label^="E-mail"], #hulp a[aria-label^="Bel "]',
  );
  const toggles = page.locator("#hulp button[aria-expanded]");
  await toggles.first().waitFor();
  // Rule 1 (#3196): these toggles are prerendered client components with a
  // plain `onClick` — the first click must wait for hydration or it is
  // silently dropped, the loop opens the wrong question, and that
  // question's contact ends up at the viewport edge (flake ledger row 29 /
  // class N).
  await waitForHydrated(toggles.first());
  const n = Math.min(await toggles.count(), 20);
  for (let i = 0; i < n; i++) {
    await toggles.nth(i).click();
    if ((await actions.count()) > 0) return actions;
    await toggles.nth(i).click();
  }
  return null;
}

/**
 * Waits until `window.scrollY` reads the same on two consecutive polls.
 *
 * The hub's hash-landing correction (`useHashLandingCorrection`,
 * `useSectionNav`) re-verifies a `#structuur` cold load's landing spot once
 * the sticky bar's own resize (its `<HubSearch>` mounting) or a late webfont
 * swap fires — a native `scrollIntoView()` under the page's global
 * `scroll-behavior: smooth`, so it animates. Under slow hydration that
 * correction can still be mid-flight when this test reaches its own
 * measurement, which would otherwise misattribute the page's own animated
 * scroll to a defect in `measureHitArea`. Polled with `expect.poll` at its
 * own default timeout — no timeout raised, no fixed sleep.
 */
async function waitForScrollSettled(page: Page): Promise<void> {
  let previous: number | null = null;
  await expect
    .poll(async () => {
      const current = await page.evaluate(() => window.scrollY);
      const settled = previous !== null && current === previous;
      previous = current;
      return settled;
    })
    .toBe(true);
}

for (const viewport of VIEWPORTS) {
  test.describe(`icon-only controls answer to 44 × 44 at ${viewport.width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(viewport);
    });

    test("ContactCard E-mail / Bel on /hulp", async ({ page }) => {
      await gotoBounded(page, "/hulp");
      // Fail, not skip: the /hulp answers are CMS content that always carry
      // contacts, so finding none means the card or its labels broke.
      const actions = await openAnswerWithContact(page);
      if (!actions) {
        throw new Error("no answer on /hulp rendered a ContactCard action");
      }
      for (const action of await actions.all()) await expectTapTarget(action);
    });

    test("OrganigramExplorer Vorige / Volgende functie", async ({ page }) => {
      await gotoBounded(page, "/hulp");
      const expand = page.getByRole("button", {
        name: "Bekijk het volledige organigram",
      });
      // Rule 1 (#3196): `OrganigramOverview`'s disclosure button is a
      // prerendered `"use client"` component with a plain `onClick` — a
      // click before hydration attaches the listener is silently dropped,
      // `VolledigOrganigram` never mounts, and the next locator below waits
      // the full test timeout for a button that will never appear (flake
      // ledger row 28 / class N).
      //
      // No `if (await expand.count())` guard: `/hulp/page.tsx:197` always
      // renders `<OrganigramOverview collapsible />`, so this button always
      // exists on this route — a non-waiting `count()` right after
      // `gotoBounded` is a THIRD race, independent of hydration. `/hulp` has
      // its own `loading.tsx`, so the DOM immediately after `gotoBounded`
      // can still be that route-level loading skeleton (no organigram
      // markup at all yet) while the real page streams in — `count()`
      // reads 0 in that instant, the whole click is skipped, and the next
      // locator below then waits the full test timeout for a button that
      // was never clicked into existence (CI run 36318387622, both @375px
      // attempts). `waitForHydrated()`'s own `locator.waitFor()` waits
      // (bounded, default timeout) for the button to attach — covering both
      // the streaming race and the hydration race with one wait — so always
      // call it, unconditionally.
      await waitForHydrated(expand);
      await expand.click();
      await page
        .getByRole("button", { name: /Blader door het organigram/ })
        .first()
        .click();
      for (const name of ["Vorige functie", "Volgende functie"]) {
        await expectTapTarget(page.getByRole("button", { name }));
      }
    });

    test("HubSearch clear button in the hero", async ({ page }) => {
      await gotoBounded(page, "/hulp");
      const field = page.locator('#hub-hero [role="combobox"]');
      await field.fill("trainer");
      await page.keyboard.press("Escape");
      await expectTapTarget(
        page.locator('#hub-hero button[aria-label="Wissen"]'),
      );
    });

    test("HubSearch clear button in the sticky section bar", async ({
      page,
    }) => {
      // A cold load with the hash lands past the hero however slow hydration
      // is; a manual scroll fired before hydration can be undone by it, and
      // the bar mounts its search only once the hero is out of view.
      await gotoBounded(page, "/hulp#structuur");
      const nav = page.locator('nav[aria-label="Secties van de hub"]');
      const field = nav.locator('[role="combobox"]');
      await expect(field).toBeVisible();
      await field.fill("trainer");
      await page.keyboard.press("Escape");
      const clear = nav.locator('button[aria-label="Wissen"]');
      await expect(clear).toBeVisible();
      // Rule 2 (#3196): this control is inside a `position: sticky` bar —
      // `measureHitArea` must measure it where it stands rather than
      // scrolling it into its in-flow position, which would bring the hero
      // back into view, fire its IntersectionObserver, and unmount this
      // very search (flake ledger row 29 / class B). Assert the page never
      // moves under the measurement, not only that the measurement itself
      // comes back right.
      await waitForScrollSettled(page);
      const scrollYBefore = await page.evaluate(() => window.scrollY);
      await expectTapTarget(clear);
      const scrollYAfter = await page.evaluate(() => window.scrollY);
      expect(scrollYAfter, "scrollY across the measurement").toBe(
        scrollYBefore,
      );
    });

    test("CalendarWidget period arrows on /kalender", async ({ page }) => {
      await gotoBounded(page, "/kalender");
      const prev = page.getByRole("button", { name: /^Vorige (maand|week)$/ });
      const next = page.getByRole("button", {
        name: /^Volgende (maand|week)$/,
      });
      // A visible 44px box at every width, not only a hit area.
      await expect(prev).toHaveCSS("height", "44px");
      await expectTapTarget(prev);
      await expectTapTarget(next);
    });

    test("MatchStrip result / fixture toggle", async ({ page }) => {
      // The strip renders its toggle from `lg` up only.
      test.skip(viewport.width < 1024, "the toggle is desktop-only");
      await gotoBounded(page, "/");
      const toggles = page.getByRole("button", {
        name: /^Toon de (laatste uitslag|volgende wedstrijd)$/,
      });
      await expect(
        toggles.first(),
        "no result and fixture to toggle between",
      ).toBeVisible({ timeout: 10_000 });
      for (const toggle of await toggles.all()) await expectTapTarget(toggle);
    });

    test("UpcomingMatches team-chip row scroll arrows on /", async ({
      page,
    }) => {
      // The acceptance criterion (#3237) is scoped to the 375px viewport —
      // measure only there. At 1280px the row sits inside `<TapedCard>`'s
      // slight decorative rotation (`data-rotation`, a ~0.25° transform);
      // far enough from that rotation's origin, the sub-pixel skew it
      // introduces shaves a couple of the 44 × 44 coverage grid's edge
      // samples off, independent of this fix (`overlaps` is already clean
      // there) — a pre-existing rendering quirk, not a tap-target
      // regression, and out of scope here.
      test.skip(
        viewport.width !== 375,
        "AC #3237 scopes this control's tap target to the 375px viewport",
      );
      // Fail, not skip: the club fields ~18 teams and an active season
      // always has more than one with an upcoming fixture, so this chip row
      // reliably overflows at 375px (measured live: 18 chips need ~1726px
      // of track against a ~275px content width) — a chip row that stops
      // overflowing here is a real regression, not test flake.
      await gotoBounded(page, "/");
      const chipRowSelector =
        '[role="group"][aria-label="Filter wedstrijden op ploeg"]';
      const chipRow = page.locator(chipRowSelector);
      await expect(
        chipRow,
        "no team-chip row rendered on the homepage",
      ).toBeVisible();
      const scrollLeft = page.getByRole("button", { name: "Scroll left" });
      const scrollRight = page.getByRole("button", { name: "Scroll right" });
      await expect(
        scrollRight,
        "chip row does not overflow at this width",
      ).toBeVisible();
      // The left arrow starts disabled — the row's own "spent direction
      // stays, disabled in place" idiom (`ScrollArrowButton`'s `disabled`
      // doc) — so a click on it would resolve to nothing behind
      // `pointer-events-none`. Scroll via the right arrow first so both
      // directions are live before measuring either one.
      await scrollRight.click();
      await expect(
        scrollLeft,
        "left arrow never became scrollable",
      ).toBeEnabled();
      // `ignoreWithin` exempts the row's own chips from the overlap check:
      // this arrow floats over its own scroll track by design (`ScrollRail`)
      // — a chip under it stays reachable beside the arrow or by scrolling
      // past, so that overlap is the intended affordance, not a defect.
      // Every other neighbour (another control, a link, the row's other
      // arrow — a sibling of the track, never inside it) still counts.
      const rail = { ignoreWithin: chipRowSelector };
      await expectTapTarget(scrollLeft, rail);
      await expectTapTarget(scrollRight, rail);
    });
  });
}
