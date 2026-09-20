import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MatchStripSkeleton } from "./MatchStripSkeleton";

describe("MatchStripSkeleton", () => {
  it("renders a pulsing placeholder bar that respects reduced motion", () => {
    const { container } = render(<MatchStripSkeleton />);
    const skeleton = container.firstElementChild;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton?.className).toContain("motion-safe:animate-pulse");
  });

  it("reserves min-h-[40px] — exact only for a single-row real strip (result or fixture alone), not the common two-row mobile case (#3027)", () => {
    const { container } = render(<MatchStripSkeleton />);
    const skeleton = container.firstElementChild;
    expect(skeleton?.className).toContain("min-h-[40px]");
  });
});
