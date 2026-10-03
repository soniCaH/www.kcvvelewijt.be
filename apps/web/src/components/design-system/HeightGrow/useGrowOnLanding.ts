import { useState } from "react";

/**
 * Should content that just landed grow its own room (`<HeightGrow enter>`)?
 *
 * Yes only when it lands above a list that was already on screen: `listShown`
 * is whether that list is on screen, `landed` whether the content is. The
 * answer is latched at the commit the content appears, from the PREVIOUS
 * commit's `listShown`, so:
 *
 * - content that arrives in the same commit as its list has nothing to make
 *   room above and appears at once;
 * - content replaced by a newer one (its wrapper stays mounted) does not grow
 *   again;
 * - the latch drops when the list is not on screen, so a list that closes and
 *   reopens (a popup) shows the content at once instead of replaying the grow.
 *
 * Render-phase state, so no effect has to run a frame late.
 */
export function useGrowOnLanding(listShown: boolean, landed: boolean): boolean {
  const [latch, setLatch] = useState({
    listShown: false,
    landed: false,
    grow: false,
  });
  if (latch.listShown !== listShown || latch.landed !== landed) {
    setLatch({
      listShown,
      landed,
      grow:
        listShown && landed && (latch.landed ? latch.grow : latch.listShown),
    });
  }
  return latch.grow;
}
