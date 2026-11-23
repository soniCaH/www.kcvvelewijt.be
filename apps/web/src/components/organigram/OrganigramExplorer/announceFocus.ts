import { holderLabel } from "./SpotlightNodeCard";
import { CLUB_ROOT_ID, type SpotlightView } from "./spotlight-tree";

/**
 * Dutch screen-reader sentence for the newly centred node (7o3b a11y model).
 * Opens with the card's own visible words — title, then sub-label — so the
 * name contains the label a voice-control user reads off the card (WCAG 2.5.3,
 * axe `label-content-name-mismatch`, #3690).
 */
export function announceFocus(view: SpotlightView): string {
  const { focus, parent, children, depth, siblings, focusIndex } = view;
  const holders = focus.id === CLUB_ROOT_ID ? "de club" : holderLabel(focus);
  const under = parent ? `, onder ${parent.title}` : "";
  const pos =
    siblings.length > 1
      ? `, positie ${focusIndex + 1} van ${siblings.length}`
      : "";
  const kids =
    children.length === 0
      ? "geen onderliggende functies"
      : `${children.length} ${children.length === 1 ? "onderliggende functie" : "onderliggende functies"}`;
  return `${focus.title} ${holders}. Niveau ${depth}${under}. ${kids}${pos}.`;
}
