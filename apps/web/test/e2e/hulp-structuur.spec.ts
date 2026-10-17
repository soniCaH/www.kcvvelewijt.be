import { expect, test, type Locator, type Page } from "@playwright/test";
import { gotoBounded } from "./helpers/goto";
import { waitForHydrated } from "./helpers/hydration";

// The `/hulp` clubboek: a finder answer's "Toon in structuur →" and a shared
// `?member=` link both land on the person's row — open, in view, summary
// focused. Geometry and focus, so no unit test can stand in for this: it needs
// a real browser with real scroll.

const rowFor = (page: Page, nodeId: string): Locator =>
  page.locator(`details[data-node-ids~=${JSON.stringify(nodeId)}]`);

/** Every box id that has a ledger row (key-figure-only boxes have none). */
async function rowNodeIds(page: Page): Promise<string[]> {
  return page
    .locator("details[data-node-ids]")
    .evaluateAll((rows) =>
      rows.flatMap(
        (row) => (row as HTMLElement).dataset.nodeIds?.split(" ") ?? [],
      ),
    );
}

/**
 * Waits until the answer's grow (`<HeightGrow>`, 500ms) and the scroll-back
 * guard that may follow it have finished: the region's clip and `scrollY` both
 * read the same on two consecutive polls. A click that lands mid-grow has its
 * own scroll overridden by the card's.
 */
async function waitForAnswerSettled(page: Page, region: Locator) {
  const clip = region.locator("xpath=..");
  let previous = "";
  await expect
    .poll(async () => {
      const height = (await clip.boundingBox())?.height ?? 0;
      const scrollY = await page.evaluate(() => window.scrollY);
      const state = `${height}:${scrollY}`;
      const settled = height > 0 && state === previous;
      previous = state;
      return settled;
    })
    .toBe(true);
}

/** Waits until the row sits inside the viewport. Polls the position, never the scroll animation. */
async function expectInView(page: Page, row: Locator) {
  await expect
    .poll(async () => {
      const box = await row.boundingBox();
      const viewport = page.viewportSize();
      return box && viewport
        ? box.y >= 0 && box.y + Math.min(box.height, 40) <= viewport.height
        : false;
    })
    .toBe(true);
}

async function expectRowOpenAndFocused(page: Page, nodeId: string) {
  const row = rowFor(page, nodeId);
  await expect(row).toHaveAttribute("open", "");
  await expect(row.locator("summary")).toBeFocused();
  await expectInView(page, row);
}

test.describe("/hulp structuur", () => {
  test('"Toon in structuur" from a finder answer opens the matching row', async ({
    page,
  }) => {
    await gotoBounded(page, "/hulp");
    const book = page.getByTestId("club-book");
    await waitForHydrated(book.locator("summary").first());

    const ids = await rowNodeIds(page);
    // The link's node id decides which answer to open: pick one whose box has a row.
    const target = await page
      .locator('#hulp a[href^="/hulp?member="]')
      .evaluateAll((links, rowIds) => {
        for (const link of links as HTMLAnchorElement[]) {
          const nodeId = new URL(link.href).searchParams.get("member");
          const region = link.closest('[role="region"]');
          if (nodeId && rowIds.includes(nodeId) && region)
            return { nodeId, toggleId: region.getAttribute("aria-labelledby") };
        }
        return null;
      }, ids);
    if (!target?.toggleId)
      throw new Error(
        "no finder answer links to a box that has a clubboek row",
      );

    const toggle = page.locator(`[id=${JSON.stringify(target.toggleId)}]`);
    await waitForHydrated(toggle);
    await toggle.click();
    const openRegion = page.locator('#hulp [role="region"]:not([inert])');
    await waitForAnswerSettled(page, openRegion);
    await openRegion
      .locator(`a[href^="/hulp?member=${encodeURIComponent(target.nodeId)}"]`)
      .click();

    await expectRowOpenAndFocused(page, target.nodeId);
  });

  test("?member=<nodeId> opens the matching row on load", async ({ page }) => {
    await gotoBounded(page, "/hulp");
    const [nodeId] = await rowNodeIds(page);
    if (!nodeId) throw new Error("no clubboek rows on /hulp");

    await gotoBounded(page, `/hulp?member=${encodeURIComponent(nodeId)}`);
    await expectRowOpenAndFocused(page, nodeId);
  });
});
