import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MatchStripSkeleton } from "./MatchStripSkeleton";

describe("MatchStripSkeleton", () => {
  it("renders a pulsing placeholder bar", () => {
    const { container } = render(<MatchStripSkeleton />);
    const skeleton = container.firstElementChild;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton?.className).toContain("animate-pulse");
  });

  it("reserves the same height as the real strip (min-h-[40px])", () => {
    const { container } = render(<MatchStripSkeleton />);
    const skeleton = container.firstElementChild;
    expect(skeleton?.className).toContain("min-h-[40px]");
  });
});
