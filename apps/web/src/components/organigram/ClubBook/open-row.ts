import { scrollIntoViewMotionSafe } from "@/lib/utils/scroll-into-view";
import {
  trackMemberClicked,
  type ViewType,
} from "@/hooks/useOrganigramAnalytics";

/**
 * The one "open this row" action of the `/hulp` clubboek. The finder's
 * "Toon in structuur →", a person picked in the hub search, the explorer's
 * "Contactgegevens" and a shared `?member=` link all end here.
 *
 * What a box opens onto, in order:
 * - its ledger **row** (a merged row answers to every box in it): the
 *   `<details>` opens, scrolls into view — `html`'s `scroll-padding-top`
 *   supplies the sticky-header offset — and its summary takes focus. The row's
 *   `toggle` handler fires `organigram_member_clicked` for this open, with the
 *   `view` handed over here (a direct "+" click defaults to "cards").
 * - a **key-figure card** or the **Raad van bestuur** line (the bestuur boxes
 *   have no ledger row; the card already shows the contact): scrolled to and
 *   focused, and the same event fired here, since nothing toggles.
 *
 * `hasStructureTarget` answers the same question without acting, so a caller
 * can offer the action only for a box that has somewhere to go.
 */

type Target =
  | { kind: "row"; el: HTMLDetailsElement }
  | { kind: "card"; el: HTMLElement; memberId: string | undefined };

function findTarget(nodeId: string): Target | null {
  const row = Array.from(
    document.querySelectorAll<HTMLDetailsElement>("details[data-node-ids]"),
  ).find((el) => el.dataset.nodeIds?.split(" ").includes(nodeId));
  if (row) return { kind: "row", el: row };

  const card = Array.from(
    document.querySelectorAll<HTMLElement>("[data-key-node-id]"),
  ).find((el) => el.dataset.keyNodeId === nodeId);
  return card
    ? { kind: "card", el: card, memberId: card.dataset.keyMemberId }
    : null;
}

export function hasStructureTarget(nodeId: string): boolean {
  return findTarget(nodeId) !== null;
}

/** Returns whether there was a row or card to open, so a caller can fall back. */
export function openStructureRow(
  nodeId: string,
  view: ViewType = "cards",
): boolean {
  const target = findTarget(nodeId);
  if (!target) return false;

  if (target.kind === "row") {
    // Only an open that will toggle: a row already open fires no event, and the
    // hint would otherwise outlive it and colour the next click.
    if (!target.el.open) target.el.dataset.openView = view;
    target.el.open = true;
    target.el.querySelector("summary")?.focus({ preventScroll: true });
    scrollIntoViewMotionSafe(target.el, { block: "start" });
    return true;
  }

  target.el.focus({ preventScroll: true });
  scrollIntoViewMotionSafe(target.el, { block: "center" });
  trackMemberClicked(
    { members: target.memberId ? [{ id: target.memberId }] : [] },
    view,
  );
  return true;
}
