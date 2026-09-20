/**
 * Match strip parity guard (#3023).
 *
 * `page.tsx` mounts a full-bleed `<MatchStripSlot />` above the hero
 * container; this route's `loading.tsx` had no equivalent, so the page
 * shifted down by the strip's height on resolve independent of the
 * up-link chip's own (#2877-fixed) offset.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MatchStripSkeleton } from "@/components/layout/MatchStrip/MatchStripSkeleton";
import TeamDetailLoading from "./loading";

describe("Team detail loading skeleton — strip parity (#3023)", () => {
  it("renders the same MatchStripSkeleton markup the page's MatchStripSlot falls back to, before the up-link", () => {
    const { container: stripOnly } = render(<MatchStripSkeleton />);
    const stripHtml = stripOnly.innerHTML;

    const { container } = render(<TeamDetailLoading />);
    expect(container.innerHTML).toContain(stripHtml);

    const stripIndex = container.innerHTML.indexOf(stripHtml);
    const heroIndex = container.innerHTML.indexOf('href="/ploegen"');
    expect(stripIndex).toBeGreaterThan(-1);
    expect(stripIndex).toBeLessThan(heroIndex);
  });
});
