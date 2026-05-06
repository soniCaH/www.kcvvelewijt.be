import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JerseyShirt } from "./JerseyShirt";

describe("JerseyShirt", () => {
  it("renders a <figure> with the default aria-label", () => {
    render(<JerseyShirt />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute("aria-label", "KCVV jersey");
  });

  it("respects a custom aria-label", () => {
    render(<JerseyShirt ariaLabel="U11 jersey" letterOverlay="U11" />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute("aria-label", "U11 jersey");
  });

  it("does not render the letter overlay when letterOverlay is omitted", () => {
    const { container } = render(<JerseyShirt />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });

  it("does not render the letter overlay for an empty string", () => {
    const { container } = render(<JerseyShirt letterOverlay="" />);
    expect(container.querySelectorAll("span")).toHaveLength(0);
  });

  it("renders the letter overlay when supplied, marked aria-hidden", () => {
    render(<JerseyShirt letterOverlay="U11" ariaLabel="U11 jersey" />);
    const overlay = screen.getByText("U11");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  it("marks both print-pass layers as aria-hidden so AT only sees the figure label", () => {
    const { container } = render(<JerseyShirt />);
    const hiddenLayers = container.querySelectorAll('[aria-hidden="true"]');
    // 2 print passes (underprint + overprint); no overlay in default render.
    expect(hiddenLayers).toHaveLength(2);
  });

  it("renders all stripe + collar + outline paths verbatim from the shared paths module", () => {
    const { container } = render(<JerseyShirt />);
    // 1 underprint fill + 1 outline + 1 V-collar + 4 stripes = 7 paths total.
    const paths = container.querySelectorAll("path");
    expect(paths).toHaveLength(7);
  });
});
