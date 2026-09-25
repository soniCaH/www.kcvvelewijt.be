import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";

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

async function measureHitArea(control: Locator): Promise<HitMeasurement> {
  await control.scrollIntoViewIfNeeded();
  return control.evaluate((el, interactive) => {
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
    for (const other of document.querySelectorAll(interactive)) {
      if (other === el || el.contains(other) || other.contains(el)) continue;
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
  }, INTERACTIVE);
}

async function expectTapTarget(control: Locator) {
  const m = await measureHitArea(control);
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
  const n = Math.min(await toggles.count(), 20);
  for (let i = 0; i < n; i++) {
    await toggles.nth(i).click();
    if ((await actions.count()) > 0) return actions;
    await toggles.nth(i).click();
  }
  return null;
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
      if (await expand.count()) await expand.click();
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
      await expectTapTarget(clear);
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
  });
}
