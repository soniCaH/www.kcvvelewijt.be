/**
 * Match strip + container parity guard (#3023).
 *
 * `page.tsx` mounts a full-bleed `<MatchStripSlot />` above the hero
 * container; this route's `loading.tsx` had no equivalent, so the page
 * shifted down by the strip's height on resolve. It also disagreed with the
 * page on the hero container's field colour and bottom padding (#2877 fixed
 * the top offset; these two were untouched by that ticket).
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MatchStripSkeleton } from "@/components/layout/MatchStrip/MatchStripSkeleton";
import WedstrijdLoading from "./loading";

describe("Match detail loading skeleton — strip + container parity (#3023)", () => {
  it("renders the same MatchStripSkeleton markup the page's MatchStripSlot falls back to, before the hero", () => {
    const { container: stripOnly } = render(<MatchStripSkeleton />);
    const stripHtml = stripOnly.innerHTML;

    const { container } = render(<WedstrijdLoading />);
    expect(container.innerHTML).toContain(stripHtml);

    const stripIndex = container.innerHTML.indexOf(stripHtml);
    const heroIndex = container.innerHTML.indexOf('href="/kalender"');
    expect(stripIndex).toBeGreaterThan(-1);
    expect(stripIndex).toBeLessThan(heroIndex);
  });

  it("hero container matches the page's field colour and bottom padding, not the stale bg-cream-soft/pb-8 pair", () => {
    const { container } = render(<WedstrijdLoading />);
    const hero = container.querySelector("section");
    expect(hero).not.toBeNull();
    const classes = hero!.className.split(/\s+/);
    expect(classes).not.toContain("bg-cream-soft");
    expect(classes).not.toContain("pb-8");
    expect(classes).toContain("pb-12");
    expect(classes).toContain("lg:pb-16");
  });
});
