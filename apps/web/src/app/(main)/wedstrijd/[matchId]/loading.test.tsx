/**
 * Match Detail Loading Skeleton — Mobile Overflow Guard
 *
 * Regression guard for #2299: the scoreboard row hard-coded fixed-width
 * placeholders (`w-10` crest + `w-32` name) with no `min-w-0` / `shrink-0`, so
 * each `1fr` grid track's min-content (~180px) floored the row near 456px and
 * forced horizontal scroll at 320/375/414. The real `MatchHero` `TeamSlot`
 * shrinks below its content via `min-w-0` rows, `shrink-0` crests, and a
 * `min-w-0 flex-1` truncating name — the skeleton must mirror that.
 *
 * jsdom cannot measure layout, so this asserts the shrink-enabling classes are
 * present rather than pixel widths. The overflow itself was verified in a
 * headless Chromium (`document.scrollingElement.scrollWidth === innerWidth` at
 * 320/375/414) — see the PR description.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import WedstrijdLoading from "./loading";

/** The two `flex` team-slot rows inside the `1fr_auto_1fr` scoreboard grid. */
const getTeamRows = (container: HTMLElement): HTMLElement[] => {
  const scoreboard = container.querySelector<HTMLElement>(
    '[class*="1fr_auto_1fr"]',
  );
  expect(scoreboard).not.toBeNull();
  return Array.from(
    scoreboard!.querySelectorAll<HTMLElement>(":scope > div"),
  ).filter((el) => el.className.split(/\s+/).includes("flex"));
};

describe("Match detail loading skeleton — scoreboard overflow guard", () => {
  it("renders two team-slot rows that can shrink below content width (min-w-0)", () => {
    const { container } = render(<WedstrijdLoading />);
    const rows = getTeamRows(container);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.className.split(/\s+/)).toContain("min-w-0");
    }
  });

  it("keeps team crest placeholders at a fixed size (shrink-0)", () => {
    const { container } = render(<WedstrijdLoading />);
    for (const row of getTeamRows(container)) {
      const crest = row.querySelector<HTMLElement>(".rounded-full");
      expect(crest).not.toBeNull();
      expect(crest!.className.split(/\s+/)).toContain("shrink-0");
    }
  });

  it("lets team-name placeholders flex instead of a fixed w-32", () => {
    const { container } = render(<WedstrijdLoading />);
    for (const row of getTeamRows(container)) {
      const name = Array.from(
        row.querySelectorAll<HTMLElement>(":scope > div"),
      ).find((el) => !el.className.includes("rounded-full"));
      expect(name).not.toBeUndefined();
      const tokens = name!.className.split(/\s+/);
      expect(tokens).toContain("flex-1");
      expect(tokens).toContain("min-w-0");
      // The fixed width that caused the overflow must be gone (max-w-32 is fine).
      expect(tokens).not.toContain("w-32");
    }
  });
});
