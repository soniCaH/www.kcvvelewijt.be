import { scrollIntoViewMotionSafe } from "@/lib/utils/scroll-into-view";

/**
 * The one "open this row" action of the `/hulp` clubboek. The finder's
 * "Toon in structuur →", a person picked in the hub search, the explorer's
 * "Contactgegevens" and a shared `?member=` link all end here.
 *
 * Finds the row by box id (a merged row answers to every box in it), opens its
 * `<details>`, scrolls it into view — `html`'s `scroll-padding-top` supplies the
 * sticky-header offset — and moves focus to its summary. The row's own
 * `toggle` handler fires the analytics event, so every way of opening a row
 * is counted in one place.
 *
 * A box that only has a key-figure card (the board's Voorzitter, Secretaris,
 * Penningmeester, Gerechtigd correspondent) has no ledger row: its card already
 * shows the contact, so the action scrolls to the card and focuses it instead.
 *
 * Returns whether a row or card was found, so a caller outside the page
 * (Storybook) can fall back to a plain link.
 */
export function openStructureRow(nodeId: string): boolean {
  const row = Array.from(
    document.querySelectorAll<HTMLDetailsElement>("details[data-node-ids]"),
  ).find((el) => el.dataset.nodeIds?.split(" ").includes(nodeId));
  if (row) {
    row.open = true;
    row.querySelector("summary")?.focus({ preventScroll: true });
    scrollIntoViewMotionSafe(row, { block: "start" });
    return true;
  }

  const card = Array.from(
    document.querySelectorAll<HTMLElement>("[data-key-node-id]"),
  ).find((el) => el.dataset.keyNodeId === nodeId);
  if (!card) return false;
  card.focus({ preventScroll: true });
  scrollIntoViewMotionSafe(card, { block: "center" });
  return true;
}
