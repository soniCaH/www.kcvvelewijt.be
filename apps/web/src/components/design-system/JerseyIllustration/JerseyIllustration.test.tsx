import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JerseyIllustration } from "./JerseyIllustration";

describe("JerseyIllustration", () => {
  it("renders an aria-hidden wrapper with the default test id and cream-soft ground", () => {
    render(<JerseyIllustration variant="hero" />);
    const wrapper = screen.getByTestId("jersey-illustration");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper).toHaveClass("bg-cream-soft");
  });

  it("forwards a custom data-testid (so each consumer keeps its existing id)", () => {
    render(
      <JerseyIllustration
        variant="card"
        data-testid="player-card-illustration"
      />,
    );
    expect(screen.getByTestId("player-card-illustration")).toBeInTheDocument();
    expect(screen.queryByTestId("jersey-illustration")).toBeNull();
  });

  it("renders the full two-pass figure geometry from the shared paths module", () => {
    const { container } = render(<JerseyIllustration variant="hero" />);
    // underprint: torso fill + 2 shoulder bumps = 3 paths
    // overprint: torso outline + V-collar + 4 stripes = 6 paths
    expect(container.querySelectorAll("path")).toHaveLength(9);
    // head ellipse drawn once per pass
    expect(container.querySelectorAll("ellipse")).toHaveLength(2);
  });

  it("applies the hero variant positioning + 3/2px overprint offset", () => {
    render(<JerseyIllustration variant="hero" />);
    const wrapper = screen.getByTestId("jersey-illustration");
    expect(wrapper).toHaveClass("relative", "h-full", "w-full");
    const hasHeroOffset = Array.from(wrapper.querySelectorAll("div")).some(
      (d) =>
        d.className.includes("translate-x-[3px]") &&
        d.className.includes("translate-y-[2px]"),
    );
    expect(hasHeroOffset).toBe(true);
  });

  it("applies the card variant positioning + 2/1px overprint offset", () => {
    render(<JerseyIllustration variant="card" />);
    const wrapper = screen.getByTestId("jersey-illustration");
    expect(wrapper).toHaveClass("absolute", "inset-0");
    const hasCardOffset = Array.from(wrapper.querySelectorAll("div")).some(
      (d) =>
        d.className.includes("translate-x-[2px]") &&
        d.className.includes("translate-y-[1px]"),
    );
    expect(hasCardOffset).toBe(true);
  });

  it("merges a custom className onto the wrapper", () => {
    render(<JerseyIllustration variant="card" className="opacity-50" />);
    expect(screen.getByTestId("jersey-illustration")).toHaveClass("opacity-50");
  });
});
