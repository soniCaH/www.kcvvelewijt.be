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
 * The `expanded` state the browser exposes to assistive tech for the first
 * row's summary (Chromium maps `<summary>` to a disclosure triangle). Read from
 * the accessibility tree, so it is what a screen reader is told, not the DOM
 * attribute it is derived from.
 */
async function announcedExpanded(page: Page): Promise<boolean | undefined> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector: '[data-testid="club-book"] summary',
    });
    const { nodes } = await cdp.send("Accessibility.getPartialAXTree", {
      nodeId,
      fetchRelatives: false,
    });
    const expanded = nodes[0]?.properties?.find((p) => p.name === "expanded");
    return expanded?.value.value as boolean | undefined;
  } finally {
    await cdp.detach();
  }
}

async function expectRowOpenAndFocused(page: Page, nodeId: string) {
  const row = rowFor(page, nodeId);
  await expect(row).toHaveAttribute("open", "");
  await expect(row.locator("summary")).toBeFocused();
  await expect(row).toBeInViewport();
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

  test("a hub-search member result opens the matching row, like the finder link", async ({
    page,
  }) => {
    await gotoBounded(page, "/hulp");
    const book = page.getByTestId("club-book");
    await waitForHydrated(book.locator("summary").first());

    // A row of a single box, so its title is the search term and one row answers.
    const title = await book
      .locator("details[data-node-ids]")
      .evaluateAll((rows) => {
        for (const row of rows) {
          const text =
            row.querySelector("summary > span > span")?.textContent ?? "";
          if (text && !text.includes(" · ")) return text.trim();
        }
        return null;
      });
    if (!title) throw new Error("no single-box row on /hulp");

    const search = page.locator('#hub-hero [role="combobox"]');
    await waitForHydrated(search);
    await search.fill(title);
    await page
      .locator('#hub-hero [role="option"]')
      .filter({ hasText: title })
      .first()
      .click();

    await expect(book.locator("details[open]").first()).toBeVisible();
    await expect(book.locator("details[open] > summary")).toBeFocused();
    await expect(book.locator("details[open]").first()).toBeInViewport();
  });

  test("?member= with an unknown id opens nothing and throws nothing", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await gotoBounded(page, "/hulp?member=does-not-exist");
    const book = page.getByTestId("club-book");
    await waitForHydrated(book.locator("summary").first());

    await expect(book.locator("details[open]")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("Enter and Space toggle a row, the focus ring shows and the open state is announced", async ({
    page,
  }) => {
    await gotoBounded(page, "/hulp");
    const book = page.getByTestId("club-book");
    const summary = book.locator("summary").first();
    await waitForHydrated(summary);
    const row = book.locator("details").first();

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(row).toHaveAttribute("open", "");
    // The global ring: `:focus-visible` matches after a keyboard toggle.
    expect(await summary.evaluate((el) => el.matches(":focus-visible"))).toBe(
      true,
    );
    await expect.poll(() => announcedExpanded(page)).toBe(true);

    await page.keyboard.press("Space");
    await expect(row).not.toHaveAttribute("open", "");
    await expect.poll(() => announcedExpanded(page)).toBe(false);
  });
});
